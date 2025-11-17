const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function registrarCliente(req, res) {
    const { nombre, apellido, email, cuit, password } = req.body;
    
    if (!nombre || !apellido || !email || !cuit || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son obligatorios' 
        });
    }
    
    const cuitRegex = /^\d{11}$/;
    if (!cuitRegex.test(cuit)) {
        return res.status(400).json({ 
            success: false, 
            message: 'El CUIT debe tener 11 dígitos numéricos' 
        });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email inválido' 
        });
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            success: false, 
            message: 'La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales' 
        });
    }
    
    try {
        const [existente] = await pool.query(
            'SELECT id FROM clientes WHERE email = ? OR cuit = ?',
            [email, cuit]
        );
        
        if (existente.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'El email o CUIT ya están registrados' 
            });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const [resultado] = await pool.query(
            'INSERT INTO clientes (nombre, apellido, email, cuit, password) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, email, cuit, passwordHash]
        );
        
        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            clienteId: resultado.insertId
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar el cliente' 
        });
    }
}

async function login(req, res) {
    const { cuit, password } = req.body;
    
    if (!cuit || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'CUIT y contraseña son obligatorios' 
        });
    }
    
    try {
        const [clientes] = await pool.query(
            'SELECT id, nombre, apellido, email, cuit, password, activo FROM clientes WHERE cuit = ?',
            [cuit]
        );
        
        if (clientes.length > 0) {
            const cliente = clientes[0];
            
            if (!cliente.activo) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Usuario inactivo. Contacte al administrador.' 
                });
            }
            
            const passwordValido = await bcrypt.compare(password, cliente.password);
            
            if (!passwordValido) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'CUIT o contraseña incorrectos' 
                });
            }
            
            const token = jwt.sign(
                { 
                    id: cliente.id, 
                    cuit: cliente.cuit, 
                    rol: 'cliente',
                    tipo: 'cliente'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            return res.json({
                success: true,
                message: 'Login exitoso',
                token,
                usuario: {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    email: cliente.email,
                    cuit: cliente.cuit,
                    rol: 'cliente'
                }
            });
        }
        
        const [admins] = await pool.query(
            'SELECT id, nombre, apellido, email, cuit, password, rol, activo FROM administradores WHERE cuit = ?',
            [cuit]
        );
        
        if (admins.length > 0) {
            const admin = admins[0];
            
            if (!admin.activo) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Usuario inactivo. Contacte al administrador.' 
                });
            }
            
            const passwordValido = await bcrypt.compare(password, admin.password);
            
            if (!passwordValido) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'CUIT o contraseña incorrectos' 
                });
            }
            
            const token = jwt.sign(
                { 
                    id: admin.id, 
                    cuit: admin.cuit, 
                    rol: admin.rol,
                    tipo: 'administrador'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            return res.json({
                success: true,
                message: 'Login exitoso',
                token,
                usuario: {
                    id: admin.id,
                    nombre: admin.nombre,
                    apellido: admin.apellido,
                    email: admin.email,
                    cuit: admin.cuit,
                    rol: admin.rol
                }
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            message: 'CUIT o contraseña incorrectos' 
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al procesar el login' 
        });
    }
}

async function registrarAdministrador(req, res) {
    const { nombre, apellido, email, cuit, password, rol } = req.body;
    
    if (!nombre || !apellido || !email || !cuit || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son obligatorios' 
        });
    }
    
    const cuitRegex = /^\d{11}$/;
    if (!cuitRegex.test(cuit)) {
        return res.status(400).json({ 
            success: false, 
            message: 'El CUIT debe tener 11 dígitos numéricos' 
        });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email inválido' 
        });
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            success: false, 
            message: 'La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales' 
        });
    }
    
    try {
        const [existente] = await pool.query(
            'SELECT id FROM administradores WHERE email = ? OR cuit = ?',
            [email, cuit]
        );
        
        if (existente.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'El email o CUIT ya están registrados' 
            });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const rolFinal = rol || 'admin';
        
        const [resultado] = await pool.query(
            'INSERT INTO administradores (nombre, apellido, email, cuit, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, cuit, passwordHash, rolFinal]
        );
        
        res.status(201).json({
            success: true,
            message: 'Administrador registrado exitosamente',
            adminId: resultado.insertId
        });
        
    } catch (error) {
        console.error('Error en registro de admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar el administrador' 
        });
    }
}

module.exports = { registrarCliente, login, registrarAdministrador };