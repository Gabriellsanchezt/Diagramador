<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ingreso - Diagramador Berilion</title>
    <link rel="stylesheet" href="<?= htmlspecialchars($baseUrl) ?>/assets/css/app.css">
</head>
<body>
<div id="popover-container"></div>

<div class="login-wrapper">
    <div class="login-card">
        <div class="login-header">
            <h1 style="font-size: 22px;">DIAGRAMADOR DE RED</h1>
            <p class="subtitle">INGRESE SUS CREDENCIALES</p>
        </div>
        <form id="loginForm" novalidate>
            <div class="login-group">
                <label for="loginUser">Usuario</label>
                <input type="text" id="loginUser" autocomplete="username" placeholder="Ingrese su usuario" maxlength="50">
                <div class="login-error" id="errUser"></div>
            </div>
            <div class="login-group">
                <label for="loginPassword">Contraseña</label>
                <input type="password" id="loginPassword" autocomplete="current-password" placeholder="Ingrese su contraseña" maxlength="72">
                <div class="login-error" id="errPass"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-login">Iniciar Sesión</button>
        </form>
        <p class="field-hint" style="text-align:center;margin-top:16px;">
            Usuario: letras, números, punto, guion. Contraseña: 8 a 72 caracteres.
        </p>
        <p style="text-align: center; color: var(--text-muted); font-size: 11px; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 15px;">
            &copy; 2026 Berilion J-508195619.
        </p>
    </div>
    <button type="button" class="btn-aspecto-flotante" id="btnAspectoLogin" title="Cambiar aspecto">
        <svg viewBox="0 0 24 24"><path d="M21.75 15a9.6 9.6 0 0 1-11.41-11.41 9 9 0 1 0 12.22 12.22z"/></svg>
    </button>
</div>

<script src="<?= htmlspecialchars($baseUrl) ?>/assets/js/common.js"></script>
<script>
const BASE = <?= json_encode($baseUrl) ?>;

document.getElementById('btnAspectoLogin').onclick = () => {
    document.body.classList.toggle('dark-mode');
    BerilionUI.alert('Modo de visualización cambiado', 'success');
};

function validarLoginCliente() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPassword').value;
    const errU = document.getElementById('errUser');
    const errP = document.getElementById('errPass');
    let ok = true;
    errU.textContent = '';
    errP.textContent = '';
    document.getElementById('loginUser').classList.remove('invalid');
    document.getElementById('loginPassword').classList.remove('invalid');

    if (!user) { errU.textContent = 'El usuario es obligatorio.'; document.getElementById('loginUser').classList.add('invalid'); ok = false; }
    else if (user.length < 3 || user.length > 50) { errU.textContent = 'Entre 3 y 50 caracteres.'; document.getElementById('loginUser').classList.add('invalid'); ok = false; }
    else if (!/^[a-zA-Z0-9._-]+$/.test(user)) { errU.textContent = 'Caracteres no permitidos en el usuario.'; document.getElementById('loginUser').classList.add('invalid'); ok = false; }

    if (!pass) { errP.textContent = 'La contraseña es obligatoria.'; document.getElementById('loginPassword').classList.add('invalid'); ok = false; }
    else if (pass.length < 8 || pass.length > 72) { errP.textContent = 'Entre 8 y 72 caracteres.'; document.getElementById('loginPassword').classList.add('invalid'); ok = false; }

    return ok;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarLoginCliente()) return;
    const res = await fetch(BASE + '/index.php?page=login-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario: document.getElementById('loginUser').value.trim(),
            password: document.getElementById('loginPassword').value
        })
    });
    const data = await res.json();
    if (data.ok) {
        BerilionUI.alert('Acceso concedido', 'success');
        location.href = BASE + '/index.php?page=app';
    } else {
        BerilionUI.alert(data.error || 'Error de acceso', 'danger');
    }
});
</script>
</body>
</html>
