const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    
    const paginaActual = window.location.pathname.split('/').pop();
    
    if (paginaActual === 'dashboard-cliente.html') {
        cargarDashboardCliente();
    }
    
    if (paginaActual === 'dashboard-admin.html') {
        cargarDashboardAdmin();
    }
    
    if (paginaActual === 'mis-incidentes.html') {
        cargarMisIncidentes();
        inicializarFiltrosCliente();
    }
    
    if (paginaActual === 'todos-incidentes.html') {
        cargarTodosIncidentes();
        inicializarFiltrosAdmin();
        inicializarGestionIncidentes();
    }
});

function obtenerToken() {
    const usuario = obtenerUsuarioActivo();
    return usuario ? usuario.token : null;
}

async function cargarDashboardCliente() {
    const token = obtenerToken();
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/incidentes/mis-incidentes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const misIncidentes = data.incidentes;
            
            const totalPendientes = misIncidentes.filter(inc => inc.estado_codigo === 'PENDIENTE').length;
            const totalEnProgreso = misIncidentes.filter(inc => inc.estado_codigo === 'EN_PROGRESO').length;
            const totalResueltos = misIncidentes.filter(inc => inc.estado_codigo === 'RESUELTO').length;
            
            document.getElementById('totalPendientes').textContent = totalPendientes;
            document.getElementById('totalEnProgreso').textContent = totalEnProgreso;
            document.getElementById('totalResueltos').textContent = totalResueltos;
            
            mostrarIncidentesRecientes(misIncidentes.slice(0, 5));
        }
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    }
}

async function cargarDashboardAdmin() {
    const token = obtenerToken();
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/incidentes/estadisticas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const stats = data.estadisticas;
            
            document.getElementById('totalIncidentes').textContent = stats.total_incidentes;
            document.getElementById('totalPendientes').textContent = stats.pendientes;
            document.getElementById('totalEnProgreso').textContent = stats.en_progreso;
            document.getElementById('totalCriticos').textContent = stats.criticos;
            
            document.getElementById('catTecnico').textContent = stats.cat_tecnico;
            document.getElementById('catFacturacion').textContent = stats.cat_facturacion;
            document.getElementById('catConsulta').textContent = stats.cat_consulta;
            document.getElementById('catReclamo').textContent = stats.cat_reclamo;
        }
        
        await mostrarIncidentesCriticosYRecientes();
        
    } catch (error) {
        console.error('Error al cargar dashboard admin:', error);
    }
}

async function mostrarIncidentesCriticosYRecientes() {
    const token = obtenerToken();
    
    try {
        const response = await fetch(`${API_URL}/incidentes/todos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const incidentes = data.incidentes;
            
            const criticos = incidentes.filter(inc => inc.prioridad === 'Crítica' && inc.estado_codigo !== 'CERRADO');
            mostrarIncidentesCriticos(criticos);
            
            const recientes = incidentes.slice(0, 5);
            mostrarActividadReciente(recientes);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarIncidentesRecientes(incidentesRecientes) {
    const contenedor = document.getElementById('incidentesRecientes');
    
    if (!contenedor) return;
    
    if (incidentesRecientes.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
                <p class="text-muted mt-3">No tienes incidentes recientes</p>
                <a href="crear-incidente.html" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> Crear Nuevo Incidente
                </a>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    
    incidentesRecientes.forEach(incidente => {
        html += `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${incidente.numero_caso}</h6>
                    <small>${formatearFecha(incidente.fecha_apertura)}</small>
                </div>
                <p class="mb-1">${incidente.titulo}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small>${obtenerBadgeEstado(incidente.estado)}</small>
                    <small>${obtenerBadgePrioridad(incidente.prioridad)}</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    contenedor.innerHTML = html;
}

function mostrarIncidentesCriticos(criticos) {
    const contenedor = document.getElementById('incidentesCriticos');
    
    if (!contenedor) return;
    
    if (criticos.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-check-circle" style="font-size: 3rem; color: #28a745;"></i>
                <p class="text-muted mt-2">No hay incidentes críticos</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group list-group-flush">';
    
    criticos.slice(0, 3).forEach(incidente => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <strong>${incidente.numero_caso}</strong>
                    ${obtenerBadgePrioridad(incidente.prioridad)}
                </div>
                <p class="mb-1 mt-2">${incidente.titulo}</p>
                <small class="text-muted">${incidente.cliente_nombre}</small>
            </div>
        `;
    });
    
    html += '</div>';
    contenedor.innerHTML = html;
}

function mostrarActividadReciente(recientes) {
    const contenedor = document.getElementById('actividadReciente');
    
    if (!contenedor) return;
    
    if (recientes.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-2">No hay actividad reciente</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group list-group-flush">';
    
    recientes.forEach(incidente => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <strong>${incidente.numero_caso}</strong>
                    ${obtenerBadgeEstado(incidente.estado)}
                </div>
                <p class="mb-1 mt-2">${incidente.titulo}</p>
                <small class="text-muted">${formatearFecha(incidente.fecha_apertura)}</small>
            </div>
        `;
    });
    
    html += '</div>';
    contenedor.innerHTML = html;
}

async function cargarMisIncidentes() {
    const token = obtenerToken();
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/incidentes/mis-incidentes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.incidentesFiltrados = data.incidentes;
            renderizarTablaIncidentes(data.incidentes, false);
        }
        
    } catch (error) {
        console.error('Error al cargar incidentes:', error);
    }
}

async function cargarTodosIncidentes() {
    const token = obtenerToken();
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/incidentes/todos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.incidentesFiltrados = data.incidentes;
            renderizarTablaIncidentes(data.incidentes, true);
        }
        
    } catch (error) {
        console.error('Error al cargar todos los incidentes:', error);
    }
}

function renderizarTablaIncidentes(incidentesMostrar, esAdmin) {
    const tbody = document.getElementById('tablaIncidentes');
    
    if (!tbody) return;
    
    if (incidentesMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${esAdmin ? '8' : '7'}" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">No hay incidentes para mostrar</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    incidentesMostrar.forEach(incidente => {
        html += `
            <tr>
                <td>${incidente.numero_caso}</td>
                ${esAdmin ? `<td>${incidente.cliente_nombre}</td>` : ''}
                <td>${incidente.titulo}</td>
                <td>${incidente.categoria}</td>
                <td>${obtenerBadgePrioridad(incidente.prioridad)}</td>
                <td>${obtenerBadgeEstado(incidente.estado)}</td>
                <td>${formatearFecha(incidente.fecha_apertura)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verDetalleIncidente(${incidente.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${esAdmin ? `
                        <button class="btn btn-sm btn-warning" onclick="gestionarIncidente(${incidente.id})">
                            <i class="bi bi-gear"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function inicializarFiltrosCliente() {
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroPrioridad = document.getElementById('filtroPrioridad');
    const buscarIncidente = document.getElementById('buscarIncidente');
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', aplicarFiltrosCliente);
    }
    
    if (filtroPrioridad) {
        filtroPrioridad.addEventListener('change', aplicarFiltrosCliente);
    }
    
    if (buscarIncidente) {
        buscarIncidente.addEventListener('input', aplicarFiltrosCliente);
    }
}

function inicializarFiltrosAdmin() {
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroPrioridad = document.getElementById('filtroPrioridad');
    const buscarIncidente = document.getElementById('buscarIncidente');
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', aplicarFiltrosAdmin);
    }
    
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', aplicarFiltrosAdmin);
    }
    
    if (filtroPrioridad) {
        filtroPrioridad.addEventListener('change', aplicarFiltrosAdmin);
    }
    
    if (buscarIncidente) {
        buscarIncidente.addEventListener('input', aplicarFiltrosAdmin);
    }
}

async function aplicarFiltrosCliente() {
    await cargarMisIncidentes();
    
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroPrioridad = document.getElementById('filtroPrioridad').value;
    const buscar = document.getElementById('buscarIncidente').value.toLowerCase();
    
    let filtrados = [...window.incidentesFiltrados];
    
    if (filtroEstado) {
        filtrados = filtrados.filter(inc => inc.estado === filtroEstado);
    }
    
    if (filtroPrioridad) {
        filtrados = filtrados.filter(inc => inc.prioridad === filtroPrioridad);
    }
    
    if (buscar) {
        filtrados = filtrados.filter(inc => 
            inc.titulo.toLowerCase().includes(buscar) ||
            inc.numero_caso.toLowerCase().includes(buscar)
        );
    }
    
    renderizarTablaIncidentes(filtrados, false);
}

async function aplicarFiltrosAdmin() {
    await cargarTodosIncidentes();
    
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroCategoria = document.getElementById('filtroCategoria').value;
    const filtroPrioridad = document.getElementById('filtroPrioridad').value;
    const buscar = document.getElementById('buscarIncidente').value.toLowerCase();
    
    let filtrados = [...window.incidentesFiltrados];
    
    if (filtroEstado) {
        filtrados = filtrados.filter(inc => inc.estado === filtroEstado);
    }
    
    if (filtroCategoria) {
        filtrados = filtrados.filter(inc => inc.categoria === filtroCategoria);
    }
    
    if (filtroPrioridad) {
        filtrados = filtrados.filter(inc => inc.prioridad === filtroPrioridad);
    }
    
    if (buscar) {
        filtrados = filtrados.filter(inc => 
            inc.titulo.toLowerCase().includes(buscar) ||
            inc.numero_caso.toLowerCase().includes(buscar) ||
            inc.cliente_nombre.toLowerCase().includes(buscar)
        );
    }
    
    renderizarTablaIncidentes(filtrados, true);
}

async function verDetalleIncidente(id) {
    const token = obtenerToken();
    
    try {
        const response = await fetch(`${API_URL}/incidentes/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const incidente = data.incidente;
            
            document.getElementById('detalleCaso').textContent = incidente.numero_caso;
            document.getElementById('detalleEstado').innerHTML = obtenerBadgeEstado(incidente.estado);
            document.getElementById('detalleCategoria').textContent = incidente.categoria;
            document.getElementById('detallePrioridad').innerHTML = obtenerBadgePrioridad(incidente.prioridad);
            document.getElementById('detalleFechaApertura').textContent = formatearFecha(incidente.fecha_apertura);
            document.getElementById('detalleFechaCierre').textContent = incidente.fecha_cierre ? formatearFecha(incidente.fecha_cierre) : 'Sin cerrar';
            document.getElementById('detalleTitulo').textContent = incidente.titulo;
            document.getElementById('detalleDescripcion').textContent = incidente.descripcion;
            
            const detalleCliente = document.getElementById('detalleCliente');
            if (detalleCliente) {
                detalleCliente.textContent = incidente.cliente_nombre;
            }
            
            const detalleResponsable = document.getElementById('detalleResponsable');
            if (detalleResponsable) {
                detalleResponsable.textContent = incidente.responsable || 'Sin asignar';
            }
            
            const modal = new bootstrap.Modal(document.getElementById('modalDetalleIncidente'));
            modal.show();
        }
        
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        alert('Error al cargar el detalle del incidente');
    }
}

function inicializarGestionIncidentes() {
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');
    
    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', guardarCambiosIncidente);
    }
}

async function gestionarIncidente(id) {
    const token = obtenerToken();
    
    try {
        const response = await fetch(`${API_URL}/incidentes/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const incidente = data.incidente;
            
            document.getElementById('gestionCaso').textContent = incidente.numero_caso;
            document.getElementById('gestionCliente').textContent = incidente.cliente_nombre;
            document.getElementById('cambiarEstado').value = incidente.estado;
            document.getElementById('asignarResponsable').value = incidente.responsable || '';
            document.getElementById('comentarioAdmin').value = '';
            
            document.getElementById('btnGuardarCambios').setAttribute('data-incidente-id', id);
            
            const modal = new bootstrap.Modal(document.getElementById('modalGestionIncidente'));
            modal.show();
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el incidente');
    }
}

async function guardarCambiosIncidente() {
    const id = parseInt(document.getElementById('btnGuardarCambios').getAttribute('data-incidente-id'));
    const nuevoEstado = document.getElementById('cambiarEstado').value;
    const comentario = document.getElementById('comentarioAdmin').value;
    const token = obtenerToken();
    
    try {
        const response = await fetch(`${API_URL}/incidentes/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado,
                comentario: comentario
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalGestionIncidente'));
            modal.hide();
            
            alert('Cambios guardados exitosamente');
            
            cargarTodosIncidentes();
        } else {
            alert(data.message || 'Error al guardar cambios');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar cambios');
    }
}

function obtenerBadgeEstado(estado) {
    const clases = {
        'Pendiente': 'badge-pendiente',
        'En Progreso': 'badge-en-progreso',
        'En Espera': 'badge-en-espera',
        'Resuelto': 'badge-resuelto',
        'Cerrado': 'badge-cerrado'
    };
    
    return `<span class="badge badge-estado ${clases[estado]}">${estado}</span>`;
}

function obtenerBadgePrioridad(prioridad) {
    const clases = {
        'Baja': 'badge-baja',
        'Media': 'badge-media',
        'Alta': 'badge-alta',
        'Crítica': 'badge-critica'
    };
    
    return `<span class="badge badge-prioridad ${clases[prioridad]}">${prioridad}</span>`;
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-AR', opciones);
}