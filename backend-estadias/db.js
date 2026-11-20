const mysql = require('mysql2');
require('dotenv').config();

// En Railway, se suele proveer MYSQL_URL o las variables DB_* individuales
const pool = process.env.MYSQL_URL
  ? mysql.createPool(process.env.MYSQL_URL)
  : mysql.createPool({
      host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'ZXC_123_judith',
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'estadias_db',
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

pool.getConnection((err, connection) => {
  if (err) {
    console.error('==================================================');
    console.error('ERROR AL CONECTAR A MYSQL:');
    console.error(err.message);
    console.error('==================================================');
  } else {
    console.log('Conexión exitosa a MySQL');
    connection.release();
  }
});

module.exports = pool.promise();
