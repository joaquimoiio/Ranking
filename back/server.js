const express = require('express');
const cors = require('cors');
const pool = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let currentUserId = null;

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  
  try {
    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id', [username, password]);
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Usuário já existe' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Dados obrigatórios' });
  
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
    
    currentUserId = result.rows[0].id;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  
  try {
    const result = await pool.query('INSERT INTO items (name, description, user_id) VALUES ($1, $2, $3) RETURNING *', [name, description || '', currentUserId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    const result = await pool.query('SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC', [currentUserId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1 AND user_id = $2', [req.params.id, currentUserId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/criteria', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { item_id, name } = req.body;
  if (!name || !item_id) return res.status(400).json({ error: 'Dados obrigatórios' });
  
  try {
    const result = await pool.query('INSERT INTO criteria (item_id, name) VALUES ($1, $2) RETURNING *', [item_id, name]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id/criteria', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    const result = await pool.query('SELECT * FROM criteria WHERE item_id = $1 ORDER BY created_at', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/criteria/:id', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  const { score } = req.body;
  const numScore = parseFloat(score);
  
  if (isNaN(numScore) || numScore < 0 || numScore > 10) {
    return res.status(400).json({ error: 'Score deve ser entre 0 e 10' });
  }

  try {
    await pool.query('UPDATE criteria SET score = $1 WHERE id = $2', [numScore, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    await pool.query('DELETE FROM items WHERE id = $1 AND user_id = $2', [req.params.id, currentUserId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/criteria/:id', async (req, res) => {
  if (!currentUserId) return res.status(401).json({ error: 'Não autenticado' });
  
  try {
    await pool.query('DELETE FROM criteria WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});