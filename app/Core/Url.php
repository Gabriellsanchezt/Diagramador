<?php

namespace App\Core;

/**
 * Rutas base detectadas desde la URL real (funciona en cualquier carpeta de htdocs).
 */
class Url
{
    private static ?array $appConfig = null;

    public static function appConfig(): array
    {
        if (self::$appConfig !== null) {
            return self::$appConfig;
        }

        $config = require ROOT_PATH . '/config/app.php';
        $local = ROOT_PATH . '/config/app.local.php';
        if (is_file($local)) {
            $config = array_merge($config, require $local);
        }

        self::$appConfig = $config;
        return $config;
    }

    /** Ruta web hasta /public (ej: /Diagramador/public). Vacío si está en la raíz del host. */
    public static function basePath(): string
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $manual = trim((string) (self::appConfig()['base_url'] ?? ''));
        if ($manual !== '') {
            $cached = '/' . trim($manual, '/');
            return $cached;
        }

        $script = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
        $script = str_replace('\\', '/', $script);
        $dir = rtrim(dirname($script), '/');

        if ($dir === '' || $dir === '.') {
            $cached = '';
        } else {
            $cached = $dir;
        }

        return $cached;
    }

    /** URL de aplicación: /ruta/public/index.php?page=app */
    public static function route(string $page, array $query = []): string
    {
        $params = array_merge(['page' => $page], $query);
        return self::to('index.php?' . http_build_query($params));
    }

    /** Ruta a archivo dentro de public/ */
    public static function to(string $path = ''): string
    {
        $path = ltrim(str_replace('\\', '/', $path), '/');
        $base = self::basePath();

        if ($base === '') {
            return $path === '' ? '' : $path;
        }

        return $path === '' ? $base : $base . '/' . $path;
    }
}
