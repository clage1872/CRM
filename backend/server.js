const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth');
const incidentesRoutes = require('./routes/incidentes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/incidentes', incidentesRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'API Sistema CRM - Gestión de Incidentes',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            incidentes: '/api/incidentes'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint no encontrado' 
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

async function iniciarServidor() {
    const conexionOk = await testConnection();
    
    if (!conexionOk) {
        console.error('No se pudo conectar a la base de datos. Verifica tu configuración.');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log(`API disponible en http://localhost:${PORT}/api`);
    });
}

iniciarServidor();