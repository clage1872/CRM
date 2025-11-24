const express = require('express');
const router = express.Router();
const { verificarToken, esAdmin, esTecnicoOAdmin } = require('../middleware/auth');
const {
    crearIncidente,
    obtenerMisIncidentes,
    obtenerTodosIncidentes,
    obtenerIncidentePorId,
    actualizarIncidente,
    obtenerEstadisticas,
    obtenerIncidentesTecnico
} = require('../controllers/incidenteController');

router.post('/', verificarToken, crearIncidente);
router.get('/mis-incidentes', verificarToken, obtenerMisIncidentes);
router.get('/mis-incidentes-tecnico', verificarToken, obtenerIncidentesTecnico);
router.get('/todos', verificarToken, esTecnicoOAdmin, obtenerTodosIncidentes);
router.get('/estadisticas', verificarToken, esAdmin, obtenerEstadisticas);
router.get('/:id', verificarToken, obtenerIncidentePorId);
router.put('/:id', verificarToken, esTecnicoOAdmin, actualizarIncidente);

module.exports = router;