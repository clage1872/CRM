const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token no proporcionado' 
        });
    }
    
    const tokenLimpio = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    try {
        const decoded = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido o expirado' 
        });
    }
}

function esAdmin(req, res, next) {
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Se requieren permisos de administrador.' 
        });
    }
    next();
}

module.exports = { verificarToken, esAdmin };