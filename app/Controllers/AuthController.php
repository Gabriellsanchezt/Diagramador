<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Url;
use App\Core\Validator;
use App\Models\Usuario;

class AuthController extends Controller
{
    public function loginPage(): void
    {
        $key = Url::appConfig()['session_key'];
        if (!empty($_SESSION[$key])) {
            header('Location: ' . Url::route('app'));
            exit;
        }
        $this->view('login');
    }

    public function loginApi(): void
    {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $user = (string) ($input['usuario'] ?? $_POST['usuario'] ?? '');
        $pass = (string) ($input['password'] ?? $_POST['password'] ?? '');

        $errUser = Validator::loginUsuario($user);
        if ($errUser) {
            $this->json(['ok' => false, 'error' => $errUser], 422);
        }
        $errPass = Validator::loginPassword($pass);
        if ($errPass) {
            $this->json(['ok' => false, 'error' => $errPass], 422);
        }

        try {
            $row = Usuario::findByUsuario($user);
        } catch (\Throwable $e) {
            $this->json(['ok' => false, 'error' => 'Error de base de datos. Revise MySQL y sql/schema.sql'], 500);
        }

        if (!$row || !(int) $row['activo']) {
            $this->json(['ok' => false, 'error' => 'Usuario o contraseña incorrectos.'], 401);
        }
        if (!password_verify($pass, $row['password_hash'])) {
            $this->json(['ok' => false, 'error' => 'Usuario o contraseña incorrectos.'], 401);
        }

        $key = Url::appConfig()['session_key'];
        $_SESSION[$key] = [
            'id'      => (int) $row['id'],
            'usuario' => $row['usuario'],
            'nombre'  => $row['nombre'],
        ];

        $this->json(['ok' => true, 'usuario' => $row['usuario']]);
    }

    public function logout(): void
    {
        $key = Url::appConfig()['session_key'];
        unset($_SESSION[$key]);
        session_destroy();
        header('Location: ' . Url::route('login'));
        exit;
    }
}
