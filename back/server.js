const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'ranking.db'));

function initDB() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS criteria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        name TEXT NOT NULL,
        score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Banco SQLite inicializado com sucesso');
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function getUserId(req) {
  return req.headers['user-id'];
}

initDB();

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: 'Usuário já existe' });
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Dados obrigatórios' });
  
  db.get('SELECT id FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Credenciais inválidas' });
    
    res.json({ success: true, userId: row.id });
  });
});

app.post('/api/items', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  
  db.run('INSERT INTO items (name, description, user_id) VALUES (?, ?, ?)', [name, description || '', userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

app.get('/api/items', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  db.all('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/items/:id', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  db.get('SELECT * FROM items WHERE id = ? AND user_id = ?', [req.params.id, userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(row);
  });
});

app.patch('/api/items/:id', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  
  db.run('UPDATE items SET name = ?, description = ? WHERE id = ? AND user_id = ?', [name, description || '', req.params.id, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/criteria', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { item_id, name } = req.body;
  if (!name || !item_id) return res.status(400).json({ error: 'Dados obrigatórios' });
  
  db.run('INSERT INTO criteria (item_id, name) VALUES (?, ?)', [item_id, name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT * FROM criteria WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

app.get('/api/items/:id/criteria', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  db.all('SELECT * FROM criteria WHERE item_id = ? ORDER BY created_at', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.patch('/api/criteria/:id', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { score, name } = req.body;
  
  if (score !== undefined) {
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      return res.status(400).json({ error: 'Score deve ser entre 0 e 10' });
    }
    db.run('UPDATE criteria SET score = ? WHERE id = ?', [numScore, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } else if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
    db.run('UPDATE criteria SET name = ? WHERE id = ?', [name.trim(), req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } else {
    res.status(400).json({ error: 'Score ou nome deve ser fornecido' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  db.run('DELETE FROM items WHERE id = ? AND user_id = ?', [req.params.id, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


app.delete('/api/criteria/:id', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });
  
  db.run('DELETE FROM criteria WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});