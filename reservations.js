const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all reservations
router.get('/', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone, c.email
    FROM reservations r
    JOIN customers c ON r.customer_id = c.id
    ORDER BY r.reservation_date DESC
  `;
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get reservation
router.get('/:id', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone, c.email
    FROM reservations r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.id = ?
  `;
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    res.json(row);
  });
});

// Create reservation
router.post('/', (req, res) => {
  const { customer_id, reservation_date, guest_count, notes } = req.body;
  db.run('INSERT INTO reservations (customer_id, reservation_date, guest_count, notes) VALUES (?, ?, ?, ?)',
    [customer_id, reservation_date, guest_count, notes || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        customer_id,
        reservation_date,
        guest_count,
        notes,
        status: 'confirmed'
      });
    }
  );
});

// Update reservation
router.put('/:id', (req, res) => {
  const { reservation_date, guest_count, status, notes } = req.body;
  db.run('UPDATE reservations SET reservation_date = ?, guest_count = ?, status = ?, notes = ? WHERE id = ?',
    [reservation_date, guest_count, status, notes, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: req.params.id,
        reservation_date,
        guest_count,
        status,
        notes
      });
    }
  );
});

// Delete reservation
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM reservations WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Reservation deleted', id: req.params.id });
  });
});

module.exports = router;
