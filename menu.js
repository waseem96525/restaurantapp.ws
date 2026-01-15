const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all menu items
router.get('/', (req, res) => {
  db.all('SELECT * FROM menu_items', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get menu items by category
router.get('/category/:category', (req, res) => {
  db.all('SELECT * FROM menu_items WHERE category = ?', [req.params.category], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add menu item
router.post('/', (req, res) => {
  const { name, category, price, description } = req.body;
  db.run('INSERT INTO menu_items (name, category, price, description) VALUES (?, ?, ?, ?)',
    [name, category, price, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, category, price, description });
    }
  );
});

// Update menu item
router.put('/:id', (req, res) => {
  const { name, category, price, description, available } = req.body;
  db.run('UPDATE menu_items SET name = ?, category = ?, price = ?, description = ?, available = ? WHERE id = ?',
    [name, category, price, description, available, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, name, category, price, description, available });
    }
  );
});

// Delete menu item
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Menu item deleted', id: req.params.id });
  });
});

module.exports = router;
