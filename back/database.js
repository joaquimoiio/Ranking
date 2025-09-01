const { Pool } = require('pg');

const pool = new Pool({
  user: 'ranking',
  host: 'localhost',
  database: 'ranking',
  password: 'ranking123',
  port: 5432,
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS criteria (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        score NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO users (username, password) VALUES ('admin', 'admin123')
      ON CONFLICT (username) DO NOTHING
    `);
    
    console.log('Banco inicializado');
  } catch (err) {
    console.error('Erro ao inicializar banco:', err);
  }
}

initDB();

module.exports = pool;
