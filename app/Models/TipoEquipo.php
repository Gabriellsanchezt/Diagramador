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
}
