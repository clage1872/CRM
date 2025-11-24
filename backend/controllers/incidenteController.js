const { pool } = require('../config/db');

async function crearIncidente(req, res) {
    const { titulo, descripcion, categoria, prioridad } = req.body;
    const clienteId = req.usuario.id;
    
    if (!titulo || !descripcion || !categoria || !prioridad) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son obligatorios' 
        });
    }
    
    const categoriasValidas = ['Técnico', 'Facturación', 'Consulta General', 'Reclamo'];
    if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Categoría inválida' 
        });
    }
    
    const prioridadesValidas = ['Baja', 'Media', 'Alta', 'Crítica'];
    if (!prioridadesValidas.includes(prioridad)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Prioridad inválida' 
        });
    }
    
    try {
        const [estadoPendiente] = await pool.query(
            'SELECT id FROM estados WHERE codigo = ?',
            ['PENDIENTE']
        );
        
        if (estadoPendiente.length === 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error: Estado pendiente no encontrado en el sistema' 
            });
        }
        
        const [ultimoNumero] = await pool.query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(numero_caso, 5) AS UNSIGNED)), 0) + 1 AS siguiente FROM incidentes WHERE numero_caso LIKE 'INC-%'"
        );
        
        const numeroSecuencial = ultimoNumero[0].siguiente;
        const numeroCaso = `INC-${String(numeroSecuencial).padStart(6, '0')}`;
        
        const [resultado] = await pool.query(
            'INSERT INTO incidentes (numero_caso, titulo, descripcion, categoria, prioridad, estado_id, cliente_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [numeroCaso, titulo, descripcion, categoria, prioridad, estadoPendiente[0].id, clienteId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Incidente creado exitosamente',
            incidente: {
                id: resultado.insertId,
                numero_caso: numeroCaso,
                titulo,
                categoria,
                prioridad,
                estado: 'Pendiente'
            }
        });
        
    } catch (error) {
        console.error('Error al crear incidente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear el incidente' 
        });
    }
}

async function obtenerMisIncidentes(req, res) {
    const clienteId = req.usuario.id;
    
    try {
        const [incidentes] = await pool.query(
            `SELECT 
                i.id,
                i.numero_caso,
                i.titulo,
                i.descripcion,
                i.categoria,
                i.prioridad,
                e.nombre AS estado,
                e.codigo AS estado_codigo,
                i.fecha_apertura,
                i.fecha_cierre,
                CONCAT(a.nombre, ' ', a.apellido) AS responsable
            FROM incidentes i
            INNER JOIN estados e ON i.estado_id = e.id
            LEFT JOIN administradores a ON i.responsable_id = a.id
            WHERE i.cliente_id = ?
            ORDER BY i.fecha_apertura DESC`,
            [clienteId]
        );
        
        res.json({
            success: true,
            incidentes
        });
        
    } catch (error) {
        console.error('Error al obtener incidentes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener los incidentes' 
        });
    }
}

async function obtenerTodosIncidentes(req, res) {
    try {
        const [incidentes] = await pool.query(
            `SELECT 
                i.id,
                i.numero_caso,
                i.titulo,
                i.descripcion,
                i.categoria,
                i.prioridad,
                e.nombre AS estado,
                e.codigo AS estado_codigo,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.email AS cliente_email,
                c.cuit AS cliente_cuit,
                CONCAT(a.nombre, ' ', a.apellido) AS responsable,
                i.fecha_apertura,
                i.fecha_cierre
            FROM incidentes i
            INNER JOIN estados e ON i.estado_id = e.id
            INNER JOIN clientes c ON i.cliente_id = c.id
            LEFT JOIN administradores a ON i.responsable_id = a.id
            ORDER BY i.fecha_apertura DESC`
        );
        
        res.json({
            success: true,
            incidentes
        });
        
    } catch (error) {
        console.error('Error al obtener todos los incidentes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener los incidentes' 
        });
    }
}

async function obtenerIncidentePorId(req, res) {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const usuarioTipo = req.usuario.tipo;
    
    try {
        const [incidentes] = await pool.query(
            `SELECT 
                i.id,
                i.numero_caso,
                i.titulo,
                i.descripcion,
                i.categoria,
                i.prioridad,
                e.nombre AS estado,
                e.codigo AS estado_codigo,
                i.cliente_id,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.email AS cliente_email,
                c.cuit AS cliente_cuit,
                CONCAT(a.nombre, ' ', a.apellido) AS responsable,
                i.fecha_apertura,
                i.fecha_cierre
            FROM incidentes i
            INNER JOIN estados e ON i.estado_id = e.id
            INNER JOIN clientes c ON i.cliente_id = c.id
            LEFT JOIN administradores a ON i.responsable_id = a.id
            WHERE i.id = ?`,
            [id]
        );
        
        if (incidentes.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Incidente no encontrado' 
            });
        }
        
        const incidente = incidentes[0];
        
        if (usuarioTipo === 'cliente' && incidente.cliente_id !== usuarioId) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tiene permisos para ver este incidente' 
            });
        }
        
        res.json({
            success: true,
            incidente
        });
        
    } catch (error) {
        console.error('Error al obtener incidente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener el incidente' 
        });
    }
}

async function actualizarIncidente(req, res) {
    const { id } = req.params;
    const { estado, responsable_id, comentario } = req.body;
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;
    
    try {
        const [incidente] = await pool.query('SELECT * FROM incidentes WHERE id = ?', [id]);
        
        if (incidente.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Incidente no encontrado' 
            });
        }
        
        // solo admin puede marcar como "Resuelto"
        if (estado === 'Resuelto' && usuarioRol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo los administradores pueden resolver incidentes' 
            });
        }
        
        let updates = [];
        let values = [];
        
        if (estado) {
            const [estadoDb] = await pool.query('SELECT id FROM estados WHERE nombre = ?', [estado]);
            
            if (estadoDb.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Estado inválido' 
                });
            }
            
            updates.push('estado_id = ?');
            values.push(estadoDb[0].id);
            
            if (estado === 'Cerrado') {
                updates.push('fecha_cierre = NOW()');
            }
        }
        
        if (responsable_id !== undefined && usuarioRol === 'admin') {
            updates.push('responsable_id = ?');
            values.push(responsable_id || null);
        }
        
        if (updates.length > 0) {
            values.push(id);
            const query = `UPDATE incidentes SET ${updates.join(', ')} WHERE id = ?`;
            await pool.query(query, values);
        }
        
        if (comentario) {
            const tipoUsuario = usuarioRol === 'admin' ? 'administrador' : 'administrador';
            await pool.query(
                'INSERT INTO comentarios (incidente_id, usuario_id, tipo_usuario, comentario) VALUES (?, ?, ?, ?)',
                [id, usuarioId, tipoUsuario, comentario]
            );
        }
        
        res.json({
            success: true,
            message: 'Incidente actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar incidente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar el incidente' 
        });
    }
}

async function obtenerEstadisticas(req, res) {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_incidentes,
                COUNT(DISTINCT cliente_id) AS total_clientes,
                SUM(CASE WHEN e.codigo = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
                SUM(CASE WHEN e.codigo = 'EN_PROGRESO' THEN 1 ELSE 0 END) AS en_progreso,
                SUM(CASE WHEN e.codigo = 'EN_ESPERA' THEN 1 ELSE 0 END) AS en_espera,
                SUM(CASE WHEN e.codigo = 'RESUELTO' THEN 1 ELSE 0 END) AS resueltos,
                SUM(CASE WHEN e.codigo = 'CERRADO' THEN 1 ELSE 0 END) AS cerrados,
                SUM(CASE WHEN prioridad = 'Crítica' THEN 1 ELSE 0 END) AS criticos,
                SUM(CASE WHEN categoria = 'Técnico' THEN 1 ELSE 0 END) AS cat_tecnico,
                SUM(CASE WHEN categoria = 'Facturación' THEN 1 ELSE 0 END) AS cat_facturacion,
                SUM(CASE WHEN categoria = 'Consulta General' THEN 1 ELSE 0 END) AS cat_consulta,
                SUM(CASE WHEN categoria = 'Reclamo' THEN 1 ELSE 0 END) AS cat_reclamo
            FROM incidentes i
            INNER JOIN estados e ON i.estado_id = e.id
        `);
        
        res.json({
            success: true,
            estadisticas: stats[0]
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener estadísticas' 
        });
    }
}

async function obtenerIncidentesTecnico(req, res) {
    const tecnicoId = req.usuario.id;
    
    try {
        const [incidentes] = await pool.query(
            `SELECT 
                i.id,
                i.numero_caso,
                i.titulo,
                i.descripcion,
                i.categoria,
                i.prioridad,
                e.nombre AS estado,
                e.codigo AS estado_codigo,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
                c.email AS cliente_email,
                c.cuit AS cliente_cuit,
                i.fecha_apertura,
                i.fecha_cierre
            FROM incidentes i
            INNER JOIN estados e ON i.estado_id = e.id
            INNER JOIN clientes c ON i.cliente_id = c.id
            WHERE i.responsable_id = ?
            ORDER BY i.fecha_apertura DESC`,
            [tecnicoId]
        );
        
        res.json({
            success: true,
            incidentes
        });
        
    } catch (error) {
        console.error('Error al obtener incidentes del técnico:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener los incidentes' 
        });
    }
}

module.exports = {
    crearIncidente,
    obtenerMisIncidentes,
    obtenerTodosIncidentes,
    obtenerIncidentePorId,
    actualizarIncidente,
    obtenerEstadisticas,
    obtenerIncidentesTecnico
};