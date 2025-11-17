const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1');
        console.log('Conexión a MySQL exitosa');
        return true;
    } catch (error) {
        console.error('Error de conexión a MySQL:', error.message);
        return false;
    }
}

module.exports = { pool: promisePool, testConnection };