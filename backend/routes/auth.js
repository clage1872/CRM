const express = require('express');
const router = express.Router();
const { 
    registrarCliente, 
    login, 
    registrarAdministrador, 
    obtenerUsuariosParaAsignar,
    obtenerClientes,
    asignarRolACliente
} = require('../controllers/authController');
const { verificarToken, esAdmin } = require('../middleware/auth');

router.post('/registro', registrarCliente);
router.post('/login', login);
router.post('/registro-admin', verificarToken, esAdmin, registrarAdministrador);
router.get('/usuarios', verificarToken, esAdmin, obtenerUsuariosParaAsignar);
router.get('/clientes', verificarToken, esAdmin, obtenerClientes);
router.post('/asignar-rol', verificarToken, esAdmin, asignarRolACliente);

module.exports = router;