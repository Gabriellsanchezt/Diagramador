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
        }, 4000);
    }
};

async function apiGet(action, params = {}) {
    const qs = new URLSearchParams({ api: action, ...params });
    const res = await fetch(`${window.APP_BASE}/index.php?${qs}`);
    return res.json();
}

async function apiPost(action, body) {
    const res = await fetch(`${window.APP_BASE}/index.php?api=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}
