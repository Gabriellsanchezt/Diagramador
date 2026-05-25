# Diagramador de Red — Berilion

Aplicación MVC (PHP + MySQL) para diagramar la estructura de red por sedes, con pisos/áreas, capas de switch, conexiones cableadas/inalámbricas y gestión de IPs.

## Requisitos

- XAMPP (Apache + MySQL/MariaDB + PHP 8+)
- Extensiones PHP: `pdo_mysql`, `json`, `session`

## Instalación en XAMPP

1. El proyecto debe estar en `C:\xampp\htdocs\Berilion\Diagramador\`
2. Inicie **Apache** y **MySQL** desde el panel de XAMPP.
3. Importe la base de datos:
   - Abra [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
   - Pestaña **Importar** → archivo `sql/schema.sql` (crea la base **`diagrama_bd`**)
   - Si ya tenía `diagramador_berilion`, ejecute `sql/renombrar_a_diagrama_bd.sql` en su lugar
4. Si su MySQL tiene contraseña, edite `config/database.php`.
5. Abra la aplicación:  
   **http://localhost/Berilion/Diagramador/** o **http://localhost/Berilion/Diagramador/public/index.php**

### Credenciales por defecto

| Usuario | Contraseña   |
|---------|--------------|
| admin   | berilion23   |

**Validaciones de login:** usuario 3–50 caracteres (letras, números, `.`, `-`, `_`); contraseña 8–72 caracteres. Validación en navegador y en servidor.

## Estructura MVC

```
Diagramador/
├── app/
│   ├── Controllers/   Auth, App, Api
│   ├── Core/          Database, Validator, Controller
│   ├── Models/        Usuario, Sede, SedeZona, Equipo, TipoEquipo
│   └── Views/         login, diagramador
├── config/            database.php, app.php
├── public/            index.php, assets/
├── sql/schema.sql     Esquema completo + datos iniciales
└── bootstrap.php
```

## Funcionalidades

- **Sedes:** búsqueda, alta con nombre, RIF opcional, cableado (Cat5e/Cat6 o no especificado).
- **Pisos y áreas:** cada área pertenece a un piso; en el diagrama: Sede → Piso → Área → Equipo.
- **Switches por capa:** acceso, distribución, núcleo (tipos en catálogo `tipos_equipo`).
- **IPs obligatorias:** biométrico, servidor, impresora, repetidor AP, cámara IP.
- **Conexión:** cableado (línea sólida) o inalámbrico (línea punteada) en formulario y diagrama.
- **Cámaras:** IP o cableada (sin IP).
- **Equipos:** jerarquía padre/hijo, control de puertos en PCs.

## API interna (requiere sesión)

| Acción | Método | Parámetros |
|--------|--------|------------|
| `tipos` | GET | — |
| `sedes` | GET | `q` búsqueda |
| `sede-detalle` | GET | `id` |
| `sede-crear` | POST JSON | nombre, rif, categoria_cable, pisos[] |
| `sede-actualizar` | POST JSON | sede_id, rif, categoria_cable |
| `equipo-guardar` | POST JSON | sede_id, tipo_codigo, ip, medio_enlace, … |
| `equipo-eliminar` | POST JSON | sede_id, id |
| `puertos-libres` | GET | sede_id, padre_id |

## Punto de entrada

- `index.php` (raíz) redirige a `public/index.php`
- Toda la aplicación vive en `public/` y `app/`
