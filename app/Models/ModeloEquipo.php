<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class ModeloEquipo
{
    public static function all(?string $tipoCodigo = null): array
    {
        $sql = 'SELECT id, tipo_codigo, nombre FROM modelos_equipo WHERE activo = 1';
        $params = [];
        if ($tipoCodigo !== null && $tipoCodigo !== '') {
            $sql .= ' AND tipo_codigo = :tipo';
            $params['tipo'] = $tipoCodigo;
        }
        $sql .= ' ORDER BY tipo_codigo ASC, nombre ASC';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function create(string $tipoCodigo, string $nombre): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO modelos_equipo (tipo_codigo, nombre, activo)
             VALUES (:tipo, :nombre, 1)
             ON DUPLICATE KEY UPDATE activo = 1'
        );
        $stmt->execute([
            'tipo' => $tipoCodigo,
            'nombre' => $nombre,
        ]);
    }

    public static function delete(string $tipoCodigo, string $nombre): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE modelos_equipo SET activo = 0
             WHERE tipo_codigo = :tipo AND nombre = :nombre'
        );
        $stmt->execute([
            'tipo' => $tipoCodigo,
            'nombre' => $nombre,
        ]);
    }
}

