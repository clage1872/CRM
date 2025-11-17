const express = require('express');
const router = express.Router();
const { registrarCliente, login, registrarAdministrador } = require('../controllers/authController');
const { verificarToken, esAdmin } = require('../middleware/auth');

router.post('/registro', registrarCliente);
router.post('/login', login);
router.post('/registro-admin', verificarToken, esAdmin, registrarAdministrador);

module.exports = router;