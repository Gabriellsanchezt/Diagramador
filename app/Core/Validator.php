<?php

namespace App\Core;

class Validator
{
    public static function loginUsuario(string $user): ?string
    {
        $user = trim($user);
        if ($user === '') {
            return 'El usuario es obligatorio.';
        }
        if (strlen($user) < 3 || strlen($user) > 50) {
            return 'El usuario debe tener entre 3 y 50 caracteres.';
        }
        if (!preg_match('/^[a-zA-Z0-9._-]+$/', $user)) {
            return 'El usuario solo puede contener letras, números, punto, guion y guion bajo.';
        }
        return null;
    }

    public static function loginPassword(string $pass): ?string
    {
        if ($pass === '') {
            return 'La contraseña es obligatoria.';
        }
        if (strlen($pass) < 8 || strlen($pass) > 72) {
            return 'La contraseña debe tener entre 8 y 72 caracteres.';
        }
        return null;
    }

    public static function rif(?string $rif): ?string
    {
        if ($rif === null || trim($rif) === '') {
            return null;
        }
        $rif = strtoupper(trim($rif));
        if (!preg_match('/^[JGVEP]-?\d{8,9}-?\d$/i', $rif)) {
            return 'Formato de RIF inválido. Ejemplo: J-12345678-9';
        }
        return null;
    }

    public static function ipv4(?string $ip): ?string
    {
        if ($ip === null || trim($ip) === '') {
            return 'La dirección IP es obligatoria para este equipo.';
        }
        $ip = trim($ip);
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return 'Debe ingresar una IPv4 válida (ej: 192.168.1.10).';
        }
        return null;
    }

    public static function nombreSede(string $nombre): ?string
    {
        $nombre = trim($nombre);
        if ($nombre === '') {
            return 'El nombre de la sede es obligatorio.';
        }
        if (strlen($nombre) < 3 || strlen($nombre) > 255) {
            return 'El nombre debe tener entre 3 y 255 caracteres.';
        }
        return null;
    }
}
