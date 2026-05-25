<?php

namespace App\Core;

class Controller
{
    protected function view(string $name, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        $path = ROOT_PATH . '/app/Views/' . $name . '.php';
        if (!is_file($path)) {
            http_response_code(500);
            echo 'Vista no encontrada: ' . htmlspecialchars($name);
            return;
        }
        require $path;
    }

    protected function json(array $payload, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    protected function requireAuth(): void
    {
        $key = (require ROOT_PATH . '/config/app.php')['session_key'];
        if (empty($_SESSION[$key])) {
            $this->json(['ok' => false, 'error' => 'Sesión no válida'], 401);
        }
    }

    protected function baseUrl(): string
    {
        return rtrim((require ROOT_PATH . '/config/app.php')['base_url'], '/');
    }
}
