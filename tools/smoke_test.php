<?php
chdir(__DIR__ . '/../public');
$_SERVER['SCRIPT_NAME'] = '/Diagramador/public/index.php';
require __DIR__ . '/../bootstrap.php';
echo 'basePath: ' . App\Core\Url::basePath() . PHP_EOL;
echo 'route: ' . App\Core\Url::route('login-api') . PHP_EOL;
require __DIR__ . '/../bootstrap.php';
$u = App\Models\Usuario::findByUsuario('admin');
echo $u ? "admin found\n" : "admin missing\n";
if ($u) {
    echo password_verify('berilion23', $u['password_hash']) ? "password ok\n" : "password fail\n";
}
