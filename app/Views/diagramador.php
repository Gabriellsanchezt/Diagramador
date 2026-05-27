<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Diagramador de Red - Berilion</title>
    <link rel="stylesheet" href="assets/css/app.css">
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
</head>
<body>

<div id="popover-container"></div>

<button type="button" class="btn-sidebar-toggle" id="btnToggleSidebar" aria-label="Abrir menú de gestión" aria-expanded="false" aria-controls="appSidebar">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
    <span>Menú</span>
</button>

<div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>

<aside class="sidebar-drawer" id="appSidebar" aria-hidden="true">
    <div class="sidebar-header">
        <h2>Gestión</h2>
        <button type="button" class="sidebar-close" id="btnCloseSidebar" aria-label="Cerrar menú">&times;</button>
    </div>
    <nav class="sidebar-nav" role="tablist">
        <button type="button" class="sidebar-nav-btn is-active" data-panel="panel-nueva-sede">Nueva sede</button>
        <button type="button" class="sidebar-nav-btn" data-panel="panel-sede-activa">Sede activa</button>
        <button type="button" class="sidebar-nav-btn" data-panel="panel-respaldos">Respaldos</button>
        <button type="button" class="sidebar-nav-btn" data-panel="panel-ayuda">Ayuda</button>
    </nav>
    <div class="sidebar-body">
        <div class="sidebar-panel is-active" id="panel-nueva-sede" role="tabpanel">
            <p class="sidebar-section-title">Registrar sede</p>
            <div class="form-group">
                <label for="nuevaSedeNombre">Nombre de la sede *</label>
                <input type="text" id="nuevaSedeNombre" maxlength="255" placeholder="Ej: Farmacia San Ignacio (JT)">
            </div>
            <div class="form-group">
                <label for="nuevaSedeRif">RIF (opcional)</label>
                <input type="text" id="nuevaSedeRif" placeholder="J-12345678-9" maxlength="20">
                <span class="field-hint">Formato: J-12345678-9</span>
            </div>
            <div class="form-group">
                <label for="nuevaSedeCable">Categoría de cableado</label>
                <select id="nuevaSedeCable">
                    <option value="No especificado">No especificado</option>
                    <option value="Cat6">Cat6</option>
                    <option value="Cat5e">Cat5e</option>
                </select>
            </div>
            <p class="sidebar-section-title">Pisos y áreas</p>
            <span class="field-hint" style="display:block;margin-bottom:10px;">Cada área debe pertenecer a un piso.</span>
            <div id="pisosNuevaSede" class="pisos-list"></div>
            <button type="button" class="btn btn-help btn-sm" id="btnAddPiso" style="margin-bottom:12px;">+ Agregar piso</button>
            <div class="sidebar-footer-actions">
                <button type="button" class="btn btn-primary" id="btnGuardarSede">Registrar sede</button>
                <button type="button" class="btn btn-help" id="btnLimpiarFormSede">Limpiar formulario</button>
            </div>
        </div>

        <div class="sidebar-panel" id="panel-sede-activa" role="tabpanel">
            <p class="sidebar-section-title">Datos fiscales y cableado</p>
            <div id="sedeActivaSinSeleccion" class="sidebar-hint-box">
                Seleccione una sede en el panel principal para editar su RIF y cableado.
            </div>
            <div id="sedeActivaForm" style="display:none;">
                <p class="field-hint" style="margin-bottom:12px;" id="sedeActivaNombreLabel"></p>
                <div id="sedeRifAlerta" class="sede-rif-alerta" style="display:none;">
                    Esta sede no tiene RIF registrado. Puede agregarlo aquí.
                </div>
                <div class="form-group">
                    <label for="sedeRifEdit">RIF</label>
                    <input type="text" id="sedeRifEdit" placeholder="J-12345678-9" maxlength="20">
                    <span class="field-hint">Deje vacío si aún no lo tiene. Formato: J-12345678-9</span>
                </div>
                <div class="form-group">
                    <label for="sedeCableEdit">Categoría de cableado</label>
                    <select id="sedeCableEdit">
                        <option value="No especificado">No especificado</option>
                        <option value="Cat6">Cat6</option>
                        <option value="Cat5e">Cat5e</option>
                    </select>
                </div>
                <div class="sidebar-footer-actions">
                    <button type="button" class="btn btn-primary" id="btnGuardarDatosSede">Guardar datos de sede</button>
                </div>
            </div>
        </div>

        <div class="sidebar-panel" id="panel-respaldos" role="tabpanel">
            <p class="sidebar-section-title">Respaldo de configuración</p>
            <p class="field-hint" style="margin-bottom:14px;">Exporta o importa la sede activa en formato JSON.</p>
            <div class="backup-actions-stack">
                <button type="button" class="btn btn-backup" id="btnExportar">Exportar JSON</button>
                <input type="file" id="importFileInput" accept=".json" style="display:none">
                <button type="button" class="btn btn-backup" id="btnImportar">Importar JSON</button>
            </div>
        </div>

        <div class="sidebar-panel" id="panel-ayuda" role="tabpanel">
            <p class="sidebar-section-title">Guía rápida</p>
            <div class="sidebar-hint-box">
                <ol>
                    <li>Registre <strong>pisos</strong> y, dentro de cada uno, sus <strong>áreas</strong>.</li>
                    <li>Seleccione la sede en el panel principal para agregar equipos.</li>
                    <li>Switches por capa: acceso, distribución o núcleo.</li>
                    <li>IP obligatoria: biométrico, servidor, impresora, repetidor AP y cámara IP.</li>
                    <li>Conexión cableada (línea sólida) o inalámbrica (punteada) en el diagrama.</li>
                </ol>
            </div>
            <div class="sidebar-footer-actions" style="margin-top:16px;">
                <button type="button" class="btn btn-help" id="btnAyudaCompleta">Ver instrucciones completas</button>
            </div>
        </div>
    </div>
</aside>

<div class="navbar-individual-container visible" id="floatingNavbar">
    <div class="nav-island">
        <button type="button" class="nav-item-btn" id="btnDarkModeNav">Modo Oscuro</button>
    </div>
    <div class="nav-island">
        <button type="button" class="nav-item-btn" id="btnAyuda">Instrucciones</button>
    </div>
    <div class="nav-island">
        <button type="button" class="nav-item-btn nav-user-style" id="btnDropdownUser">
            Usuario: <?= htmlspecialchars($usuario) ?>
        </button>
        <div class="user-dropdown" id="userDropdown">
            <button type="button" class="dropdown-item" id="btnCerrarSesion">Salir</button>
        </div>
    </div>
</div>

<div class="container app-visible">
    <div class="header-area">
        <h1>Diagramador de Red</h1>
        <p class="subtitle">Topología por sede — equipos, zonas y diagrama</p>
    </div>

    <div class="backup-row" style="padding:20px;flex-wrap:wrap;">
        <span style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;width:100%;margin-bottom:4px;">Sede en trabajo</span>
        <div class="custom-select-container" style="flex:2;min-width:280px;">
            <label for="sedeBusqueda">Sede / Empresa</label>
            <input type="text" id="sedeBusqueda" placeholder="Buscar y seleccionar sede..." autocomplete="off" style="width:100%;height:42px;font-weight:600;">
            <div id="dropdownSedes" class="custom-select-dropdown"></div>
        </div>
        <div class="form-group" style="flex:1;min-width:140px;">
            <label>RIF</label>
            <input type="text" id="sedeRifDisplay" readonly placeholder="—">
        </div>
        <div class="form-group" style="flex:1;min-width:140px;">
            <label>Cableado</label>
            <input type="text" id="sedeCableDisplay" readonly placeholder="—">
        </div>
    </div>

    <div id="bloqueRifPendiente" class="rif-pendiente-banner" style="display:none;">
        <div class="rif-pendiente-texto">
            <strong>Sin RIF registrado</strong>
            <span>Agregue el RIF de esta sede para completar su ficha.</span>
        </div>
        <div class="rif-pendiente-acciones">
            <input type="text" id="sedeRifRapido" placeholder="J-12345678-9" maxlength="20">
            <button type="button" class="btn btn-primary btn-sm" id="btnGuardarRifRapido">Guardar RIF</button>
            <button type="button" class="btn btn-help btn-sm" id="btnAbrirPanelSede">Más opciones</button>
        </div>
    </div>

    <div class="form-row">
        <div class="form-group">
            <label for="nodeType">Equipo</label>
            <select id="nodeType"></select>
        </div>
        <div class="form-group">
            <label for="nodeZona">Piso / Área</label>
            <select id="nodeZona"><option value="">Sin zona (general)</option></select>
        </div>
        <div class="form-group">
            <label for="nodeParent">Depende de</label>
            <select id="nodeParent"><option value="">Nodo principal</option></select>
        </div>
        <div class="form-group">
            <label for="medioEnlace">Conexión</label>
            <select id="medioEnlace">
                <option value="cableado">Cableado (UTP/Fibra)</option>
                <option value="inalambrico">Inalámbrico (Wi-Fi)</option>
            </select>
        </div>
        <div class="form-group" id="groupModel">
            <label for="nodeModel" id="labelModel">Modelo</label>
            <input type="text" id="nodeModel" style="width:100%">
        </div>
        <div class="form-group" id="groupIp" style="display:none;">
            <label for="nodeIp">Dirección IP (IPv4)</label>
            <input type="text" id="nodeIp" placeholder="192.168.1.10" maxlength="15">
        </div>
        <div class="form-group" id="groupGeneration" style="display:none;">
            <label for="nodeGeneration">Generación</label>
            <select id="nodeGeneration">
                <option value="">N/A</option>
                <?php for ($g = 1; $g <= 14; $g++): ?>
                <option value="<?= $g ?>ra Gen"><?= $g ?>ra Gen</option>
                <?php endfor; ?>
            </select>
        </div>
        <div class="form-group" id="groupPorts" style="display:none;">
            <label for="nodePorts">Puertos usados</label>
            <select id="nodePorts"></select>
        </div>
        <div class="form-group" id="groupSpeed" style="display:none;">
            <label for="nodeSpeed">Velocidad</label>
            <select id="nodeSpeed">
                <option value="Gigabit (1000 Mbps)">Gigabit (1000 Mbps)</option>
                <option value="Megabit (100 Mbps)">Megabit (100 Mbps)</option>
            </select>
        </div>
        <div class="action-buttons-group" id="formActionsContainer">
            <button type="button" class="btn btn-primary" style="height:40px" id="btnAgregar">Agregar</button>
        </div>
    </div>

    <hr class="divider">
    <h2>Equipos en esta sede</h2>
    <table>
        <thead>
            <tr>
                <th>Equipo</th>
                <th>Zona</th>
                <th>Modelo / IP</th>
                <th>Conexión</th>
                <th>Depende de</th>
                <th style="width:150px">Acción</th>
            </tr>
        </thead>
        <tbody id="tablaNodos">
            <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Seleccione una sede</td></tr>
        </tbody>
    </table>

    <button type="button" class="btn btn-success" id="btnGenerarDiagrama">Generar diagrama</button>

    <div class="diagram-container" id="diagramSection" style="display:none">
        <div class="diagram-header-actions">
            <div>
                <h2>Topología</h2>
                <div class="diagram-legend">
                    <span><i class="legend-line"></i> Cableado</span>
                    <span><i class="legend-line dash"></i> Inalámbrico</span>
                    <span>Jerarquía: Sede → Piso → Área → Equipo</span>
                </div>
            </div>
            <button type="button" class="btn btn-pdf" onclick="window.print()">PDF</button>
        </div>
        <div id="network-diagram"></div>
    </div>

    <p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:30px;border-top:1px solid var(--border);padding-top:15px;">
        &copy; 2026 Berilion J-508195619.
    </p>
</div>

<div id="helpModal" class="modal">
    <div class="modal-content">
        <span class="close-btn" data-close="helpModal">&times;</span>
        <h3>Guía de operación</h3>
        <ol>
            <li>Use el <strong>Menú</strong> lateral para registrar sedes, pisos y áreas.</li>
            <li>Seleccione la sede en el panel principal y agregue equipos.</li>
            <li>Los switches se clasifican por capa: acceso, distribución o núcleo.</li>
            <li>Biométricos, servidor, impresora y repetidor AP requieren IP.</li>
            <li>Conexión cableada o inalámbrica según el enlace físico real.</li>
            <li>Cámaras IP (con IP) o cableadas (hacia DVR/NVR).</li>
        </ol>
    </div>
</div>

<script src="assets/js/common.js"></script>
<script src="assets/js/diagramador.js"></script>
</body>
</html>
