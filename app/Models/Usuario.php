<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class Usuario
{
    public static function findByUsuario(string $usuario): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, usuario, password_hash, nombre, activo FROM usuarios WHERE usuario = :u LIMIT 1'
        );
        $stmt->execute(['u' => $usuario]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
}
