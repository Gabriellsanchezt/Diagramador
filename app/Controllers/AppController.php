<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Url;

class AppController extends Controller
{
    public function index(): void
    {
        $key = Url::appConfig()['session_key'];
        if (empty($_SESSION[$key])) {
            header('Location: ' . Url::route('login'));
            exit;
        }
        $this->view('diagramador', [
            'usuario' => $_SESSION[$key]['usuario'],
        ]);
    }
}
