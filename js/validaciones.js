document.addEventListener('DOMContentLoaded', function() {
    
    const formRegistro = document.getElementById('formRegistro');
    const formIncidente = document.getElementById('formIncidente');
    
    if (formRegistro) {
        inicializarValidacionesRegistro();
    }
    
    if (formIncidente) {
        inicializarValidacionesIncidente();
    }
    
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
});

function inicializarValidacionesRegistro() {
    const form = document.getElementById('formRegistro');
    const nombre = document.getElementById('nombre');
    const apellido = document.getElementById('apellido');
    const email = document.getElementById('email');
    const cuit = document.getElementById('cuit');
    const password = document.getElementById('password');
    const confirmarPassword = document.getElementById('confirmarPassword');
    
    nombre.addEventListener('input', function() {
        validarCampoTexto(this, 'El nombre es obligatorio');
    });
    
    apellido.addEventListener('input', function() {
        validarCampoTexto(this, 'El apellido es obligatorio');
    });
    
    email.addEventListener('blur', function() {
        validarEmail(this);
    });
    
    cuit.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        validarCUIT(this);
    });
    
    password.addEventListener('input', function() {
        validarPassword(this);
        if (confirmarPassword.value) {
            validarConfirmarPassword(confirmarPassword, password);
        }
    });
    
    confirmarPassword.addEventListener('input', function() {
        validarConfirmarPassword(this, password);
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const valido = validarFormularioRegistro();
        
        if (valido) {
            enviarFormularioRegistro(form);
        } else {
            mostrarErrorGeneral('Por favor, corrija los errores antes de continuar.');
        }
    });
}

function inicializarValidacionesIncidente() {
    const form = document.getElementById('formIncidente');
    const titulo = document.getElementById('titulo');
    const categoria = document.getElementById('categoria');
    const prioridad = document.getElementById('prioridad');
    const descripcion = document.getElementById('descripcion');
    const contadorTitulo = document.getElementById('contadorTitulo');
    
    if (titulo && contadorTitulo) {
        titulo.addEventListener('input', function() {
            const restantes = 100 - this.value.length;
            contadorTitulo.textContent = restantes;
            
            if (restantes < 20) {
                contadorTitulo.style.color = '#dc3545';
            } else {
                contadorTitulo.style.color = '#6c757d';
            }
            
            validarCampoTexto(this, 'El título es obligatorio');
        });
    }
    
    if (categoria) {
        categoria.addEventListener('change', function() {
            validarSelect(this, 'Debe seleccionar una categoría');
        });
    }
    
    if (prioridad) {
        prioridad.addEventListener('change', function() {
            validarSelect(this, 'Debe seleccionar una prioridad');
        });
    }
    
    if (descripcion) {
        descripcion.addEventListener('input', function() {
            validarCampoTexto(this, 'La descripción es obligatoria');
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const valido = validarFormularioIncidente();
            
            if (valido) {
                enviarFormularioIncidente(form);
            } else {
                mostrarErrorGeneral('Por favor, complete todos los campos obligatorios.');
            }
        });
    }
}

function validarCampoTexto(campo, mensaje) {
    if (campo.value.trim() === '') {
        marcarInvalido(campo, mensaje);
        return false;
    } else {
        marcarValido(campo);
        return true;
    }
}

function validarEmail(campo) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(campo.value)) {
        marcarInvalido(campo, 'Ingrese un email válido');
        return false;
    } else {
        marcarValido(campo);
        return true;
    }
}

function validarCUIT(campo) {
    const cuitRegex = /^\d{11}$/;
    
    if (!cuitRegex.test(campo.value)) {
        marcarInvalido(campo, 'El CUIT debe tener 11 dígitos numéricos');
        return false;
    } else {
        marcarValido(campo);
        return true;
    }
}

function validarPassword(campo) {
    const password = campo.value;
    
    const requisitos = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    actualizarRequisitoPassword('req-length', requisitos.length);
    actualizarRequisitoPassword('req-uppercase', requisitos.uppercase);
    actualizarRequisitoPassword('req-lowercase', requisitos.lowercase);
    actualizarRequisitoPassword('req-number', requisitos.number);
    actualizarRequisitoPassword('req-special', requisitos.special);
    
    const todosValidos = Object.values(requisitos).every(val => val === true);
    
    if (!todosValidos) {
        marcarInvalido(campo, 'La contraseña no cumple con todos los requisitos');
        return false;
    } else {
        marcarValido(campo);
        return true;
    }
}

function actualizarRequisitoPassword(elementId, cumple) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        const icono = elemento.querySelector('i');
        if (cumple) {
            icono.className = 'bi bi-check-circle-fill text-success';
            elemento.classList.add('requirement-met');
            elemento.classList.remove('requirement-not-met');
        } else {
            icono.className = 'bi bi-x-circle text-danger';
            elemento.classList.add('requirement-not-met');
            elemento.classList.remove('requirement-met');
        }
    }
}

function validarConfirmarPassword(campoConfirmar, campoPassword) {
    if (campoConfirmar.value !== campoPassword.value) {
        marcarInvalido(campoConfirmar, 'Las contraseñas no coinciden');
        return false;
    } else {
        marcarValido(campoConfirmar);
        return true;
    }
}

function validarSelect(campo, mensaje) {
    if (campo.value === '') {
        marcarInvalido(campo, mensaje);
        return false;
    } else {
        marcarValido(campo);
        return true;
    }
}

function marcarInvalido(campo, mensaje) {
    campo.classList.add('is-invalid');
    campo.classList.remove('is-valid');
    
    const feedback = campo.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = mensaje;
    }
}

function marcarValido(campo) {
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
}

function validarFormularioRegistro() {
    const nombre = document.getElementById('nombre');
    const apellido = document.getElementById('apellido');
    const email = document.getElementById('email');
    const cuit = document.getElementById('cuit');
    const password = document.getElementById('password');
    const confirmarPassword = document.getElementById('confirmarPassword');
    
    const validaciones = [
        validarCampoTexto(nombre, 'El nombre es obligatorio'),
        validarCampoTexto(apellido, 'El apellido es obligatorio'),
        validarEmail(email),
        validarCUIT(cuit),
        validarPassword(password),
        validarConfirmarPassword(confirmarPassword, password)
    ];
    
    return validaciones.every(val => val === true);
}

function validarFormularioIncidente() {
    const titulo = document.getElementById('titulo');
    const categoria = document.getElementById('categoria');
    const prioridad = document.getElementById('prioridad');
    const descripcion = document.getElementById('descripcion');
    
    const validaciones = [
        validarCampoTexto(titulo, 'El título es obligatorio'),
        validarSelect(categoria, 'Debe seleccionar una categoría'),
        validarSelect(prioridad, 'Debe seleccionar una prioridad'),
        validarCampoTexto(descripcion, 'La descripción es obligatoria')
    ];
    
    return validaciones.every(val => val === true);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('bi-eye');
        eyeIcon.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('bi-eye-slash');
        eyeIcon.classList.add('bi-eye');
    }
}

async function enviarFormularioRegistro(form) {
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        cuit: document.getElementById('cuit').value,
        password: document.getElementById('password').value
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            window.location.href = 'login.html';
        } else {
            mostrarErrorGeneral(data.message || 'Error al registrar el usuario');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarErrorGeneral('Error de conexión con el servidor');
    }
}

async function enviarFormularioIncidente(form) {
    const formData = {
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value,
        prioridad: document.getElementById('prioridad').value,
        descripcion: document.getElementById('descripcion').value
    };
    
    const usuario = obtenerUsuarioActivo();
    
    if (!usuario || !usuario.token) {
        alert('Sesión expirada. Por favor inicie sesión nuevamente.');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/incidentes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${usuario.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const alertExito = document.getElementById('alertExito');
            const mensajeExito = document.getElementById('mensajeExito');
            
            if (alertExito && mensajeExito) {
                mensajeExito.textContent = `Incidente creado exitosamente. Número de caso: ${data.incidente.numero_caso}`;
                alertExito.classList.add('show');
                
                form.reset();
                
                setTimeout(() => {
                    window.location.href = 'mis-incidentes.html';
                }, 2000);
            }
        } else {
            mostrarErrorGeneral(data.message || 'Error al crear el incidente');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarErrorGeneral('Error de conexión con el servidor');
    }
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

function mostrarErrorGeneral(mensaje) {
    alert(mensaje);
}