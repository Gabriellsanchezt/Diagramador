<?php

declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

use App\Controllers\ApiController;
use App\Controllers\AppController;
use App\Controllers\AuthController;

$page = $_GET['page'] ?? 'login';
$api  = $_GET['api'] ?? null;

if ($api !== null) {
    (new ApiController())->dispatch($api);
    exit;
}

switch ($page) {
    case 'app':
        (new AppController())->index();
        break;
    case 'logout':
        (new AuthController())->logout();
        break;
    case 'login-api':
        (new AuthController())->loginApi();
        break;
    default:
        (new AuthController())->loginPage();
}
