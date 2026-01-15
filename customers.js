const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all customers
router.get('/', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single customer
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(row);
  });
});

// Add customer
router.post('/', (req, res) => {
  const { name, phone, email, address } = req.body;
  db.run('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
    [name, phone || '', email || '', address || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, phone, email, address });
    }
  );
});

// Update customer
router.put('/:id', (req, res) => {
  const { name, phone, email, address } = req.body;
  db.run('UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
    [name, phone, email, address, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, name, phone, email, address });
    }
  );
});

// Delete customer
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Customer deleted', id: req.params.id });
  });
});

module.exports = router;
