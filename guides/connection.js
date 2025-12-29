const mysql = require("mysql2/promise");
const { getDbConfig } = require("./secrets");

let pool;

async function initPool() {
  if (!pool) {
    const dbConfig = await getDbConfig();

    pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.dbname,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

async function getConnection() {
  const pool = await initPool();
  const connection = await pool.getConnection();
  return connection;
}

module.exports = { getConnection };
