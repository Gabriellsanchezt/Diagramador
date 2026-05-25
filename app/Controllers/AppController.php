<?php

namespace App\Controllers;

use App\Core\Controller;

class AppController extends Controller
{
    public function index(): void
    {
        $key = (require ROOT_PATH . '/config/app.php')['session_key'];
        if (empty($_SESSION[$key])) {
            header('Location: ' . $this->baseUrl() . '/index.php');
            exit;
        }
        $this->view('diagramador', [
            'baseUrl' => $this->baseUrl(),
            'usuario' => $_SESSION[$key]['usuario'],
        ]);
    }
}
