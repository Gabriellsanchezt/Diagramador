<?php

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $pdo = null;

    private static function config(): array
    {
        $cfg = require ROOT_PATH . '/config/database.php';
        $local = ROOT_PATH . '/config/database.local.php';
        if (is_file($local)) {
            $cfg = array_merge($cfg, require $local);
        }
        return $cfg;
    }

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $cfg = self::config();
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $cfg['host'],
            (int) $cfg['port'],
            $cfg['dbname'],
            $cfg['charset']
        );

        try {
            self::$pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            $msg = 'No se pudo conectar a MySQL (base: ' . htmlspecialchars($cfg['dbname']) . '). '
                . 'Verifique que importó sql/schema.sql y config/database.local.php';
            if (php_sapi_name() === 'cli') {
                fwrite(STDERR, $msg . PHP_EOL . $e->getMessage() . PHP_EOL);
            } else {
                header('Content-Type: text/html; charset=utf-8');
                echo '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">'
                    . '<h1>Error de base de datos</h1><p>' . $msg . '</p>'
                    . '<pre style="background:#f1f5f9;padding:1rem">' . htmlspecialchars($e->getMessage()) . '</pre>'
                    . '</body></html>';
            }
            exit(1);
        }

        return self::$pdo;
    }
}
