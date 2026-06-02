(function () {
    let tiposEquipo = [];
    let sedeActual = null;
    let zonas = [];
    let equipos = [];
    let network = null;
    let editId = null;
    let sedesCache = [];
    let catalogoModelos = {};
    let modelosFiltradosActuales = [];

    const iconRepo = {
        Router: 'https://img.icons8.com/fluency/96/router.png',
        Deco: 'https://img.icons8.com/fluency/96/wi-fi-router.png',
        Repetidor: 'https://img.icons8.com/fluency/96/repeater.png',
        'Switch Rack (16p)': 'https://img.icons8.com/fluency/96/hub.png',
        'Switch Rack (24p)': 'https://img.icons8.com/fluency/96/hub.png',
        'Switch Puesto (5p)': 'https://img.icons8.com/fluency/96/switch.png',
        'Switch Puesto (8p)': 'https://img.icons8.com/fluency/96/switch.png',
        Servidor: 'https://img.icons8.com/fluency/96/server.png',
        DVR: 'https://img.icons8.com/?size=100&id=CxBUJc7tDGwl&format=png&color=000000',
        'DVR / NVR': 'https://img.icons8.com/?size=100&id=CxBUJc7tDGwl&format=png&color=000000',
        'DVR/NVR': 'https://img.icons8.com/?size=100&id=CxBUJc7tDGwl&format=png&color=000000',
        Interbancario: 'https://img.icons8.com/fluency/96/bank.png',
        'Biométrico': 'https://img.icons8.com/fluency/96/fingerprint.png',
        Impresora: 'https://img.icons8.com/fluency/96/printer.png',
        PC: 'https://img.icons8.com/fluency/96/monitor.png'
    };

    const capaLabel = { acceso: 'Acceso', distribucion: 'Distribución', nucleo: 'Núcleo' };
    const padresWifiPermitidos = ['Router', 'Deco', 'Repetidor'];

    const ICON_DVR = 'https://img.icons8.com/?size=100&id=CxBUJc7tDGwl&format=png&color=000000';
    const ICON_DVR_OSCURO = 'https://img.icons8.com/?size=100&id=CxBUJc7tDGwl&format=png&color=FFFFFF';

    function iconForTipoCodigo(tipoCodigo, esOscuro = false) {
        const raw = String(tipoCodigo ?? '').trim();
        const upper = raw.toUpperCase();
        if (upper.includes('DVR') || upper.includes('NVR')) {
            return esOscuro ? ICON_DVR_OSCURO : ICON_DVR;
        }
        if (raw && iconRepo[raw]) return iconRepo[raw];
        return 'https://img.icons8.com/fluency/96/network.png';
    }

    function fontDiagrama(esOscuro, size = 12) {
        return {
            color: esOscuro ? '#f8fafc' : '#0f172a',
            size,
            multi: true,
            align: 'center',
            background: esOscuro ? 'rgba(30,41,59,0.94)' : 'rgba(255,255,255,0.96)',
            strokeWidth: 3,
            strokeColor: esOscuro ? 'rgba(30,41,59,0.94)' : '#ffffff'
        };
    }

    function tipoByCodigo(c) {
        return tiposEquipo.find(t => t.codigo === c);
    }

    function capaFromTipo() {
        return 'acceso';
    }

    function requiereVelocidad(t) {
        return t && parseInt(t.requiere_velocidad, 10) === 1;
    }

    function tipoUsaPuertosPadre(t) {
        return t && parseInt(t.requiere_puertos, 10) === 1;
    }

    function esInalambrico() {
        return (document.getElementById('medioEnlace')?.value || 'cableado') === 'inalambrico';
    }

    function padreWifiValido(equipo) {
        return equipo && padresWifiPermitidos.includes(equipo.tipo_codigo);
    }

    function slug(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
    }

    function escapeHtml(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function prepararImpresionPdf() {
        if (!sedeActual) {
            return BerilionUI.alert('Seleccione una sede antes de exportar PDF', 'warning');
        }
        document.getElementById('printSedeNombre').textContent = sedeActual.nombre || 'Sede';
        document.getElementById('printSedeRif').textContent = `RIF: ${sedeActual.rif || '—'}`;

        const tituloOriginal = document.title;
        const nombre = slug(sedeActual.nombre || 'sede');
        const rif = slug(sedeActual.rif || 'sin_rif');
        document.title = `topologia_${nombre}_${rif}`;
        window.print();
        setTimeout(() => {
            document.title = tituloOriginal;
        }, 600);
    }

    async function cargarCatalogoModelos() {
        const r = await apiGet('modelos-equipo');
        if (!r.ok) {
            BerilionUI.alert(r.error || 'No se pudo cargar catálogo de modelos', 'warning');
            catalogoModelos = {};
            return;
        }
        const agrupado = {};
        (r.data || []).forEach(row => {
            if (!row.tipo_codigo || !row.nombre) return;
            if (!Array.isArray(agrupado[row.tipo_codigo])) {
                agrupado[row.tipo_codigo] = [];
            }
            agrupado[row.tipo_codigo].push(String(row.nombre).trim());
        });
        catalogoModelos = agrupado;
    }

    function getModelosPorTipo(tipoCodigo) {
        const lista = Array.isArray(catalogoModelos[tipoCodigo]) ? catalogoModelos[tipoCodigo] : [];
        return [...new Set(lista.map(x => String(x).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    }

    function registrarModeloEnCatalogo(tipoCodigo, modelo) {
        if (!tipoCodigo || !modelo) return;
        if (!Array.isArray(catalogoModelos[tipoCodigo])) {
            catalogoModelos[tipoCodigo] = [];
        }
        if (!catalogoModelos[tipoCodigo].includes(modelo)) {
            catalogoModelos[tipoCodigo].push(modelo);
        }
    }

    document.getElementById('btnDarkModeNav').onclick = () => {
        document.body.classList.toggle('dark-mode');
        const es = document.body.classList.contains('dark-mode');
        document.getElementById('btnDarkModeNav').textContent = es ? 'Modo Claro' : 'Modo Oscuro';
        if (document.getElementById('diagramSection').style.display === 'block') generarDiagrama();
    };

    document.querySelectorAll('[data-close]').forEach(el => {
        el.onclick = () => document.getElementById(el.dataset.close).style.display = 'none';
    });
    document.getElementById('btnAyuda').onclick = () => {
        document.getElementById('helpModal').style.display = 'flex';
    };
    document.getElementById('helpModal').onclick = e => {
        if (e.target.id === 'helpModal') e.target.style.display = 'none';
    };

    function toggleUserDropdown(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }

    function cerrarUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }

    document.getElementById('btnDropdownUser').onclick = toggleUserDropdown;
    document.getElementById('btnCerrarSesion').onclick = () => {
        window.location.href = 'index.php?page=logout';
    };

    const sidebar = document.getElementById('appSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');

    function openSidebar(panelId) {
        sidebar.classList.add('is-open');
        sidebarOverlay.classList.add('is-open');
        document.body.classList.add('sidebar-open');
        sidebar.setAttribute('aria-hidden', 'false');
        sidebarOverlay.setAttribute('aria-hidden', 'false');
        btnToggleSidebar.setAttribute('aria-expanded', 'true');
        if (panelId) activarPanelSidebar(panelId);
    }

    function closeSidebar() {
        sidebar.classList.remove('is-open');
        sidebarOverlay.classList.remove('is-open');
        document.body.classList.remove('sidebar-open');
        sidebar.setAttribute('aria-hidden', 'true');
        sidebarOverlay.setAttribute('aria-hidden', 'true');
        btnToggleSidebar.setAttribute('aria-expanded', 'false');
    }

    const panelesModelos = ['panel-catalogo-equipos', 'panel-catalogo-modelos'];

    function activarPanelSidebar(panelId) {
        document.querySelectorAll('.sidebar-menu-item').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.panel === panelId);
        });
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.classList.toggle('is-active', panel.id === panelId);
        });
        const enCatalogo = panelesModelos.includes(panelId);
        const grupoCatalogo = document.getElementById('sidebarMenuCatalogo');
        const labelCatalogo = document.getElementById('sidebarNavModelos');
        if (grupoCatalogo) grupoCatalogo.classList.toggle('is-expanded', enCatalogo);
        if (labelCatalogo) labelCatalogo.classList.toggle('is-highlight', enCatalogo);
    }

    btnToggleSidebar.onclick = () => {
        if (sidebar.classList.contains('is-open')) closeSidebar();
        else openSidebar('panel-nueva-sede');
    };
    document.getElementById('btnCloseSidebar').onclick = closeSidebar;
    sidebarOverlay.onclick = closeSidebar;

    document.querySelectorAll('.sidebar-menu-item').forEach(btn => {
        btn.onclick = () => activarPanelSidebar(btn.dataset.panel);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeSidebar();
    });

    async function init() {
        const t = await apiGet('tipos');
        if (!t.ok) return BerilionUI.alert('Error cargando tipos', 'danger');
        tiposEquipo = t.data;
        await cargarCatalogoModelos();
        sincronizarTiposEquipoUI();
        await cargarSedes('');
        bindEvents();
        onTipoChange();
        prepararFormularioSede();
        renderCatalogoEquipos();
        renderCatalogoModelos();
    }

    function sincronizarTiposEquipoUI() {
        const sel = document.getElementById('nodeType');
        const prev = sel.value;
        sel.innerHTML = tiposEquipo.map(x =>
            `<option value="${escapeHtml(x.codigo)}">${escapeHtml(x.etiqueta)}</option>`
        ).join('');
        if (prev && tiposEquipo.some(x => x.codigo === prev)) {
            sel.value = prev;
        }
        const selTipoCatalogo = document.getElementById('catalogoTipoEquipo');
        const prevCat = selTipoCatalogo.value;
        selTipoCatalogo.innerHTML = tiposEquipo
            .filter(x => !tipoUsaPuertosPadre(x))
            .map(x => `<option value="${escapeHtml(x.codigo)}">${escapeHtml(x.etiqueta)}</option>`)
            .join('');
        if (prevCat && tiposEquipo.some(x => x.codigo === prevCat && !tipoUsaPuertosPadre(x))) {
            selTipoCatalogo.value = prevCat;
        }
        renderCatalogoEquipos();
        onTipoChange();
    }

    function renderCatalogoEquipos() {
        const box = document.getElementById('catalogoEquiposLista');
        if (!box) return;
        if (!tiposEquipo.length) {
            box.innerHTML = '<p class="sidebar-hint-box">No hay tipos de equipo registrados.</p>';
            return;
        }
        box.innerHTML = tiposEquipo.map(t => {
            const badges = [];
            if (parseInt(t.requiere_ip, 10) === 1) badges.push('Requiere IP');
            if (parseInt(t.es_switch, 10) === 1) {
                badges.push(`Switch · ${t.puertos_max || '?'} puertos`);
            }
            if (parseInt(t.requiere_velocidad, 10) === 1) badges.push('Velocidad');
            if (parseInt(t.requiere_puertos, 10) === 1) badges.push('Puertos en padre');
            const quitar = t.codigo !== 'PC'
                ? `<button type="button" class="btn btn-danger btn-sm" data-del-tipo="${escapeHtml(t.codigo)}">Quitar</button>`
                : '';
            return `<div class="catalogo-equipo-row">
                <div class="catalogo-equipo-info">
                    <strong>${escapeHtml(t.etiqueta)}</strong>
                    <span class="catalogo-equipo-codigo">${escapeHtml(t.codigo)}</span>
                    ${badges.length ? `<span class="catalogo-equipo-badges">${badges.join(' · ')}</span>` : ''}
                </div>
                ${quitar}
            </div>`;
        }).join('');
        box.querySelectorAll('[data-del-tipo]').forEach(btn => {
            btn.onclick = () => eliminarTipoEquipo(btn.dataset.delTipo);
        });
    }

    async function agregarTipoEquipo() {
        const etiqueta = document.getElementById('nuevoTipoEtiqueta').value.trim();
        if (!etiqueta) return BerilionUI.alert('Ingrese el nombre del equipo', 'warning');

        const esSwitch = document.getElementById('nuevoTipoSwitch').checked;
        const esEstacion = document.getElementById('nuevoTipoEstacion').checked;
        const payload = {
            etiqueta,
            requiere_ip: document.getElementById('nuevoTipoIp').checked,
            requiere_velocidad: document.getElementById('nuevoTipoVelocidad').checked,
            requiere_puertos: esEstacion,
            es_switch: esSwitch
        };
        if (esSwitch) {
            payload.puertos_max = parseInt(document.getElementById('nuevoTipoPuertosMax').value, 10) || 0;
        }

        const r = await apiPost('tipo-equipo-crear', payload);
        if (!r.ok) return BerilionUI.alert(r.error || 'No se pudo registrar el equipo', 'danger');

        tiposEquipo = r.data || [];
        document.getElementById('nuevoTipoEtiqueta').value = '';
        document.getElementById('nuevoTipoIp').checked = false;
        document.getElementById('nuevoTipoVelocidad').checked = false;
        document.getElementById('nuevoTipoSwitch').checked = false;
        document.getElementById('nuevoTipoEstacion').checked = false;
        document.getElementById('nuevoTipoPuertosMax').value = '8';
        document.getElementById('groupNuevoTipoPuertos').style.display = 'none';
        sincronizarTiposEquipoUI();
        BerilionUI.alert('Equipo agregado al catálogo', 'success');
    }

    async function eliminarTipoEquipo(codigo) {
        const r = await apiPost('tipo-equipo-eliminar', { codigo });
        if (!r.ok) return BerilionUI.alert(r.error || 'No se pudo quitar el equipo', 'danger');
        tiposEquipo = r.data || [];
        sincronizarTiposEquipoUI();
        renderCatalogoModelos();
        BerilionUI.alert('Equipo eliminado del catálogo', 'warning');
    }

    function toggleOpcionesNuevoTipo() {
        const esSwitch = document.getElementById('nuevoTipoSwitch').checked;
        const esEstacion = document.getElementById('nuevoTipoEstacion').checked;
        document.getElementById('groupNuevoTipoPuertos').style.display = esSwitch ? 'block' : 'none';
        if (esSwitch && esEstacion) {
            document.getElementById('nuevoTipoEstacion').checked = false;
        }
    }

    function bindEvents() {
        document.getElementById('nodeType').onchange = onTipoChange;
        document.getElementById('nodeParent').onchange = actualizarPuertos;
        document.getElementById('medioEnlace').onchange = () => {
            actualizarPadres();
            onTipoChange();
        };
        document.getElementById('btnAgregar').onclick = guardarEquipo;
        document.getElementById('btnGenerarDiagrama').onclick = generarDiagrama;
        document.getElementById('btnPdf').onclick = prepararImpresionPdf;
        document.getElementById('btnAddPiso').onclick = addPisoBlock;
        document.getElementById('btnGuardarSede').onclick = guardarNuevaSede;
        document.getElementById('btnLimpiarFormSede').onclick = limpiarFormularioSede;
        document.getElementById('btnExportar').onclick = exportarJson;
        document.getElementById('btnImportar').onclick = () => document.getElementById('importFileInput').click();
        document.getElementById('importFileInput').onchange = importarJson;
        document.getElementById('btnGuardarDatosSede').onclick = () => guardarDatosSede();
        document.getElementById('btnGuardarRifRapido').onclick = () => guardarDatosSede(true);
        document.getElementById('btnAbrirPanelSede').onclick = () => openSidebar('panel-sede-activa');
        document.getElementById('btnAddPisoSedeActiva').onclick = () => addPisoBlock('pisosSedeActiva');
        document.getElementById('btnGuardarZonasSede').onclick = () => guardarZonasSedeActiva();
        document.getElementById('btnAgregarModeloCatalogo').onclick = agregarModeloCatalogo;
        document.getElementById('btnAgregarTipoEquipo').onclick = agregarTipoEquipo;
        document.getElementById('nuevoTipoSwitch').onchange = () => {
            if (document.getElementById('nuevoTipoSwitch').checked) {
                document.getElementById('nuevoTipoEstacion').checked = false;
            }
            toggleOpcionesNuevoTipo();
        };
        document.getElementById('nuevoTipoEstacion').onchange = () => {
            if (document.getElementById('nuevoTipoEstacion').checked) {
                document.getElementById('nuevoTipoSwitch').checked = false;
                document.getElementById('groupNuevoTipoPuertos').style.display = 'none';
            }
        };
        document.getElementById('catalogoTipoEquipo').onchange = () => renderCatalogoModelos();
        const modelInput = document.getElementById('nodeModel');
        modelInput.onfocus = () => {
            document.getElementById('dropdownModelos').style.display = 'block';
            filtrarModelos(modelInput.value);
        };
        modelInput.oninput = () => filtrarModelos(modelInput.value);

        const busq = document.getElementById('sedeBusqueda');
        busq.onfocus = () => { document.getElementById('dropdownSedes').style.display = 'block'; filtrarSedes(busq.value); };
        busq.oninput = () => filtrarSedes(busq.value);
        document.addEventListener('click', e => {
            if (!e.target.closest('#sedeBusqueda') && !e.target.closest('#dropdownSedes')) {
                document.getElementById('dropdownSedes').style.display = 'none';
            }
            if (!e.target.closest('#nodeModel') && !e.target.closest('#dropdownModelos')) {
                document.getElementById('dropdownModelos').style.display = 'none';
            }
            if (!e.target.closest('#floatingNavbar')) {
                cerrarUserDropdown();
            }
        });
    }

    async function cargarSedes(q) {
        const r = await apiGet('sedes', { q });
        if (r.ok) sedesCache = r.data;
    }

    function filtrarSedes(texto) {
        const t = (texto || '').toLowerCase();
        const lista = sedesCache.filter(s => s.nombre.toLowerCase().includes(t));
        const dd = document.getElementById('dropdownSedes');
        dd.innerHTML = lista.length
            ? lista.map(s => `<div class="custom-select-option" data-id="${s.id}">${s.nombre}</div>`).join('')
            : '<div class="custom-select-option no-results">Sin resultados</div>';
        dd.querySelectorAll('.custom-select-option[data-id]').forEach(op => {
            op.onclick = () => seleccionarSede(parseInt(op.dataset.id, 10), op.textContent);
        });
    }

    async function seleccionarSede(id, nombre) {
        document.getElementById('sedeBusqueda').value = nombre;
        document.getElementById('dropdownSedes').style.display = 'none';
        const r = await apiGet('sede-detalle', { id });
        if (!r.ok) return BerilionUI.alert(r.error || 'Error', 'danger');
        sedeActual = r.sede;
        zonas = r.zonas || [];
        equipos = r.equipos || [];
        actualizarVistaDatosSede();
        renderEditorZonasSedeActiva();
        actualizarSelectZonas();
        actualizarTabla();
        actualizarPadres();
        actualizarSelectModelos();
        renderCatalogoModelos();
        editId = null;
        document.getElementById('diagramSection').style.display = 'none';
        if (network) { network.destroy(); network = null; }
    }

    function tieneRif(sede) {
        return sede && sede.rif && String(sede.rif).trim() !== '';
    }

    function actualizarVistaDatosSede() {
        const banner = document.getElementById('bloqueRifPendiente');
        const formSidebar = document.getElementById('sedeActivaForm');
        const sinSel = document.getElementById('sedeActivaSinSeleccion');
        const alertaRif = document.getElementById('sedeRifAlerta');

        if (!sedeActual) {
            banner.style.display = 'none';
            formSidebar.style.display = 'none';
            sinSel.style.display = 'block';
            document.getElementById('sedeRifDisplay').value = '—';
            document.getElementById('sedeCableDisplay').value = '—';
            return;
        }

        sinSel.style.display = 'none';
        formSidebar.style.display = 'block';
        document.getElementById('sedeActivaNombreLabel').textContent = sedeActual.nombre;

        const rif = sedeActual.rif || '';
        document.getElementById('sedeRifDisplay').value = rif || '—';
        document.getElementById('sedeCableDisplay').value = sedeActual.categoria_cable || '—';
        document.getElementById('sedeRifEdit').value = rif;
        document.getElementById('sedeCableEdit').value = sedeActual.categoria_cable || 'No especificado';
        document.getElementById('sedeRifRapido').value = '';

        const faltaRif = !tieneRif(sedeActual);
        banner.style.display = faltaRif ? 'flex' : 'none';
        alertaRif.style.display = faltaRif ? 'block' : 'none';
    }

    async function guardarDatosSede(soloRifRapido = false) {
        if (!sedeActual) {
            return BerilionUI.alert('Seleccione una sede primero', 'warning');
        }
        const rif = soloRifRapido
            ? document.getElementById('sedeRifRapido').value.trim()
            : document.getElementById('sedeRifEdit').value.trim();
        const cable = soloRifRapido
            ? (sedeActual.categoria_cable || 'No especificado')
            : document.getElementById('sedeCableEdit').value;

        if (soloRifRapido && !rif) {
            return BerilionUI.alert('Ingrese el RIF a registrar', 'warning');
        }
        if (rif && !/^[JGVEP]-?\d{8,9}-?\d$/i.test(rif)) {
            return BerilionUI.alert('RIF inválido. Ej: J-12345678-9', 'warning');
        }

        const r = await apiPost('sede-actualizar', {
            sede_id: sedeActual.id,
            rif,
            categoria_cable: cable
        });
        if (!r.ok) return BerilionUI.alert(r.error, 'danger');

        sedeActual = r.sede;
        const idx = sedesCache.findIndex(s => s.id == sedeActual.id);
        if (idx >= 0) {
            sedesCache[idx].rif = sedeActual.rif;
            sedesCache[idx].categoria_cable = sedeActual.categoria_cable;
        }
        actualizarVistaDatosSede();
        BerilionUI.alert(rif ? 'Datos de sede guardados' : 'Sede actualizada (sin RIF)', 'success');
    }

    function etiquetaZona(z) {
        if (!z || z.tipo === 'piso') {
            return z ? `Piso: ${z.nombre}` : '';
        }
        const piso = z.piso_nombre || zonas.find(p => p.id == z.piso_id)?.nombre || '?';
        return `${piso} › Área: ${z.nombre}`;
    }

    function actualizarSelectZonas() {
        const sel = document.getElementById('nodeZona');
        let html = '<option value="">Sin zona (general)</option>';
        const pisos = zonas.filter(z => z.tipo === 'piso');
        pisos.forEach(piso => {
            html += `<optgroup label="${piso.nombre}">`;
            html += `<option value="${piso.id}">Piso completo: ${piso.nombre}</option>`;
            zonas.filter(z => z.tipo === 'area' && z.piso_id == piso.id).forEach(area => {
                html += `<option value="${area.id}">Área: ${area.nombre}</option>`;
            });
            html += '</optgroup>';
        });
        sel.innerHTML = html;
    }

    function onTipoChange() {
        const codigo = document.getElementById('nodeType').value;
        const t = tipoByCodigo(codigo);
        document.getElementById('groupIp').style.display = t && parseInt(t.requiere_ip, 10) ? 'flex' : 'none';
        const requierePuestos = tipoUsaPuertosPadre(t);
        const inal = esInalambrico();
        document.getElementById('groupPorts').style.display = requierePuestos ? 'flex' : 'none';
        document.getElementById('labelPorts').textContent = inal ? 'Puestos inalámbricos' : 'Puertos usados';
        document.getElementById('nodePorts').style.display = (requierePuestos && !inal) ? 'block' : 'none';
        document.getElementById('nodeWifiCount').style.display = (requierePuestos && inal) ? 'block' : 'none';
        document.getElementById('groupSpeed').style.display = requiereVelocidad(t) ? 'flex' : 'none';
        document.getElementById('groupGeneration').style.display = codigo === 'Servidor' ? 'flex' : 'none';
        document.getElementById('labelModel').textContent = codigo === 'Servidor' ? 'Procesador' : 'Modelo';
        document.getElementById('groupModel').style.display = tipoUsaPuertosPadre(t) ? 'none' : 'flex';
        actualizarSelectModelos();
        if (requierePuestos && !inal) actualizarPuertos();
    }

    function actualizarSelectModelos(modeloSeleccionado = '') {
        const codigo = document.getElementById('nodeType').value;
        const inp = document.getElementById('nodeModel');
        const dd = document.getElementById('dropdownModelos');
        const t = tipoByCodigo(codigo);
        if (tipoUsaPuertosPadre(t)) {
            inp.value = '';
            modelosFiltradosActuales = [];
            dd.innerHTML = '';
            return;
        }
        modelosFiltradosActuales = getModelosPorTipo(codigo);
        if (modeloSeleccionado && !modelosFiltradosActuales.includes(modeloSeleccionado)) {
            modelosFiltradosActuales.push(modeloSeleccionado);
        }
        inp.value = modeloSeleccionado || '';
        filtrarModelos(inp.value);
    }

    function filtrarModelos(texto) {
        const t = (texto || '').toLowerCase();
        const lista = modelosFiltradosActuales.filter(m => m.toLowerCase().includes(t));
        const dd = document.getElementById('dropdownModelos');
        dd.innerHTML = lista.length
            ? lista.map(m => `<div class="custom-select-option" data-modelo="${encodeURIComponent(m)}">${m}</div>`).join('')
            : '<div class="custom-select-option no-results">Sin resultados</div>';
        dd.querySelectorAll('.custom-select-option[data-modelo]').forEach(op => {
            op.onclick = () => {
                document.getElementById('nodeModel').value = decodeURIComponent(op.dataset.modelo);
                dd.style.display = 'none';
            };
        });
    }

    async function renderCatalogoModelos() {
        const tipoCodigo = document.getElementById('catalogoTipoEquipo').value;
        const box = document.getElementById('catalogoModelosLista');
        if (!tipoCodigo) {
            box.innerHTML = 'Seleccione un tipo de equipo.';
            return;
        }
        const modelos = getModelosPorTipo(tipoCodigo);
        if (!modelos.length) {
            box.innerHTML = 'No hay modelos registrados para este tipo.';
            return;
        }
        box.innerHTML = modelos.map(m => (
            `<div class="modelo-item-row">
                <span>${m}</span>
                <button type="button" class="btn btn-danger btn-sm" data-del-modelo="${tipoCodigo}|${encodeURIComponent(m)}">Quitar</button>
            </div>`
        )).join('');
        box.querySelectorAll('[data-del-modelo]').forEach(btn => {
            btn.onclick = async () => {
                const [tipo, modeloEncoded] = btn.dataset.delModelo.split('|');
                const modelo = decodeURIComponent(modeloEncoded);
                const r = await apiPost('modelo-equipo-eliminar', { tipo_codigo: tipo, nombre: modelo });
                if (!r.ok) return BerilionUI.alert(r.error || 'No se pudo eliminar el modelo', 'danger');
                await cargarCatalogoModelos();
                await renderCatalogoModelos();
                if (document.getElementById('nodeType').value === tipo) {
                    actualizarSelectModelos(document.getElementById('nodeModel').value.trim());
                }
                BerilionUI.alert('Modelo eliminado', 'warning');
            };
        });
    }

    async function agregarModeloCatalogo() {
        const tipoCodigo = document.getElementById('catalogoTipoEquipo').value;
        const inp = document.getElementById('catalogoNuevoModelo');
        const modelo = inp.value.trim();
        if (!tipoCodigo) return BerilionUI.alert('Seleccione un tipo de equipo', 'warning');
        if (!modelo) return BerilionUI.alert('Ingrese un modelo válido', 'warning');
        const r = await apiPost('modelo-equipo-crear', { tipo_codigo: tipoCodigo, nombre: modelo });
        if (!r.ok) return BerilionUI.alert(r.error || 'No se pudo guardar el modelo', 'danger');
        await cargarCatalogoModelos();
        inp.value = '';
        await renderCatalogoModelos();
        if (document.getElementById('nodeType').value === tipoCodigo) {
            actualizarSelectModelos(modelo);
        }
        BerilionUI.alert('Modelo agregado al catálogo', 'success');
    }

    async function actualizarPuertos() {
        const t = tipoByCodigo(document.getElementById('nodeType').value);
        if (!sedeActual || !tipoUsaPuertosPadre(t) || esInalambrico()) return;
        const padreId = document.getElementById('nodeParent').value;
        const sel = document.getElementById('nodePorts');
        if (!padreId) {
            sel.innerHTML = '<option value="">Seleccione padre</option>';
            return;
        }
        const r = await apiGet('puertos-libres', {
            sede_id: sedeActual.id,
            padre_id: padreId,
            exclude_id: editId || 0
        });
        sel.innerHTML = '';
        if (!r.ok || r.libres < 1) {
            sel.innerHTML = '<option value="0">Sin puertos libres</option>';
            return;
        }
        for (let i = 1; i <= r.libres; i++) {
            sel.innerHTML += `<option value="${i}">${i} puerto(s)</option>`;
        }
    }

    function actualizarPadres() {
        const sel = document.getElementById('nodeParent');
        sel.innerHTML = '<option value="">Nodo principal</option>';
        const inal = esInalambrico();
        equipos
            .filter(e => String(e.id) !== String(editId))
            .filter(e => {
                if (inal) return padreWifiValido(e);
                return !tipoUsaPuertosPadre(tipoByCodigo(e.tipo_codigo));
            })
            .forEach(e => {
            const t = tipoByCodigo(e.tipo_codigo);
            const lbl = t ? t.etiqueta : e.tipo_codigo;
            sel.innerHTML += `<option value="${e.id}">${lbl} (${e.modelo})</option>`;
        });
        actualizarPuertos();
    }

    function badgeCapa(capa) {
        if (!capa) return '';
        const cls = capa === 'nucleo' ? 'badge-capa-nucleo' : (capa === 'distribucion' ? 'badge-capa-distrib' : 'badge-capa-acceso');
        return `<span class="badge ${cls}">${capaLabel[capa] || capa}</span>`;
    }

    function actualizarTabla() {
        const tbody = document.getElementById('tablaNodos');
        if (!sedeActual) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Seleccione una sede</td></tr>';
            return;
        }
        if (!equipos.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Sin equipos</td></tr>';
            return;
        }
        tbody.innerHTML = equipos.map(e => {
            const t = tipoByCodigo(e.tipo_codigo);
            const nombreTipo = t ? t.etiqueta : e.tipo_codigo;
            let capaHtml = parseInt(t?.es_switch, 10) ? badgeCapa(e.switch_capa) : '';
            let zona = 'General';
            if (e.zona_id) {
                const z = zonas.find(x => x.id == e.zona_id);
                zona = z ? etiquetaZona(z) : (e.zona_tipo === 'area' && e.piso_nombre
                    ? `${e.piso_nombre} › Área: ${e.zona_nombre}`
                    : `Piso: ${e.zona_nombre}`);
            }
            const medio = e.medio_enlace === 'inalambrico'
                ? '<span class="badge badge-wifi">Wi-Fi</span>'
                : '<span class="badge badge-cable">Cable</span>';
            let detalle = e.modelo;
            if (tipoUsaPuertosPadre(t) && (e.puertos_usados || 0) > 0) {
                const txt = e.medio_enlace === 'inalambrico'
                    ? `${e.puertos_usados} puesto(s) Wi-Fi`
                    : `${e.puertos_usados} puerto(s) usados`;
                detalle += `<br><small>${txt}</small>`;
            }
            if (e.ip) detalle += `<br><small>${e.ip}</small>`;
            let padre = 'Raíz';
            if (e.padre_id) {
                const p = equipos.find(x => x.id == e.padre_id);
                if (p) padre = (tipoByCodigo(p.tipo_codigo)?.etiqueta || p.tipo_codigo) + ' (' + p.modelo + ')';
            }
            return `<tr>
                <td><strong>${nombreTipo}</strong> ${capaHtml}</td>
                <td>${zona}</td>
                <td>${detalle}</td>
                <td>${medio}</td>
                <td>${padre}</td>
                <td><div class="table-actions">
                    <button class="btn btn-warning" data-edit="${e.id}">Editar</button>
                    <button class="btn btn-danger" data-del="${e.id}">Eliminar</button>
                </div></td>
            </tr>`;
        }).join('');
        tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => iniciarEdicion(parseInt(b.dataset.edit, 10)));
        tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => eliminarEquipo(parseInt(b.dataset.del, 10)));
    }

    async function guardarEquipo() {
        if (!sedeActual) return BerilionUI.alert('Seleccione una sede', 'warning');
        const codigo = document.getElementById('nodeType').value;
        const t = tipoByCodigo(codigo);
        const inal = esInalambrico();
        const payload = {
            id: editId || 0,
            sede_id: sedeActual.id,
            tipo_codigo: codigo,
            zona_id: document.getElementById('nodeZona').value || null,
            padre_id: document.getElementById('nodeParent').value || null,
            medio_enlace: document.getElementById('medioEnlace').value,
            modelo: document.getElementById('nodeModel').value.trim(),
            ip: document.getElementById('nodeIp').value.trim(),
            generacion: document.getElementById('nodeGeneration').value,
            velocidad: document.getElementById('nodeSpeed').value,
            puertos_usados: document.getElementById('nodePorts').value,
            switch_capa: parseInt(t.es_switch, 10) ? capaFromTipo(codigo) : null
        };

        if (inal) {
            if (!payload.padre_id) {
                return BerilionUI.alert('En inalámbrico debe seleccionar padre (Router / Deco / Repetidor)', 'warning');
            }
            if (tipoUsaPuertosPadre(t)) {
                payload.puertos_usados = document.getElementById('nodeWifiCount').value;
                const nWifi = parseInt(payload.puertos_usados, 10);
                if (!Number.isInteger(nWifi) || nWifi < 1) {
                    return BerilionUI.alert('Indique cantidad válida de puestos inalámbricos', 'warning');
                }
            } else {
                payload.puertos_usados = '';
            }
        } else if (tipoUsaPuertosPadre(t)) {
            const nPuertos = parseInt(payload.puertos_usados, 10);
            if (!Number.isInteger(nPuertos) || nPuertos < 1) {
                return BerilionUI.alert('Seleccione puertos usados válidos', 'warning');
            }
        }

        // Tipos que consumen puertos en cableado usan modelo N/A
        if (tipoUsaPuertosPadre(t)) {
            payload.modelo = 'N/A';
        }

        if (!tipoUsaPuertosPadre(t) && !payload.modelo) {
            return BerilionUI.alert('Seleccione un modelo del catálogo', 'warning');
        }
        if (!tipoUsaPuertosPadre(t) && !getModelosPorTipo(codigo).includes(payload.modelo)) {
            return BerilionUI.alert('Seleccione un modelo válido del catálogo', 'warning');
        }
        const r = await apiPost('equipo-guardar', payload);
        if (!r.ok) return BerilionUI.alert(r.error, 'danger');
        equipos = r.data;
        editId = null;
        document.getElementById('formActionsContainer').innerHTML =
            '<button type="button" class="btn btn-primary" style="height:40px" id="btnAgregar">Agregar</button>';
        document.getElementById('btnAgregar').onclick = guardarEquipo;
        BerilionUI.alert('Equipo guardado', 'success');
        actualizarTabla();
        actualizarPadres();
        onTipoChange();
    }

    function iniciarEdicion(id) {
        const e = equipos.find(x => x.id == id);
        if (!e) return;
        editId = id;
        document.getElementById('nodeType').value = e.tipo_codigo;
        document.getElementById('nodeZona').value = e.zona_id || '';
        document.getElementById('nodeParent').value = e.padre_id || '';
        document.getElementById('medioEnlace').value = e.medio_enlace || 'cableado';
        document.getElementById('nodeIp').value = e.ip || '';
        document.getElementById('nodeSpeed').value = e.velocidad || 'Gigabit (1000 Mbps)';
        onTipoChange();
        actualizarSelectModelos(e.modelo || '');
        if (tipoUsaPuertosPadre(tipoByCodigo(e.tipo_codigo))) {
            if ((e.medio_enlace || 'cableado') === 'inalambrico') {
                document.getElementById('nodeWifiCount').value = e.puertos_usados || 1;
            } else {
                document.getElementById('nodePorts').value = e.puertos_usados;
            }
        }
        document.getElementById('formActionsContainer').innerHTML = `
            <button type="button" class="btn btn-warning" style="height:40px" id="btnSaveEdit">Guardar</button>
            <button type="button" class="btn btn-help" style="height:40px" id="btnCancelEdit">Cancelar</button>`;
        document.getElementById('btnSaveEdit').onclick = guardarEquipo;
        document.getElementById('btnCancelEdit').onclick = cancelarEdicion;
        actualizarPadres();
    }

    function cancelarEdicion() {
        editId = null;
        document.getElementById('formActionsContainer').innerHTML =
            '<button type="button" class="btn btn-primary" style="height:40px" id="btnAgregar">Agregar</button>';
        document.getElementById('btnAgregar').onclick = guardarEquipo;
        onTipoChange();
    }

    async function eliminarEquipo(id) {
        const r = await apiPost('equipo-eliminar', { sede_id: sedeActual.id, id });
        if (!r.ok) return BerilionUI.alert(r.error, 'danger');
        equipos = r.data;
        BerilionUI.alert('Equipo eliminado', 'warning');
        actualizarTabla();
        actualizarPadres();
    }

    function limpiarFormularioSede() {
        document.getElementById('nuevaSedeNombre').value = '';
        document.getElementById('nuevaSedeRif').value = '';
        document.getElementById('nuevaSedeCable').value = 'No especificado';
        document.getElementById('pisosNuevaSede').innerHTML = '';
        addPisoBlock('pisosNuevaSede');
    }

    function prepararFormularioSede() {
        limpiarFormularioSede();
        activarPanelSidebar('panel-nueva-sede');
    }

    function renderEditorZonasSedeActiva() {
        const cont = document.getElementById('pisosSedeActiva');
        if (!cont) return;
        cont.innerHTML = '';
        if (!sedeActual) return;
        const pisos = zonas.filter(z => z.tipo === 'piso').sort((a, b) => (a.orden || 0) - (b.orden || 0));
        pisos.forEach(p => {
            const areas = zonas
                .filter(z => z.tipo === 'area' && String(z.piso_id) === String(p.id))
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map(a => a.nombre);
            addPisoBlock('pisosSedeActiva', p.nombre, areas);
        });
        if (!pisos.length) {
            addPisoBlock('pisosSedeActiva');
        }
    }

    async function guardarZonasSedeActiva() {
        if (!sedeActual) return BerilionUI.alert('Seleccione una sede', 'warning');
        const pisosPayload = [];
        document.querySelectorAll('#pisosSedeActiva .piso-block').forEach(block => {
            const nombrePiso = block.querySelector('.piso-nombre').value.trim();
            if (!nombrePiso) return;
            const areas = [];
            block.querySelectorAll('.area-item-row .area-nombre').forEach(inp => {
                const n = inp.value.trim();
                if (n) areas.push({ nombre: n });
            });
            pisosPayload.push({ nombre: nombrePiso, areas });
        });
        const r = await apiPost('zonas-actualizar', { sede_id: sedeActual.id, pisos: pisosPayload });
        if (!r.ok) return BerilionUI.alert(r.error || 'No se pudieron guardar pisos/áreas', 'danger');
        zonas = r.zonas || [];
        equipos = r.equipos || equipos;
        actualizarSelectZonas();
        actualizarTabla();
        actualizarPadres();
        renderEditorZonasSedeActiva();
        BerilionUI.alert('Pisos y áreas actualizados', 'success');
    }

    function addAreaRow(areasContainer, nombreInicial = '') {
        const row = document.createElement('div');
        row.className = 'area-item-row';
        row.innerHTML = `
            <input type="text" class="area-nombre" placeholder="Nombre del área (ej: Farmacia, Bodega)">
            <button type="button" class="btn btn-danger btn-sm">×</button>`;
        row.querySelector('input').value = nombreInicial;
        row.querySelector('button').onclick = () => row.remove();
        areasContainer.appendChild(row);
    }

    function addPisoBlock(containerId = 'pisosNuevaSede', nombreInicial = '', areasIniciales = []) {
        const block = document.createElement('div');
        block.className = 'piso-block';
        block.innerHTML = `
            <div class="piso-block-header">
                <input type="text" class="piso-nombre" placeholder="Nombre del piso (ej: Piso 1, Planta baja)">
                <button type="button" class="btn btn-danger btn-sm" title="Quitar piso">×</button>
            </div>
            <div class="areas-en-piso"></div>
            <button type="button" class="btn btn-help btn-sm btn-add-area">+ Área en este piso</button>`;
        block.querySelector('.piso-nombre').value = nombreInicial;
        block.querySelector('.piso-block-header button').onclick = () => block.remove();
        block.querySelector('.btn-add-area').onclick = () => addAreaRow(block.querySelector('.areas-en-piso'));
        const areasBox = block.querySelector('.areas-en-piso');
        (areasIniciales || []).forEach(a => addAreaRow(areasBox, a));
        document.getElementById(containerId).appendChild(block);
    }

    async function guardarNuevaSede() {
        const nombre = document.getElementById('nuevaSedeNombre').value.trim();
        if (nombre.length < 3) return BerilionUI.alert('Nombre de sede obligatorio (mín. 3 caracteres)', 'warning');
        const rif = document.getElementById('nuevaSedeRif').value.trim();
        if (rif && !/^[JGVEP]-?\d{8,9}-?\d$/i.test(rif)) {
            return BerilionUI.alert('RIF inválido. Ej: J-12345678-9', 'warning');
        }
        const pisosPayload = [];
        document.querySelectorAll('#pisosNuevaSede .piso-block').forEach(block => {
            const nombrePiso = block.querySelector('.piso-nombre').value.trim();
            if (!nombrePiso) return;
            const areas = [];
            block.querySelectorAll('.area-item-row .area-nombre').forEach(inp => {
                const n = inp.value.trim();
                if (n) areas.push({ nombre: n });
            });
            pisosPayload.push({ nombre: nombrePiso, areas });
        });
        const r = await apiPost('sede-crear', {
            nombre,
            rif,
            categoria_cable: document.getElementById('nuevaSedeCable').value,
            pisos: pisosPayload
        });
        if (!r.ok) return BerilionUI.alert(r.error, 'danger');
        closeSidebar();
        limpiarFormularioSede();
        await cargarSedes('');
        seleccionarSede(r.data.id, r.data.nombre);
        BerilionUI.alert('Sede registrada correctamente', 'success');
    }

    function edgeStyle(medio, esOscuro, highlight, smoothType = 'straight', enAnclas = false) {
        const cable = medio !== 'inalambrico';
        const smooth = smoothType === 'none'
            ? false
            : {
                enabled: true,
                type: smoothType,
                roundness: smoothType === 'discrete' ? 0.2 : 0.02,
                forceDirection: smoothType === 'vertical' ? 'vertical' : undefined
            };
        const vertical = smoothType === 'vertical';
        const offset = enAnclas
            ? { from: 0, to: 0 }
            : (vertical ? { from: 10, to: 18 } : { from: 8, to: 12 });
        return {
            arrows: { to: { enabled: true, scaleFactor: 0.4, type: 'arrow' } },
            color: { color: esOscuro ? '#64748b' : '#94a3b8', highlight: highlight || '#1e3a8a' },
            width: cable ? 1.2 : 1,
            dashes: cable ? false : [8, 6],
            smooth,
            endPointOffset: offset
        };
    }

    function anchorInvisible(id, x, y) {
        return {
            id,
            x,
            y,
            size: 0.01,
            shape: 'dot',
            color: { background: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)' },
            borderWidth: 0,
            margin: 0,
            fixed: true,
            physics: false,
            label: '',
            font: { size: 0, color: 'rgba(0,0,0,0)' }
        };
    }

    function margenNodoDiagrama(extraBottom = 0) {
        return { top: 10, right: 12, bottom: 18 + extraBottom, left: 12 };
    }

    function labelEquipoCorto(equipo) {
        const tipo = tipoByCodigo(equipo.tipo_codigo);
        const etiqueta = tipo ? tipo.etiqueta : equipo.tipo_codigo;
        if (tipoUsaPuertosPadre(tipo)) {
            return `${etiqueta} (${equipo.puertos_usados || 1}p)`;
        }
        if (equipo.ip) {
            return `${etiqueta} (${equipo.ip})`;
        }
        if (equipo.modelo && equipo.modelo !== 'N/A') {
            return `${etiqueta} (${equipo.modelo})`;
        }
        return etiqueta;
    }

    function colorPaletaZona(colorHex, esOscuro) {
        return colorHex || (esOscuro ? '#3b82f6' : '#1e3a8a');
    }

    function anchoTitulo(texto, min = 90, max = 220) {
        const plain = String(texto).replace(/<[^>]+>/g, '');
        return Math.min(max, Math.max(min, plain.length * 9 + 28));
    }

    function agregarLineaHorizontal(nodes, edges, id, x, y, ancho, color) {
        const leftId = `${id}_l`;
        const rightId = `${id}_r`;
        const half = ancho / 2;
        nodes.push(anchorInvisible(leftId, x - half, y), anchorInvisible(rightId, x + half, y));
        edges.push({
            id: `${id}_edge`,
            from: leftId,
            to: rightId,
            width: 2,
            color: { color, highlight: color, hover: color },
            arrows: { to: { enabled: false }, from: { enabled: false } },
            smooth: false,
            physics: false
        });
    }

    function nodoTituloZona(nodes, edges, opts, esOscuro) {
        const color = colorPaletaZona(opts.color, esOscuro);
        const ancho = anchoTitulo(opts.label, opts.anchoMin ?? 90, opts.anchoMax ?? 200);
        const yLinea = opts.y + (opts.lineOffset ?? 16);
        const yOut = yLinea + (opts.gapBelow ?? 14);
        const yIn = opts.y - (opts.gapAbove ?? 12);
        nodes.push({
            id: opts.id,
            label: opts.label,
            shape: 'text',
            font: { ...fontDiagrama(esOscuro, opts.fontSize ?? 13), bold: true },
            color: {
                background: 'rgba(0,0,0,0)',
                border: 'rgba(0,0,0,0)',
                highlight: { background: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)' }
            },
            borderWidth: 0,
            margin: opts.margin ?? { top: 8, right: 10, bottom: 8, left: 10 },
            x: opts.x,
            y: opts.y,
            fixed: true
        });
        agregarLineaHorizontal(nodes, edges, `${opts.id}_ln`, opts.x, yLinea, ancho, color);
        nodes.push(
            anchorInvisible(`${opts.id}_in`, opts.x, yIn),
            anchorInvisible(`${opts.id}_out`, opts.x, yOut)
        );
        return { outId: `${opts.id}_out`, inId: `${opts.id}_in`, yOut, yLinea };
    }

    function agregarSeparadorVertical(nodes, edges, id, x, yTop, alto, esOscuro) {
        const color = esOscuro ? '#94a3b8' : '#0f172a';
        const topId = `${id}_top`;
        const botId = `${id}_bot`;
        const yBottom = yTop + alto;
        nodes.push(anchorInvisible(topId, x, yTop), anchorInvisible(botId, x, yBottom));
        edges.push({
            id,
            from: topId,
            to: botId,
            width: 1,
            color: { color, highlight: color, hover: color },
            arrows: { to: { enabled: false }, from: { enabled: false } },
            smooth: false,
            physics: false
        });
    }

    function labelEquipoNodo(e, t) {
        const etiqueta = t ? t.etiqueta : e.tipo_codigo;
        let label = `<b>${etiqueta}</b>`;
        if (parseInt(t?.es_switch, 10)) {
            label = `<b>[${capaLabel[e.switch_capa] || 'Acceso'}]</b>\n${etiqueta}`;
        }
        if (tipoUsaPuertosPadre(t)) {
            const pref = e.medio_enlace === 'inalambrico' ? 'WiFi' : 'P';
            return `<b>${etiqueta}</b>\n${pref}:${e.puertos_usados || 1}`;
        }
        if (e.ip) return `${label}\n${e.ip}`;
        if (e.modelo && e.modelo !== 'N/A') return `${label}\n${e.modelo}`;
        return label;
    }

    function agregarEquipoNodo(nodes, edges, e, t, x, y, parentId, esOscuro, smoothEnlace = 'straight') {
        const eid = `eq_${e.id}`;
        nodes.push({
            id: eid,
            label: labelEquipoNodo(e, t),
            shape: 'image',
            image: iconForTipoCodigo(e.tipo_codigo, esOscuro),
            size: 30,
            margin: margenNodoDiagrama(8),
            font: { ...fontDiagrama(esOscuro, 10), vadjust: 36 },
            x,
            y,
            fixed: true
        });
        const fromId = e.padre_id ? `eq_${e.padre_id}` : parentId;
        edges.push({
            from: fromId,
            to: eid,
            ...edgeStyle(e.medio_enlace, esOscuro, null, smoothEnlace, String(fromId).endsWith('_out'))
        });
    }

    function generarDiagrama() {
        if (!sedeActual || !equipos.length) {
            return BerilionUI.alert('Agregue equipos para generar el diagrama', 'warning');
        }
        const esOscuro = document.body.classList.contains('dark-mode');
        const nodes = [];
        const edges = [];
        const rootId = 'sede_root';

        const rootOutId = `${rootId}_out`;
        nodes.push({
            id: rootId,
            label: `<b>${sedeActual.nombre}</b>\n<i>${sedeActual.categoria_cable}</i>`,
            shape: 'image',
            image: 'https://img.icons8.com/fluency/96/company.png',
            size: 48,
            margin: margenNodoDiagrama(24),
            font: { ...fontDiagrama(esOscuro, 12), vadjust: 58 },
            x: 0,
            y: 0,
            fixed: true
        });
        nodes.push(anchorInvisible(rootOutId, 0, 95));

        const zonaById = {};
        zonas.forEach(z => { zonaById[String(z.id)] = z; });
        let pisos = zonas.filter(z => z.tipo === 'piso').sort((a, b) => (a.orden || 0) - (b.orden || 0));
        if (!pisos.length) {
            pisos = [{ id: 'virtual', nombre: 'General', tipo: 'piso', color_hex: '#3b82f6' }];
        }

        const areaEquipos = {};
        const areaFloor = {};
        const areaMeta = {};

        pisos.forEach(p => {
            const pid = String(p.id);
            areaEquipos[`${pid}::general`] = [];
            areaFloor[`${pid}::general`] = pid;
            areaMeta[`${pid}::general`] = {
                nombre: 'General',
                color_hex: p.color_hex || '#3b82f6',
                esGeneral: true
            };
        });

        zonas.filter(z => z.tipo === 'area').forEach(a => {
            const pid = String(a.piso_id || pisos[0].id);
            const key = `area::${a.id}`;
            areaEquipos[key] = [];
            areaFloor[key] = pid;
            areaMeta[key] = {
                nombre: a.nombre,
                color_hex: a.color_hex || '#3b82f6',
                esGeneral: false
            };
        });

        equipos.forEach(e => {
            let key = `${pisos[0].id}::general`;
            if (e.zona_id) {
                const z = zonaById[String(e.zona_id)];
                if (z?.tipo === 'area') key = `area::${z.id}`;
                else if (z?.tipo === 'piso') key = `${z.id}::general`;
            }
            if (!areaEquipos[key]) {
                areaEquipos[key] = [];
                areaFloor[key] = String(pisos[0].id);
                areaMeta[key] = { nombre: 'General', color_hex: '#3b82f6', esGeneral: true };
            }
            areaEquipos[key].push(e);
        });

        const floorGapX = 920;
        const colGapX = 210;
        const yPiso = 195;
        const yAreas = 430;
        const yEquipos = 545;
        const eqGapY = 92;

        pisos.forEach((p, floorIdx) => {
            const pid = String(p.id);
            const floorX = (floorIdx - (pisos.length - 1) / 2) * floorGapX;
            const pNodeId = `piso_${pid}`;
            const colorPiso = p.color_hex || '#3b82f6';

            const pisoTitulo = nodoTituloZona(nodes, edges, {
                id: pNodeId,
                label: `<b>${p.nombre}</b>`,
                x: floorX,
                y: yPiso,
                color: colorPiso,
                fontSize: 14,
                anchoMin: 120,
                anchoMax: 240,
                lineOffset: 18,
                gapBelow: 16,
                gapAbove: 12
            }, esOscuro);
            edges.push({
                from: rootOutId,
                to: pisoTitulo.inId,
                ...edgeStyle('cableado', esOscuro, colorPiso, 'vertical', true),
                width: 1.2
            });

            const keys = Object.keys(areaFloor).filter(k => areaFloor[k] === pid);
            const generalKey = keys.find(k => areaMeta[k].esGeneral);
            const areaKeys = keys
                .filter(k => !areaMeta[k].esGeneral)
                .sort((a, b) => String(areaMeta[a].nombre).localeCompare(String(areaMeta[b].nombre), 'es'));

            const colMeta = [];
            areaKeys.forEach((k, idx) => {
                const cx = floorX + (idx - (areaKeys.length - 1) / 2) * colGapX;
                colMeta.push({ key: k, x: cx, headerId: `hdr_area_${pid}_${idx}`, esGeneral: false });
            });

            const spineId = pisoTitulo.outId;
            if (generalKey) {
                (areaEquipos[generalKey] || []).forEach((e, i) => {
                    agregarEquipoNodo(
                        nodes, edges, e, tipoByCodigo(e.tipo_codigo),
                        floorX, yEquipos + i * eqGapY, spineId, esOscuro, 'vertical'
                    );
                });
            }

            colMeta.filter(c => !c.esGeneral).forEach(c => {
                const areaTitulo = nodoTituloZona(nodes, edges, {
                    id: c.headerId,
                    label: `<b>${areaMeta[c.key].nombre}</b>`,
                    x: c.x,
                    y: yAreas,
                    color: areaMeta[c.key].color_hex,
                    fontSize: 12,
                    anchoMin: 90,
                    anchoMax: 180,
                    lineOffset: 15,
                    gapBelow: 14,
                    gapAbove: 10
                }, esOscuro);
                edges.push({
                    from: spineId,
                    to: areaTitulo.inId,
                    ...edgeStyle('cableado', esOscuro, areaMeta[c.key].color_hex, 'discrete', true),
                    width: 1
                });
                c.conexionId = areaTitulo.outId;
            });

            const areaCols = colMeta.filter(c => !c.esGeneral);
            const maxEq = Math.max(1, ...colMeta.map(c => (areaEquipos[c.key] || []).length));
            const sepAlto = 80 + maxEq * eqGapY;
            for (let i = 0; i < areaCols.length - 1; i++) {
                const sepX = (areaCols[i].x + areaCols[i + 1].x) / 2;
                agregarSeparadorVertical(nodes, edges, `sep_${pid}_${i}`, sepX, yAreas + 32, sepAlto, esOscuro);
            }

            areaCols.forEach(c => {
                const padreArea = c.conexionId || `${c.headerId}_out`;
                (areaEquipos[c.key] || []).forEach((e, i) => {
                    agregarEquipoNodo(
                        nodes, edges, e, tipoByCodigo(e.tipo_codigo),
                        c.x, yEquipos + i * eqGapY, padreArea, esOscuro, 'vertical'
                    );
                });
            });
        });

        document.getElementById('diagramSection').style.display = 'block';
        const container = document.getElementById('network-diagram');
        if (network) network.destroy();
        network = new vis.Network(container, {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        }, {
            nodes: { borderWidth: 0, shadow: false, margin: 10 },
            edges: {
                smooth: { enabled: true, type: 'straight', roundness: 0 },
                color: { color: esOscuro ? '#64748b' : '#94a3b8' },
                font: { background: esOscuro ? '#1e293b' : '#ffffff' }
            },
            interaction: { hover: true, dragNodes: true, zoomView: true },
            layout: { improvedLayout: false },
            physics: false
        });
        BerilionUI.alert('Diagrama generado', 'success');
    }

    function exportarJson() {
        if (!sedeActual) return BerilionUI.alert('Seleccione una sede', 'warning');
        const blob = new Blob([JSON.stringify({
            sede: sedeActual,
            zonas,
            equipos
        }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `red_${sedeActual.id}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    }

    function importarJson(ev) {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const data = JSON.parse(reader.result);
                BerilionUI.alert('Importación JSON: registre equipos manualmente en la sede activa o use respaldo futuro.', 'warning');
            } catch {
                BerilionUI.alert('JSON inválido', 'danger');
            }
            ev.target.value = '';
        };
        reader.readAsText(file);
    }

    init();
})();
