const express = require('express');
const router = express.Router();
const { verificarToken, esAdmin } = require('../middleware/auth');
const {
    crearIncidente,
    obtenerMisIncidentes,
    obtenerTodosIncidentes,
    obtenerIncidentePorId,
    actualizarIncidente,
    obtenerEstadisticas
} = require('../controllers/incidenteController');

router.post('/', verificarToken, crearIncidente);
router.get('/mis-incidentes', verificarToken, obtenerMisIncidentes);
router.get('/todos', verificarToken, esAdmin, obtenerTodosIncidentes);
router.get('/estadisticas', verificarToken, esAdmin, obtenerEstadisticas);
router.get('/:id', verificarToken, obtenerIncidentePorId);
router.put('/:id', verificarToken, esAdmin, actualizarIncidente);

module.exports = router;