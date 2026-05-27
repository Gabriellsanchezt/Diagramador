# Diagramador de Red — Berilion

Aplicación MVC (PHP + MySQL) para diagramar la estructura de red por sedes.

## Requisitos

- XAMPP (Apache + MySQL/MariaDB + PHP 8+)
- Extensiones PHP: `pdo_mysql`, `json`, `session`

## Instalación en XAMPP (cualquier carpeta)

1. Copie el proyecto a `htdocs`, por ejemplo:
   - `C:\xampp\htdocs\Diagramador\`
   - o `C:\xampp\htdocs\Berilion\Diagramador\`
2. Inicie **Apache** y **MySQL**.
3. Importe **`sql/schema.sql`** en phpMyAdmin (crea la base **`diagrama_bd`**).
4. Si MySQL tiene contraseña, copie `config/database.local.php.example` → `config/database.local.php` y edite usuario/clave.
5. Abra en el navegador (ajuste la ruta según su carpeta):

   ```
   http://localhost/Diagramador/public/index.php
   ```

   También puede usar el `index.php` de la raíz del proyecto (redirige a `public/`).

**No hace falta configurar `/Berilion/`**: la ruta se detecta sola. Solo si falla, copie `config/app.local.php.example` → `config/app.local.php` y defina `base_url`.

### Credenciales por defecto

| Usuario | Contraseña   |
|---------|--------------|
| admin   | berilion23   |

## Validar instalación

Desde la carpeta del proyecto:

```bash
php tools/validate.php
```

Debe terminar con **0 errores**. También prueba login HTTP si Apache está activo.

## Si el login “no hace nada”

1. Entre siempre por **`public/index.php`** (no abra archivos sueltos del disco).
2. Verifique que **MySQL** esté activo y exista la base **`diagrama_bd`**.
3. Abra F12 → pestaña **Red**: al enviar login debe llamarse `index.php?page=login-api` y responder JSON.
4. Si aparece error de base de datos, revise `config/database.local.php`.

## Estructura MVC

```
Diagramador/
├── app/Controllers, Models, Views, Core
├── config/            app.php, database.php (+ .local.php opcionales)
├── public/            index.php, assets/  ← punto de entrada web
├── sql/schema.sql
└── bootstrap.php
```

## Punto de entrada

- `public/index.php` — aplicación principal
- `index.php` (raíz) — redirección a `public/`
