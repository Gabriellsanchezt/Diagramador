<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class Sede
{
    public static function listActive(string $q = ''): array
    {
        $sql = 'SELECT id, nombre, rif, categoria_cable FROM sedes WHERE activa = 1';
        $params = [];
        if ($q !== '') {
            $sql .= ' AND nombre LIKE :q';
            $params['q'] = '%' . $q . '%';
        }
        $sql .= ' ORDER BY nombre ASC';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM sedes WHERE id = :id AND activa = 1 LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function create(array $data): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO sedes (nombre, rif, categoria_cable) VALUES (:nombre, :rif, :cable)'
        );
        $stmt->execute([
            'nombre' => $data['nombre'],
            'rif'    => $data['rif'] ?: null,
            'cable'  => $data['categoria_cable'],
        ]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function updateDatos(int $id, ?string $rif, string $categoriaCable): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE sedes SET rif = :rif, categoria_cable = :cable WHERE id = :id AND activa = 1'
        );
        $stmt->execute([
            'rif'   => $rif !== null && $rif !== '' ? strtoupper(trim($rif)) : null,
            'cable' => $categoriaCable,
            'id'    => $id,
        ]);
    }

    public static function existsNombre(string $nombre, ?int $excludeId = null): bool
    {
        $sql = 'SELECT 1 FROM sedes WHERE nombre = :n';
        $params = ['n' => $nombre];
        if ($excludeId) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = Database::connection()->prepare($sql . ' LIMIT 1');
        $stmt->execute($params);
        return (bool) $stmt->fetchColumn();
    }
}
