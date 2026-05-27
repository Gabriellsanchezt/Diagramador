<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class TipoEquipo
{
    public static function allActive(): array
    {
        $stmt = Database::connection()->query(
            'SELECT * FROM tipos_equipo WHERE activo = 1 ORDER BY orden ASC'
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function findByCodigo(string $codigo): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM tipos_equipo WHERE codigo = :c AND activo = 1 LIMIT 1'
        );
        $stmt->execute(['c' => $codigo]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function create(
        string $codigo,
        string $etiqueta,
        bool $requiereIp,
        bool $requiereVelocidad,
        bool $requierePuertos,
        bool $esSwitch,
        ?int $puertosMax
    ): void {
        $orden = self::nextOrden();
        $stmt = Database::connection()->prepare(
            'INSERT INTO tipos_equipo (
                codigo, etiqueta, requiere_ip, requiere_velocidad, requiere_puertos,
                es_switch, puertos_max, orden, activo
             ) VALUES (
                :codigo, :etiqueta, :ip, :vel, :puertos, :sw, :max, :orden, 1
             )
             ON DUPLICATE KEY UPDATE
                etiqueta = VALUES(etiqueta),
                requiere_ip = VALUES(requiere_ip),
                requiere_velocidad = VALUES(requiere_velocidad),
                requiere_puertos = VALUES(requiere_puertos),
                es_switch = VALUES(es_switch),
                puertos_max = VALUES(puertos_max),
                orden = VALUES(orden),
                activo = 1'
        );
        $stmt->execute([
            'codigo'   => $codigo,
            'etiqueta' => $etiqueta,
            'ip'       => $requiereIp ? 1 : 0,
            'vel'      => $requiereVelocidad ? 1 : 0,
            'puertos'  => $requierePuertos ? 1 : 0,
            'sw'       => $esSwitch ? 1 : 0,
            'max'      => $esSwitch ? $puertosMax : null,
            'orden'    => $orden,
        ]);
    }

    public static function deactivate(string $codigo): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE tipos_equipo SET activo = 0 WHERE codigo = :c'
        );
        $stmt->execute(['c' => $codigo]);
    }

    public static function hasEquipos(string $codigo): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM equipos WHERE tipo_codigo = :c LIMIT 1'
        );
        $stmt->execute(['c' => $codigo]);
        return (bool) $stmt->fetchColumn();
    }

    private static function nextOrden(): int
    {
        $stmt = Database::connection()->query(
            'SELECT COALESCE(MAX(orden), 0) + 10 FROM tipos_equipo'
        );
        return (int) $stmt->fetchColumn();
    }
}
