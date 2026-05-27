<?php
declare(strict_types=1);
ob_start();
$root = dirname(__DIR__);
$errors = [];
$warnings = [];
$passed = 0;

function ok(string $msg): void
{
    global $passed;
    $passed++;
    echo "  OK  $msg\n";
}

function fail(string $msg): void
{
    global $errors;
    $errors[] = $msg;
    echo " FAIL $msg\n";
}

function warn(string $msg): void
{
    global $warnings;
    $warnings[] = $msg;
    echo " WARN $msg\n";
}

echo "=== Diagramador — validación ===\n\n";

// 1. Sintaxis PHP
echo "[1] Sintaxis PHP\n";
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
);
foreach ($iterator as $file) {
    if ($file->getExtension() !== 'php') {
        continue;
    }
    $path = $file->getPathname();
    if (str_contains($path, DIRECTORY_SEPARATOR . 'tools' . DIRECTORY_SEPARATOR)) {
        continue;
    }
    exec('php -l ' . escapeshellarg($path) . ' 2>&1', $out, $code);
    if ($code !== 0) {
        fail(implode(' ', $out));
    }
}
ok('Todos los archivos PHP compilan');

// 2. Archivos requeridos
echo "\n[2] Archivos esenciales\n";
$required = [
    'bootstrap.php',
    'index.php',
    'public/index.php',
    'public/assets/css/app.css',
    'public/assets/js/common.js',
    'public/assets/js/diagramador.js',
    'config/app.php',
    'config/database.php',
    'sql/schema.sql',
    'app/Core/Url.php',
    'app/Controllers/AuthController.php',
    'app/Controllers/ApiController.php',
    'app/Models/ModeloEquipo.php',
    'app/Views/login.php',
    'app/Views/diagramador.php',
];
foreach ($required as $rel) {
    if (!is_file($root . '/' . $rel)) {
        fail("Falta: $rel");
    }
}
if (empty(array_filter($required, fn($r) => !is_file($root . '/' . $r)))) {
    ok('Estructura de archivos completa');
}

// 3. Bootstrap + BD
echo "\n[3] Base de datos\n";
$_SERVER['SCRIPT_NAME'] = '/Diagramador/public/index.php';
require $root . '/bootstrap.php';

try {
    $pdo = App\Core\Database::connection();
    ok('Conexión MySQL');

    $tables = ['usuarios', 'sedes', 'sede_zonas', 'tipos_equipo', 'modelos_equipo', 'equipos'];
    foreach ($tables as $t) {
        $stmt = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t));
        if (!$stmt->fetchColumn()) {
            fail("Tabla ausente: $t — importe sql/schema.sql");
        }
    }
    if (empty(array_filter($tables, function ($t) use ($pdo) {
        $stmt = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t));
        return !$stmt->fetchColumn();
    }))) {
        ok('Tablas: ' . implode(', ', $tables));
    }

    $cols = $pdo->query("SHOW COLUMNS FROM sede_zonas LIKE 'piso_id'")->fetch();
    if (!$cols) {
        fail('Columna sede_zonas.piso_id ausente — ejecute sql/migracion_areas_dependen_piso.sql');
    } else {
        ok('Columna piso_id en sede_zonas');
    }

    $admin = App\Models\Usuario::findByUsuario('admin');
    if (!$admin) {
        fail('Usuario admin no existe en BD');
    } elseif (!password_verify('berilion23', $admin['password_hash'])) {
        fail('Contraseña admin no coincide con berilion23');
    } else {
        ok('Usuario admin / berilion23');
    }

    $tipos = App\Models\TipoEquipo::allActive();
    if (count($tipos) < 10) {
        warn('Pocos tipos_equipo (' . count($tipos) . ')');
    } else {
        ok(count($tipos) . ' tipos de equipo');
    }

    $sedes = App\Models\Sede::listActive();
    ok(count($sedes) . ' sedes activas');
} catch (Throwable $e) {
    fail('BD: ' . $e->getMessage());
}

// 4. Rutas
echo "\n[4] Rutas (Url)\n";
$base = App\Core\Url::basePath();
if ($base === '') {
    warn('basePath vacío (¿public en raíz del host?)');
} else {
    ok("basePath detectado: $base");
}
$loginRoute = App\Core\Url::route('login-api');
if (!str_contains($loginRoute, 'index.php?page=login-api')) {
    fail("Ruta login incorrecta: $loginRoute");
} else {
    ok("route login-api: $loginRoute");
}

// 5. Simular login API
echo "\n[5] Login API (simulado)\n";
$_SESSION = [];
$key = App\Core\Url::appConfig()['session_key'];

ob_start();
$_SERVER['REQUEST_METHOD'] = 'POST';
$inputBackup = file_get_contents('php://input');
// Simular AuthController
$controller = new App\Controllers\AuthController();
// Direct test via model + session
$row = App\Models\Usuario::findByUsuario('admin');
if ($row && password_verify('berilion23', $row['password_hash'])) {
    $_SESSION[$key] = ['id' => (int)$row['id'], 'usuario' => 'admin', 'nombre' => 'Administrador'];
    ok('Sesión simulada creada');
} else {
    fail('No se pudo simular login');
}
ob_end_clean();

// 6. API lógica (sin exit de json)
echo "\n[6] Modelos / lógica API\n";
$tiposData = App\Models\TipoEquipo::allActive();
if (count($tiposData) < 1) {
    fail('TipoEquipo::allActive vacío');
} else {
    ok('TipoEquipo::allActive');
}

$sedesData = App\Models\Sede::listActive('');
if (count($sedesData) < 1) {
    fail('Sede::listActive vacío');
} else {
    ok('Sede::listActive');
}

$firstSede = $sedesData[0];
$det = App\Models\Sede::find((int) $firstSede['id']);
if (!$det) {
    fail('Sede::find falló');
} else {
    ok('Sede::find id=' . $firstSede['id']);
}
App\Models\SedeZona::bySede((int) $firstSede['id']);
ok('SedeZona::bySede');
App\Models\Equipo::bySede((int) $firstSede['id']);
ok('Equipo::bySede');

// Test sede crear + equipo (rollback manual con delete)
echo "\n[7] Flujo sede + equipo (prueba)\n";
$testNombre = 'SEDE_TEST_VALIDACION_' . time();
ob_start();
file_put_contents('php://memory', '');
// Use direct model instead
try {
    $sedeId = App\Models\Sede::create([
        'nombre' => $testNombre,
        'rif' => null,
        'categoria_cable' => 'Cat6',
    ]);
    App\Models\SedeZona::createFromPisos($sedeId, [
        ['nombre' => 'Piso Test', 'areas' => [['nombre' => 'Area Test']]],
    ]);
    ok("Sede test creada id=$sedeId");

    $equipoId = App\Models\Equipo::create([
        'sede_id' => $sedeId,
        'zona_id' => null,
        'tipo_codigo' => 'Router',
        'switch_capa' => null,
        'modelo' => 'MikroTik Test',
        'ip' => null,
        'generacion' => null,
        'velocidad' => 'Gigabit (1000 Mbps)',
        'puertos_usados' => null,
        'medio_enlace' => 'cableado',
        'padre_id' => null,
    ]);
    ok("Equipo test creado id=$equipoId");

    $pdo->exec("DELETE FROM equipos WHERE sede_id = $sedeId");
    $pdo->exec("DELETE FROM sede_zonas WHERE sede_id = $sedeId");
    $pdo->exec("DELETE FROM sedes WHERE id = $sedeId");
    ok('Datos de prueba eliminados');
} catch (Throwable $e) {
    fail('Flujo CRUD: ' . $e->getMessage());
}

// 8. Assets referenciados en vistas
echo "\n[8] Assets\n";
$css = file_get_contents($root . '/public/assets/css/app.css');
if (strlen($css) < 1000) {
    fail('app.css demasiado pequeño o vacío');
} else {
    ok('app.css (' . round(strlen($css) / 1024, 1) . ' KB)');
}
foreach (['common.js', 'diagramador.js'] as $js) {
    $p = $root . '/public/assets/js/' . $js;
    if (!is_file($p) || filesize($p) < 100) {
        fail("$js inválido");
    } else {
        ok("$js OK");
    }
}

// 9. HTTP local (si Apache responde)
echo "\n[9] HTTP local (opcional)\n";
$urls = [
    'http://127.0.0.1/Berilion/Diagramador/public/index.php',
    'http://localhost/Berilion/Diagramador/public/index.php',
];
$httpOk = false;
foreach ($urls as $url) {
    $ctx = stream_context_create(['http' => ['timeout' => 3, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body !== false && str_contains($body, 'DIAGRAMADOR DE RED')) {
        ok("GET login responde: $url");
        $httpOk = true;

        // POST login
        $post = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => json_encode(['usuario' => 'admin', 'password' => 'berilion23']),
                'timeout' => 5,
                'ignore_errors' => true,
            ],
        ]);
        $apiUrl = str_replace('index.php', 'index.php?page=login-api', $url);
        $resp = @file_get_contents($apiUrl, false, $post);
        if ($resp !== false) {
            $data = json_decode($resp, true);
            if ($data['ok'] ?? false) {
                ok('POST login-api responde JSON ok');
            } else {
                fail('POST login-api: ' . ($data['error'] ?? $resp));
            }
        } else {
            warn('No se pudo probar POST login-api (¿Apache activo?)');
        }
        break;
    }
}
if (!$httpOk) {
    warn('Apache no respondió en rutas Berilion/Diagramador — pruebe manualmente en el navegador');
}

echo "\n=== Resumen ===\n";
echo "Pruebas OK: $passed\n";
echo "Errores: " . count($errors) . "\n";
echo "Advertencias: " . count($warnings) . "\n";
if ($errors) {
    foreach ($errors as $e) {
        echo "  - $e\n";
    }
    exit(1);
}
echo "\nValidación completada sin errores críticos.\n";
exit(0);
