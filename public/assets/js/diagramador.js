(function () {
    let tiposEquipo = [];
    let sedeActual = null;
    let zonas = [];
    let equipos = [];
    let network = null;
    let editId = null;
    let sedesCache = [];

    const iconRepo = {
        Router: 'https://img.icons8.com/fluency/96/router.png',
        Deco: 'https://img.icons8.com/fluency/96/wi-fi-router.png',
        Repetidor: 'https://img.icons8.com/fluency/96/repeater.png',
        Switch_Acceso_16: 'https://img.icons8.com/fluency/96/hub.png',
        Switch_Acceso_24: 'https://img.icons8.com/fluency/96/hub.png',
        Switch_Distrib_16: 'https://img.icons8.com/fluency/96/hub.png',
        Switch_Distrib_24: 'https://img.icons8.com/fluency/96/hub.png',
        Switch_Nucleo_16: 'https://img.icons8.com/fluency/96/hub.png',
        Switch_Puesto_5: 'https://img.icons8.com/fluency/96/switch.png',
        Switch_Puesto_8: 'https://img.icons8.com/fluency/96/switch.png',
        Servidor: 'https://img.icons8.com/fluency/96/server.png',
        DVR: 'https://img.icons8.com/fluency/96/video-recorder.png',
        Camara_IP: 'https://img.icons8.com/fluency/96/cctv.png',
        Camara_Cableada: 'https://img.icons8.com/fluency/96/camera.png',
        Interbancario: 'https://img.icons8.com/fluency/96/bank.png',
        Biometrico: 'https://img.icons8.com/fluency/96/fingerprint.png',
        Impresora: 'https://img.icons8.com/fluency/96/printer.png',
        PC: 'https://img.icons8.com/fluency/96/monitor.png'
    };

    const capaLabel = { acceso: 'Acceso', distribucion: 'Distribución', nucleo: 'Núcleo' };

    function tipoByCodigo(c) {
        return tiposEquipo.find(t => t.codigo === c);
    }

    function capaFromTipo(codigo) {
        if (codigo.includes('Distrib')) return 'distribucion';
        if (codigo.includes('Nucleo')) return 'nucleo';
        return 'acceso';
    }

    function requiereVelocidad(t) {
        return t && parseInt(t.requiere_velocidad, 10) === 1;
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
        window.location.href = window.APP_BASE + '/index.php?page=logout';
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

    function activarPanelSidebar(panelId) {
        document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.panel === panelId);
        });
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.classList.toggle('is-active', panel.id === panelId);
        });
    }

    btnToggleSidebar.onclick = () => {
        if (sidebar.classList.contains('is-open')) closeSidebar();
        else openSidebar('panel-nueva-sede');
    };
    document.getElementById('btnCloseSidebar').onclick = closeSidebar;
    sidebarOverlay.onclick = closeSidebar;

    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
        btn.onclick = () => activarPanelSidebar(btn.dataset.panel);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeSidebar();
    });

    async function init() {
        const t = await apiGet('tipos');
        if (!t.ok) return BerilionUI.alert('Error cargando tipos', 'danger');
        tiposEquipo = t.data;
        const sel = document.getElementById('nodeType');
        sel.innerHTML = tiposEquipo.map(x =>
            `<option value="${x.codigo}">${x.etiqueta}</option>`
        ).join('');
        await cargarSedes('');
        bindEvents();
        onTipoChange();
        prepararFormularioSede();
    }

    function bindEvents() {
        document.getElementById('nodeType').onchange = onTipoChange;
        document.getElementById('nodeParent').onchange = actualizarPuertos;
        document.getElementById('btnAgregar').onclick = guardarEquipo;
        document.getElementById('btnGenerarDiagrama').onclick = generarDiagrama;
        document.getElementById('btnAddPiso').onclick = addPisoBlock;
        document.getElementById('btnGuardarSede').onclick = guardarNuevaSede;
        document.getElementById('btnLimpiarFormSede').onclick = limpiarFormularioSede;
        document.getElementById('btnAyudaCompleta').onclick = () => {
            closeSidebar();
            document.getElementById('helpModal').style.display = 'flex';
        };
        document.getElementById('btnExportar').onclick = exportarJson;
        document.getElementById('btnImportar').onclick = () => document.getElementById('importFileInput').click();
        document.getElementById('importFileInput').onchange = importarJson;
        document.getElementById('btnGuardarDatosSede').onclick = () => guardarDatosSede();
        document.getElementById('btnGuardarRifRapido').onclick = () => guardarDatosSede(true);
        document.getElementById('btnAbrirPanelSede').onclick = () => openSidebar('panel-sede-activa');

        const busq = document.getElementById('sedeBusqueda');
        busq.onfocus = () => { document.getElementById('dropdownSedes').style.display = 'block'; filtrarSedes(busq.value); };
        busq.oninput = () => filtrarSedes(busq.value);
        document.addEventListener('click', e => {
            if (!e.target.closest('.custom-select-container')) {
                document.getElementById('dropdownSedes').style.display = 'none';
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
        actualizarSelectZonas();
        actualizarTabla();
        actualizarPadres();
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
        document.getElementById('groupPorts').style.display = codigo === 'PC' ? 'flex' : 'none';
        document.getElementById('groupSpeed').style.display = requiereVelocidad(t) ? 'flex' : 'none';
        document.getElementById('groupGeneration').style.display = codigo === 'Servidor' ? 'flex' : 'none';
        document.getElementById('labelModel').textContent = codigo === 'Servidor' ? 'Procesador' : 'Modelo';
        if (codigo === 'PC') actualizarPuertos();
    }

    async function actualizarPuertos() {
        if (!sedeActual || document.getElementById('nodeType').value !== 'PC') return;
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
        equipos.filter(e => e.tipo_codigo !== 'PC' && String(e.id) !== String(editId)).forEach(e => {
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
        document.getElementById('nodeModel').value = e.modelo || '';
        document.getElementById('nodeIp').value = e.ip || '';
        document.getElementById('nodeSpeed').value = e.velocidad || 'Gigabit (1000 Mbps)';
        onTipoChange();
        if (e.tipo_codigo === 'PC') {
            document.getElementById('nodePorts').value = e.puertos_usados;
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
        addPisoBlock();
    }

    function prepararFormularioSede() {
        limpiarFormularioSede();
        activarPanelSidebar('panel-nueva-sede');
    }

    function addAreaRow(areasContainer) {
        const row = document.createElement('div');
        row.className = 'area-item-row';
        row.innerHTML = `
            <input type="text" class="area-nombre" placeholder="Nombre del área (ej: Farmacia, Bodega)">
            <button type="button" class="btn btn-danger btn-sm">×</button>`;
        row.querySelector('button').onclick = () => row.remove();
        areasContainer.appendChild(row);
    }

    function addPisoBlock() {
        const block = document.createElement('div');
        block.className = 'piso-block';
        block.innerHTML = `
            <div class="piso-block-header">
                <input type="text" class="piso-nombre" placeholder="Nombre del piso (ej: Piso 1, Planta baja)">
                <button type="button" class="btn btn-danger btn-sm" title="Quitar piso">×</button>
            </div>
            <div class="areas-en-piso"></div>
            <button type="button" class="btn btn-help btn-sm btn-add-area">+ Área en este piso</button>`;
        block.querySelector('.piso-block-header button').onclick = () => block.remove();
        block.querySelector('.btn-add-area').onclick = () => addAreaRow(block.querySelector('.areas-en-piso'));
        document.getElementById('pisosNuevaSede').appendChild(block);
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

    function edgeStyle(medio, esOscuro, highlight) {
        const cable = medio !== 'inalambrico';
        return {
            arrows: 'to',
            color: { color: esOscuro ? '#64748b' : '#94a3b8', highlight: highlight || '#1e3a8a' },
            width: cable ? 2.5 : 2,
            dashes: cable ? false : [8, 6]
        };
    }

    function generarDiagrama() {
        if (!sedeActual || !equipos.length) {
            return BerilionUI.alert('Agregue equipos para generar el diagrama', 'warning');
        }
        const esOscuro = document.body.classList.contains('dark-mode');
        const nodes = [];
        const edges = [];
        const rootId = 'sede_root';

        nodes.push({
            id: rootId,
            label: `<b>${sedeActual.nombre}</b>\n<i>${sedeActual.categoria_cable}</i>`,
            shape: 'image',
            image: 'https://img.icons8.com/fluency/96/company.png',
            size: 48,
            font: { color: esOscuro ? '#60a5fa' : '#1e3a8a', size: 13, multi: true, bold: true }
        });

        const zonaNodeId = {};
        const idsNecesarios = new Set();

        equipos.forEach(e => {
            if (!e.zona_id) return;
            idsNecesarios.add(String(e.zona_id));
            const z = zonas.find(x => x.id == e.zona_id);
            if (z && z.tipo === 'area' && z.piso_id) {
                idsNecesarios.add(String(z.piso_id));
            }
        });

        const agregarNodoZona = (z) => {
            const nid = 'zona_' + z.id;
            if (zonaNodeId[z.id]) return;
            zonaNodeId[z.id] = nid;
            const esArea = z.tipo === 'area';
            nodes.push({
                id: nid,
                label: esArea
                    ? `<b>ÁREA</b>\n${z.nombre}\n<i>${z.piso_nombre || ''}</i>`
                    : `<b>PISO</b>\n${z.nombre}`,
                shape: 'box',
                color: {
                    background: esOscuro ? '#1e293b' : '#f8fafc',
                    border: z.color_hex || '#3b82f6',
                    highlight: { border: z.color_hex }
                },
                borderWidth: esArea ? 2 : 3,
                font: { color: esOscuro ? '#f8fafc' : '#0f172a', size: 12, multi: true },
                margin: 12
            });
        };

        idsNecesarios.forEach(zid => {
            const z = zonas.find(x => x.id == zid);
            if (!z) return;
            agregarNodoZona(z);
            if (z.tipo === 'piso') {
                edges.push({
                    from: rootId,
                    to: zonaNodeId[z.id],
                    ...edgeStyle('cableado', esOscuro, z.color_hex),
                    width: 2
                });
            }
        });

        idsNecesarios.forEach(zid => {
            const z = zonas.find(x => x.id == zid);
            if (!z || z.tipo !== 'area' || !z.piso_id) return;
            const padreNid = zonaNodeId[z.piso_id];
            if (!padreNid) return;
            edges.push({
                from: padreNid,
                to: zonaNodeId[z.id],
                ...edgeStyle('cableado', esOscuro, z.color_hex),
                width: 2
            });
        });

        equipos.forEach(e => {
            const t = tipoByCodigo(e.tipo_codigo);
            const etiqueta = t ? t.etiqueta : e.tipo_codigo;
            let label = `<b>${etiqueta}</b>`;
            if (parseInt(t?.es_switch, 10)) {
                label = `<b>[${capaLabel[e.switch_capa] || 'Acceso'}]</b>\n${etiqueta}`;
            }
            if (e.ip) label += `\n${e.ip}`;
            else if (e.modelo && e.modelo !== 'N/A') label += `\n${e.modelo}`;
            if (e.tipo_codigo === 'PC') label = `<b>PC</b>\nP:${e.puertos_usados}`;

            nodes.push({
                id: 'eq_' + e.id,
                label,
                shape: 'image',
                image: iconRepo[e.tipo_codigo] || 'https://img.icons8.com/fluency/96/network.png',
                size: 32,
                font: { color: esOscuro ? '#f8fafc' : '#0f172a', size: 11, multi: true }
            });

            const eid = 'eq_' + e.id;
            if (e.padre_id) {
                edges.push({
                    from: 'eq_' + e.padre_id,
                    to: eid,
                    ...edgeStyle(e.medio_enlace, esOscuro)
                });
            } else if (e.zona_id && zonaNodeId[e.zona_id]) {
                edges.push({
                    from: zonaNodeId[e.zona_id],
                    to: eid,
                    ...edgeStyle(e.medio_enlace, esOscuro)
                });
            } else {
                edges.push({
                    from: rootId,
                    to: eid,
                    ...edgeStyle(e.medio_enlace, esOscuro)
                });
            }
        });

        document.getElementById('diagramSection').style.display = 'block';
        const container = document.getElementById('network-diagram');
        if (network) network.destroy();
        network = new vis.Network(container, {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        }, {
            nodes: { borderWidth: 0, shadow: true },
            edges: { smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.35 } },
            layout: { hierarchical: { direction: 'UD', sortMethod: 'directed', nodeSpacing: 130, treeSpacing: 180 } },
            physics: { hierarchicalRepulsion: { nodeDistance: 150 } }
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
