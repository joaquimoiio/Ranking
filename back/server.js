const express = require('express');
const cors = require('cors');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota para criar um item
app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  
  db.run(
    'INSERT INTO items (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

// Rota para listar todos os itens
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Rota para buscar um item específico
app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    res.json(row);
  });
});

// Rota para criar um critério
app.post('/api/criteria', (req, res) => {
  const { item_id, name } = req.body;
  
  db.run(
    'INSERT INTO criteria (item_id, name) VALUES (?, ?)',
    [item_id, name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM criteria WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

// Rota para listar critérios de um item
app.get('/api/items/:id/criteria', (req, res) => {
  const { id } = req.params;
  
  db.all(
    'SELECT * FROM criteria WHERE item_id = ? ORDER BY created_at',
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});