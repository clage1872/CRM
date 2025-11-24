document.addEventListener('DOMContentLoaded', function() {
    
    const formLogin = document.getElementById('formLogin');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const recuperarPassword = document.getElementById('recuperarPassword');
    
    if (formLogin) {
        inicializarLogin();
    }
    
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', cerrarSesion);
    }
    
    if (recuperarPassword) {
        recuperarPassword.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Funcionalidad de recuperación de contraseña - Conectar con backend');
        });
    }
    
    verificarSesionActiva();
    cargarDatosUsuario();
});

function inicializarLogin() {
    const form = document.getElementById('formLogin');
    const cuit = document.getElementById('cuit');
    const password = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    
    if (cuit) {
        cuit.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
        });
    }
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const eyeIcon = document.getElementById('eyeIcon');
            
            if (password.type === 'password') {
                password.type = 'text';
                eyeIcon.classList.remove('bi-eye');
                eyeIcon.classList.add('bi-eye-slash');
            } else {
                password.type = 'password';
                eyeIcon.classList.remove('bi-eye-slash');
                eyeIcon.classList.add('bi-eye');
            }
        });
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        procesarLogin();
    });
}

async function procesarLogin() {
    const cuit = document.getElementById('cuit').value;
    const password = document.getElementById('password').value;
    const recordarme = document.getElementById('recordarme').checked;
    
    if (!validarCUITLogin(cuit)) {
        mostrarError('El CUIT debe tener 11 dígitos numéricos');
        return;
    }
    
    if (!password) {
        mostrarError('La contraseña es obligatoria');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cuit, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            guardarSesion(data.usuario, data.token, recordarme);
            redirigirSegunRol(data.usuario);
        } else {
            mostrarError(data.message || 'CUIT o contraseña incorrectos');
            document.getElementById('password').value = '';
        }
        
    } catch (error) {
        mostrarError('Error de conexión con el servidor');
    }
}

function validarCUITLogin(cuit) {
    return /^\d{11}$/.test(cuit);
}

function guardarSesion(usuario, token, recordarme) {
    const datosUsuario = {
        ...usuario,
        token: token,
        fechaLogin: new Date().toISOString()
    };
    
    if (recordarme) {
        localStorage.setItem('usuarioActivo', JSON.stringify(datosUsuario));
    } else {
        sessionStorage.setItem('usuarioActivo', JSON.stringify(datosUsuario));
    }
    
    console.log('Sesión guardada:', datosUsuario);
}

function obtenerUsuarioActivo() {
    const usuarioLocal = localStorage.getItem('usuarioActivo');
    const usuarioSession = sessionStorage.getItem('usuarioActivo');
    
    if (usuarioLocal) {
        return JSON.parse(usuarioLocal);
    } else if (usuarioSession) {
        return JSON.parse(usuarioSession);
    }
    
    return null;
}

function verificarSesionActiva() {
    const paginasPublicas = ['index.html', 'login.html', 'registro.html', ''];
    const paginaActual = window.location.pathname.split('/').pop();
    
    if (paginasPublicas.includes(paginaActual)) {
        return;
    }
    
    const usuario = obtenerUsuarioActivo();
    
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    
    verificarAccesoSegunRol(usuario.rol, paginaActual);
}

function verificarAccesoSegunRol(rol, paginaActual) {
    const paginasAdmin = ['dashboard-admin.html', 'todos-incidentes.html'];
    const paginasCliente = ['dashboard-cliente.html', 'crear-incidente.html', 'mis-incidentes.html'];
    
    if (rol === 'admin') {
        if (paginasCliente.includes(paginaActual)) {
            window.location.href = 'dashboard-admin.html';
        }
    } else if (rol === 'cliente') {
        if (paginasAdmin.includes(paginaActual)) {
            window.location.href = 'dashboard-cliente.html';
        }
    }
}

function cargarDatosUsuario() {
    const usuario = obtenerUsuarioActivo();
    
    if (!usuario) {
        return;
    }
    
    const nombreUsuario = document.getElementById('nombreUsuario');
    const nombreAdmin = document.getElementById('nombreAdmin');
    
    if (nombreUsuario) {
        nombreUsuario.textContent = `${usuario.nombre} ${usuario.apellido}`;
    }
    
    if (nombreAdmin) {
        nombreAdmin.textContent = `${usuario.nombre} ${usuario.apellido}`;
    }
}
function redirigirSegunRol(usuario) {
    const rol = usuario.rol || 'cliente';

    switch(rol) {
        case 'admin':
            window.location.href = 'dashboard-admin.html';
            break;
        case 'tecnico':
            window.location.href = 'dashboard-tecnico.html';
            break;
        case 'cliente':
            window.location.href = 'dashboard-cliente.html';
            break;
        default:
            window.location.href = 'dashboard-cliente.html';
    }
}

function cerrarSesion(e) {
    e.preventDefault();
    
    const confirmar = confirm('¿Está seguro que desea cerrar sesión?');
    
    if (confirmar) {
        localStorage.removeItem('usuarioActivo');
        sessionStorage.removeItem('usuarioActivo');
        
        console.log('Sesión cerrada');
        
        window.location.href = 'index.html';
    }
}

function mostrarError(mensaje) {
    const alertError = document.getElementById('alertError');
    const errorMessage = document.getElementById('errorMessage');
    
    if (alertError && errorMessage) {
        errorMessage.textContent = mensaje;
        alertError.classList.add('show');
        
        setTimeout(() => {
            alertError.classList.remove('show');
        }, 5000);
    } else {
        alert(mensaje);
    }
}

function esAdmin() {
    const usuario = obtenerUsuarioActivo();
    return usuario && usuario.rol === 'admin';
}

function esCliente() {
    const usuario = obtenerUsuarioActivo();
    return usuario && usuario.rol === 'cliente';
}