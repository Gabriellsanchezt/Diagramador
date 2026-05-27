<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Validator;
use App\Models\Equipo;
use App\Models\ModeloEquipo;
use App\Models\Sede;
use App\Models\SedeZona;
use App\Models\TipoEquipo;

class ApiController extends Controller
{
    public function dispatch(string $action): void
    {
        $this->requireAuth();

        switch ($action) {
            case 'tipos':
                $this->tipos();
                break;
            case 'sedes':
                $this->sedes();
                break;
            case 'sede-crear':
                $this->sedeCrear();
                break;
            case 'sede-detalle':
                $this->sedeDetalle();
                break;
            case 'sede-actualizar':
                $this->sedeActualizar();
                break;
            case 'zonas':
                $this->zonas();
                break;
            case 'equipos':
                $this->equipos();
                break;
            case 'equipo-guardar':
                $this->equipoGuardar();
                break;
            case 'equipo-eliminar':
                $this->equipoEliminar();
                break;
            case 'puertos-libres':
                $this->puertosLibres();
                break;
            case 'modelos-equipo':
                $this->modelosEquipo();
                break;
            case 'modelo-equipo-crear':
                $this->modeloEquipoCrear();
                break;
            case 'modelo-equipo-eliminar':
                $this->modeloEquipoEliminar();
                break;
            case 'tipo-equipo-crear':
                $this->tipoEquipoCrear();
                break;
            case 'tipo-equipo-eliminar':
                $this->tipoEquipoEliminar();
                break;
            default:
                $this->json(['ok' => false, 'error' => 'Acción no encontrada'], 404);
        }
    }

    private function tipos(): void
    {
        $this->json(['ok' => true, 'data' => TipoEquipo::allActive()]);
    }

    private function sedes(): void
    {
        $q = trim((string) ($_GET['q'] ?? ''));
        $this->json(['ok' => true, 'data' => Sede::listActive($q)]);
    }

    private function sedeCrear(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];

        $nombre = trim((string) ($input['nombre'] ?? ''));
        $rif = trim((string) ($input['rif'] ?? ''));
        $cable = (string) ($input['categoria_cable'] ?? 'No especificado');
        $pisos = $input['pisos'] ?? [];

        if ($err = Validator::nombreSede($nombre)) {
            $this->json(['ok' => false, 'error' => $err], 422);
        }
        if ($rif !== '' && ($err = Validator::rif($rif))) {
            $this->json(['ok' => false, 'error' => $err], 422);
        }
        if (!in_array($cable, ['Cat5e', 'Cat6', 'No especificado'], true)) {
            $this->json(['ok' => false, 'error' => 'Categoría de cableado inválida.'], 422);
        }
        if (Sede::existsNombre($nombre)) {
            $this->json(['ok' => false, 'error' => 'Ya existe una sede con ese nombre.'], 422);
        }

        $pisosValidos = [];
        if (is_array($pisos)) {
            foreach ($pisos as $piso) {
                $nombrePiso = trim((string) ($piso['nombre'] ?? ''));
                if ($nombrePiso === '') {
                    continue;
                }
                $areasValidas = [];
                foreach ($piso['areas'] ?? [] as $area) {
                    $nombreArea = trim((string) ($area['nombre'] ?? ''));
                    if ($nombreArea !== '') {
                        $areasValidas[] = ['nombre' => $nombreArea];
                    }
                }
                $pisosValidos[] = [
                    'nombre' => $nombrePiso,
                    'areas'  => $areasValidas,
                ];
            }
        }

        $id = Sede::create([
            'nombre'           => $nombre,
            'rif'              => $rif,
            'categoria_cable'  => $cable,
        ]);
        if ($pisosValidos) {
            SedeZona::createFromPisos($id, $pisosValidos);
        }

        $sede = Sede::find($id);
        $this->json(['ok' => true, 'data' => $sede, 'zonas' => SedeZona::bySede($id)]);
    }

    private function sedeDetalle(): void
    {
        $id = (int) ($_GET['id'] ?? 0);
        $sede = Sede::find($id);
        if (!$sede) {
            $this->json(['ok' => false, 'error' => 'Sede no encontrada'], 404);
        }
        $this->json([
            'ok'    => true,
            'sede'  => $sede,
            'zonas' => SedeZona::bySede($id),
            'equipos' => Equipo::bySede($id),
        ]);
    }

    private function sedeActualizar(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $id = (int) ($input['sede_id'] ?? 0);
        $rif = trim((string) ($input['rif'] ?? ''));
        $cable = (string) ($input['categoria_cable'] ?? 'No especificado');

        $sede = Sede::find($id);
        if (!$sede) {
            $this->json(['ok' => false, 'error' => 'Sede no encontrada'], 404);
        }
        if ($rif !== '' && ($err = Validator::rif($rif))) {
            $this->json(['ok' => false, 'error' => $err], 422);
        }
        if (!in_array($cable, ['Cat5e', 'Cat6', 'No especificado'], true)) {
            $this->json(['ok' => false, 'error' => 'Categoría de cableado inválida'], 422);
        }

        Sede::updateDatos($id, $rif !== '' ? $rif : null, $cable);
        $this->json(['ok' => true, 'sede' => Sede::find($id)]);
    }

    private function zonas(): void
    {
        $id = (int) ($_GET['sede_id'] ?? 0);
        $this->json(['ok' => true, 'data' => SedeZona::bySede($id)]);
    }

    private function equipos(): void
    {
        $id = (int) ($_GET['sede_id'] ?? 0);
        $this->json(['ok' => true, 'data' => Equipo::bySede($id)]);
    }

    private function equipoGuardar(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $sedeId = (int) ($input['sede_id'] ?? 0);
        $id = (int) ($input['id'] ?? 0);

        if (!Sede::find($sedeId)) {
            $this->json(['ok' => false, 'error' => 'Sede no válida'], 404);
        }

        $tipoCodigo = (string) ($input['tipo_codigo'] ?? '');
        $tipo = TipoEquipo::findByCodigo($tipoCodigo);
        if (!$tipo) {
            $this->json(['ok' => false, 'error' => 'Tipo de equipo inválido'], 422);
        }

        $modelo = trim((string) ($input['modelo'] ?? ''));
        $ip = trim((string) ($input['ip'] ?? ''));
        $medio = ($input['medio_enlace'] ?? 'cableado') === 'inalambrico' ? 'inalambrico' : 'cableado';
        $padreId = !empty($input['padre_id']) ? (int) $input['padre_id'] : null;
        $zonaId = !empty($input['zona_id']) ? (int) $input['zona_id'] : null;

        if ($zonaId) {
            $zona = SedeZona::find($zonaId, $sedeId);
            if (!$zona) {
                $this->json(['ok' => false, 'error' => 'Piso o área no válido para esta sede'], 422);
            }
            if ($zona['tipo'] === 'area' && empty($zona['piso_id'])) {
                $this->json(['ok' => false, 'error' => 'El área debe estar asociada a un piso'], 422);
            }
        }

        if ((int) $tipo['requiere_ip'] === 1) {
            if ($err = Validator::ipv4($ip)) {
                $this->json(['ok' => false, 'error' => $err], 422);
            }
            if (Equipo::ipDuplicada($sedeId, $ip, $id ?: null)) {
                $this->json(['ok' => false, 'error' => 'La IP ya está asignada en esta sede.'], 422);
            }
        } else {
            $ip = '';
        }

        $switchCapa = null;
        if ((int) $tipo['es_switch'] === 1) {
            $capa = (string) ($input['switch_capa'] ?? 'acceso');
            if (!in_array($capa, ['acceso', 'distribucion', 'nucleo'], true)) {
                $this->json(['ok' => false, 'error' => 'Capa de switch inválida'], 422);
            }
            $switchCapa = $capa;
        }

        $puertos = null;
        if ((int) $tipo['requiere_puertos'] === 1) {
            if (!$padreId) {
                $this->json(['ok' => false, 'error' => 'Este equipo debe depender de un equipo padre.'], 422);
            }
            $puertos = (int) ($input['puertos_usados'] ?? 0);
            if ($puertos < 1) {
                $this->json(['ok' => false, 'error' => 'Indique puertos usados válidos.'], 422);
            }
            $padre = Equipo::find($padreId, $sedeId);
            if (!$padre) {
                $this->json(['ok' => false, 'error' => 'Equipo padre no encontrado.'], 422);
            }
            $tipoPadre = TipoEquipo::findByCodigo($padre['tipo_codigo']);
            $max = (int) ($tipoPadre['puertos_max'] ?? 0);
            $ocupados = Equipo::puertosOcupadosPadre($sedeId, $padreId, $id ?: null);
            if ($puertos > max(0, $max - $ocupados)) {
                $this->json(['ok' => false, 'error' => 'Puertos insuficientes en el equipo padre.'], 422);
            }
            $modelo = 'N/A';
        } else {
            if ($modelo === '') {
                $this->json(['ok' => false, 'error' => 'Complete el modelo del equipo.'], 422);
            }
            if ($tipoCodigo === 'Servidor' && !empty($input['generacion'])) {
                $modelo = trim($modelo) . ' (' . trim((string) $input['generacion']) . ')';
            }
        }

        if ($id && $padreId === $id) {
            $this->json(['ok' => false, 'error' => 'Un equipo no puede depender de sí mismo.'], 422);
        }

        $data = [
            'sede_id'        => $sedeId,
            'zona_id'        => $zonaId,
            'tipo_codigo'    => $tipoCodigo,
            'switch_capa'    => $switchCapa,
            'modelo'         => $modelo,
            'ip'             => $ip ?: null,
            'generacion'     => $input['generacion'] ?? null,
            'velocidad'      => $input['velocidad'] ?? null,
            'puertos_usados' => $puertos,
            'medio_enlace'   => $medio,
            'padre_id'       => $padreId,
        ];

        if ($id) {
            Equipo::update($id, $data);
        } else {
            $id = Equipo::create($data);
        }

        $this->json(['ok' => true, 'id' => $id, 'data' => Equipo::bySede($sedeId)]);
    }

    private function equipoEliminar(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $sedeId = (int) ($input['sede_id'] ?? 0);
        $id = (int) ($input['id'] ?? 0);
        Equipo::delete($id, $sedeId);
        $this->json(['ok' => true, 'data' => Equipo::bySede($sedeId)]);
    }

    private function puertosLibres(): void
    {
        $sedeId = (int) ($_GET['sede_id'] ?? 0);
        $padreId = (int) ($_GET['padre_id'] ?? 0);
        $exclude = (int) ($_GET['exclude_id'] ?? 0);

        $padre = Equipo::find($padreId, $sedeId);
        if (!$padre) {
            $this->json(['ok' => false, 'error' => 'Padre no encontrado'], 404);
        }
        $tipoPadre = TipoEquipo::findByCodigo($padre['tipo_codigo']);
        $max = (int) ($tipoPadre['puertos_max'] ?? 0);
        $ocupados = Equipo::puertosOcupadosPadre($sedeId, $padreId, $exclude ?: null);
        $libres = max(0, $max - $ocupados);
        $this->json(['ok' => true, 'max' => $max, 'ocupados' => $ocupados, 'libres' => $libres]);
    }

    private function modelosEquipo(): void
    {
        $tipoCodigo = trim((string) ($_GET['tipo_codigo'] ?? ''));
        if ($tipoCodigo !== '' && !TipoEquipo::findByCodigo($tipoCodigo)) {
            $this->json(['ok' => false, 'error' => 'Tipo de equipo inválido'], 422);
        }
        $this->json([
            'ok' => true,
            'data' => ModeloEquipo::all($tipoCodigo !== '' ? $tipoCodigo : null),
        ]);
    }

    private function modeloEquipoCrear(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $tipoCodigo = trim((string) ($input['tipo_codigo'] ?? ''));
        $nombre = trim((string) ($input['nombre'] ?? ''));

        $tipo = TipoEquipo::findByCodigo($tipoCodigo);
        if (!$tipo) {
            $this->json(['ok' => false, 'error' => 'Tipo de equipo inválido'], 422);
        }
        if ((int) $tipo['requiere_puertos'] === 1) {
            $this->json(['ok' => false, 'error' => 'No se permite registrar modelos para este tipo de equipo'], 422);
        }
        if ($nombre === '' || mb_strlen($nombre) > 120) {
            $this->json(['ok' => false, 'error' => 'Nombre de modelo inválido (1 a 120 caracteres)'], 422);
        }

        ModeloEquipo::create($tipoCodigo, $nombre);
        $this->json(['ok' => true]);
    }

    private function modeloEquipoEliminar(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $tipoCodigo = trim((string) ($input['tipo_codigo'] ?? ''));
        $nombre = trim((string) ($input['nombre'] ?? ''));

        if (!TipoEquipo::findByCodigo($tipoCodigo)) {
            $this->json(['ok' => false, 'error' => 'Tipo de equipo inválido'], 422);
        }
        if ($nombre === '') {
            $this->json(['ok' => false, 'error' => 'Nombre de modelo inválido'], 422);
        }

        ModeloEquipo::delete($tipoCodigo, $nombre);
        $this->json(['ok' => true]);
    }

    private function tipoEquipoCrear(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];

        $etiqueta = trim((string) ($input['etiqueta'] ?? ''));
        if ($etiqueta === '' || mb_strlen($etiqueta) > 80) {
            $this->json(['ok' => false, 'error' => 'Nombre de equipo inválido (1 a 80 caracteres)'], 422);
        }

        $codigo = trim((string) ($input['codigo'] ?? ''));
        if ($codigo === '') {
            $codigo = $etiqueta;
        }
        if (mb_strlen($codigo) > 40) {
            $this->json(['ok' => false, 'error' => 'El identificador no puede superar 40 caracteres'], 422);
        }

        $requiereIp = !empty($input['requiere_ip']);
        $requiereVelocidad = !empty($input['requiere_velocidad']);
        $requierePuertos = !empty($input['requiere_puertos']);
        $esSwitch = !empty($input['es_switch']);

        if ($requierePuertos && $esSwitch) {
            $this->json(['ok' => false, 'error' => 'Un equipo no puede ser switch y estación de trabajo a la vez'], 422);
        }

        $puertosMax = null;
        if ($esSwitch) {
            $puertosMax = (int) ($input['puertos_max'] ?? 0);
            if ($puertosMax < 4 || $puertosMax > 48) {
                $this->json(['ok' => false, 'error' => 'Indique puertos del switch (4 a 48)'], 422);
            }
        }

        TipoEquipo::create(
            $codigo,
            $etiqueta,
            $requiereIp,
            $requiereVelocidad,
            $requierePuertos,
            $esSwitch,
            $puertosMax
        );

        $this->json(['ok' => true, 'data' => TipoEquipo::allActive()]);
    }

    private function tipoEquipoEliminar(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $codigo = trim((string) ($input['codigo'] ?? ''));

        if ($codigo === '' || mb_strlen($codigo) > 40) {
            $this->json(['ok' => false, 'error' => 'Tipo de equipo inválido'], 422);
        }
        if ($codigo === 'PC') {
            $this->json(['ok' => false, 'error' => 'No se puede eliminar Estación de Trabajo (PC)'], 422);
        }
        if (!TipoEquipo::findByCodigo($codigo)) {
            $this->json(['ok' => false, 'error' => 'Tipo de equipo no encontrado'], 422);
        }
        if (TipoEquipo::hasEquipos($codigo)) {
            $this->json(['ok' => false, 'error' => 'Hay equipos de esta sede usando este tipo. Elimínelos antes.'], 422);
        }

        TipoEquipo::deactivate($codigo);
        $this->json(['ok' => true, 'data' => TipoEquipo::allActive()]);
    }
}
