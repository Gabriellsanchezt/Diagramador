<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class Equipo
{
    public static function bySede(int $sedeId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT e.*, z.nombre AS zona_nombre, z.tipo AS zona_tipo, z.color_hex AS zona_color,
                    z.piso_id AS zona_piso_id, p.nombre AS piso_nombre
             FROM equipos e
             LEFT JOIN sede_zonas z ON z.id = e.zona_id
             LEFT JOIN sede_zonas p ON p.id = z.piso_id
             WHERE e.sede_id = :s
             ORDER BY e.id ASC'
        );
        $stmt->execute(['s' => $sedeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function find(int $id, int $sedeId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM equipos WHERE id = :id AND sede_id = :s LIMIT 1'
        );
        $stmt->execute(['id' => $id, 's' => $sedeId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function ipDuplicada(int $sedeId, string $ip, ?int $excludeId = null): bool
    {
        $sql = 'SELECT 1 FROM equipos WHERE sede_id = :s AND ip = :ip';
        $params = ['s' => $sedeId, 'ip' => $ip];
        if ($excludeId) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = Database::connection()->prepare($sql . ' LIMIT 1');
        $stmt->execute($params);
        return (bool) $stmt->fetchColumn();
    }

    public static function puertosOcupadosPadre(int $sedeId, int $padreId, ?int $excludeId = null): int
    {
        $sql = 'SELECT COALESCE(SUM(puertos_usados), 0) FROM equipos
                WHERE sede_id = :s AND padre_id = :p AND tipo_codigo = \'PC\'';
        $params = ['s' => $sedeId, 'p' => $padreId];
        if ($excludeId) {
            $sql .= ' AND id != :id';
            $params['id'] = $excludeId;
        }
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public static function create(array $d): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO equipos (sede_id, zona_id, tipo_codigo, switch_capa, modelo, ip, generacion,
             velocidad, puertos_usados, medio_enlace, padre_id)
             VALUES (:sede, :zona, :tipo, :capa, :modelo, :ip, :gen, :vel, :puertos, :medio, :padre)'
        );
        $stmt->execute([
            'sede'    => $d['sede_id'],
            'zona'    => $d['zona_id'] ?: null,
            'tipo'    => $d['tipo_codigo'],
            'capa'    => $d['switch_capa'] ?: null,
            'modelo'  => $d['modelo'],
            'ip'      => $d['ip'] ?: null,
            'gen'     => $d['generacion'] ?: null,
            'vel'     => $d['velocidad'] ?: null,
            'puertos' => $d['puertos_usados'] ?: null,
            'medio'   => $d['medio_enlace'],
            'padre'   => $d['padre_id'] ?: null,
        ]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function update(int $id, array $d): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE equipos SET zona_id=:zona, tipo_codigo=:tipo, switch_capa=:capa, modelo=:modelo,
             ip=:ip, generacion=:gen, velocidad=:vel, puertos_usados=:puertos, medio_enlace=:medio,
             padre_id=:padre WHERE id=:id AND sede_id=:sede'
        );
        $stmt->execute([
            'zona'    => $d['zona_id'] ?: null,
            'tipo'    => $d['tipo_codigo'],
            'capa'    => $d['switch_capa'] ?: null,
            'modelo'  => $d['modelo'],
            'ip'      => $d['ip'] ?: null,
            'gen'     => $d['generacion'] ?: null,
            'vel'     => $d['velocidad'] ?: null,
            'puertos' => $d['puertos_usados'] ?: null,
            'medio'   => $d['medio_enlace'],
            'padre'   => $d['padre_id'] ?: null,
            'id'      => $id,
            'sede'    => $d['sede_id'],
        ]);
    }

    public static function delete(int $id, int $sedeId): void
    {
        $pdo = Database::connection();
        $pdo->prepare('UPDATE equipos SET padre_id = NULL WHERE padre_id = :id AND sede_id = :s')
            ->execute(['id' => $id, 's' => $sedeId]);
        $pdo->prepare('DELETE FROM equipos WHERE id = :id AND sede_id = :s')
            ->execute(['id' => $id, 's' => $sedeId]);
    }
}
