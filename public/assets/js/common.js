const BerilionUI = {
    alert(mensaje, tipo = 'success') {
        const container = document.getElementById('popover-container');
        if (!container) return;
        const popover = document.createElement('div');
        popover.className = `popover-alert ${tipo}`;
        popover.innerHTML = `<span>${mensaje}</span><button class="popover-close" type="button">&times;</button>`;
        popover.querySelector('.popover-close').onclick = () => popover.remove();
        container.appendChild(popover);
        setTimeout(() => popover.classList.add('show'), 10);
        setTimeout(() => {
            popover.classList.remove('show');
            setTimeout(() => popover.remove(), 300);
        }, 5000);
    }
};

function indexUrl(params = {}) {
    const qs = new URLSearchParams(params);
    return 'index.php?' + qs.toString();
}

async function apiGet(action, params = {}) {
    const qs = new URLSearchParams({ api: action, ...params });
    const res = await fetch('index.php?' + qs.toString(), { credentials: 'same-origin' });
    return parseJsonResponse(res);
}

async function apiPost(action, body) {
    const res = await fetch(indexUrl({ api: action }), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
    });
    return parseJsonResponse(res);
}

async function parseJsonResponse(res) {
    const raw = await res.text();
    try {
        return JSON.parse(raw);
    } catch {
        return {
            ok: false,
            error: 'Respuesta inválida del servidor (¿MySQL activo y schema.sql importado?)'
        };
    }
}
