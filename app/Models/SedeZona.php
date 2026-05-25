<?php

namespace App\Models;

use App\Core\Database;
use PDO;

class SedeZona
{
    public static function bySede(int $sedeId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT z.*, p.nombre AS piso_nombre
             FROM sede_zonas z
             LEFT JOIN sede_zonas p ON p.id = z.piso_id
             WHERE z.sede_id = :s AND z.activa = 1
             ORDER BY
               CASE WHEN z.tipo = \'piso\' THEN z.orden ELSE COALESCE(p.orden, 999) END,
               CASE WHEN z.tipo = \'area\' THEN z.orden ELSE 0 END,
               z.id ASC'
        );
        $stmt->execute(['s' => $sedeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * @param array<int, array{nombre: string, areas?: array<int, array{nombre: string}>}> $pisos
     */
    public static function createFromPisos(int $sedeId, array $pisos): void
    {
        $colores = ['#3b82f6', '#0f766e', '#d97706', '#991b1b', '#7c3aed', '#0891b2'];
        $pdo = Database::connection();

        $stmtPiso = $pdo->prepare(
            'INSERT INTO sede_zonas (sede_id, piso_id, nombre, tipo, orden, color_hex)
             VALUES (:s, NULL, :n, \'piso\', :o, :c)'
        );
        $stmtArea = $pdo->prepare(
            'INSERT INTO sede_zonas (sede_id, piso_id, nombre, tipo, orden, color_hex)
             VALUES (:s, :piso, :n, \'area\', :o, :c)'
        );

        $ordenPiso = 1;
        foreach ($pisos as $i => $piso) {
            $nombrePiso = trim((string) ($piso['nombre'] ?? ''));
            if ($nombrePiso === '') {
                continue;
            }
            $color = $colores[$i % count($colores)];
            $stmtPiso->execute([
                's' => $sedeId,
                'n' => $nombrePiso,
                'o' => $ordenPiso,
                'c' => $color,
            ]);
            $pisoId = (int) $pdo->lastInsertId();
            $ordenArea = 1;
            foreach ($piso['areas'] ?? [] as $area) {
                $nombreArea = trim((string) ($area['nombre'] ?? ''));
                if ($nombreArea === '') {
                    continue;
                }
                $stmtArea->execute([
                    's'   => $sedeId,
                    'piso'=> $pisoId,
                    'n'   => $nombreArea,
                    'o'   => $ordenArea++,
                    'c'   => $color,
                ]);
            }
            $ordenPiso++;
        }
    }

    public static function find(int $id, int $sedeId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT z.*, p.nombre AS piso_nombre
             FROM sede_zonas z
             LEFT JOIN sede_zonas p ON p.id = z.piso_id
             WHERE z.id = :id AND z.sede_id = :s AND z.activa = 1
             LIMIT 1'
        );
        $stmt->execute(['id' => $id, 's' => $sedeId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function esDescendienteDe(int $zonaId, int $posiblePisoId, int $sedeId): bool
    {
        $z = self::find($zonaId, $sedeId);
        if (!$z) {
            return false;
        }
        if ($z['tipo'] === 'piso') {
            return (int) $z['id'] === $posiblePisoId;
        }
        return (int) $z['piso_id'] === $posiblePisoId;
    }
}
