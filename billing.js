const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Generate bill from order
router.post('/', (req, res) => {
  const { order_id, tax_rate = 10, discount = 0, payment_method } = req.body;
  
  db.get('SELECT * FROM orders WHERE id = ?', [order_id], (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    
    const subtotal = order.total;
    const tax = (subtotal * tax_rate) / 100;
    const total = subtotal + tax - discount;
    const billNumber = `BILL-${Date.now()}`;
    
    db.run('INSERT INTO bills (order_id, bill_number, subtotal, tax, discount, total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order_id, billNumber, subtotal, tax, discount, total, payment_method || 'cash'],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({
          id: this.lastID,
          bill_number: billNumber,
          order_id,
          subtotal,
          tax,
          discount,
          total,
          payment_status: 'unpaid'
        });
      }
    );
  });
});

// Get bill
router.get('/:id', (req, res) => {
  const query = `
    SELECT b.*, o.customer_id, c.name as customer_name, c.phone, c.email
    FROM bills b
    JOIN orders o ON b.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE b.id = ?
  `;
  
  db.get(query, [req.params.id], (err, bill) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    
    // Get order items
    db.all('SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
      [bill.order_id],
      (err, items) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ ...bill, items });
      }
    );
  });
});

// Get all bills
router.get('/', (req, res) => {
  const query = `
    SELECT b.*, o.customer_id, c.name as customer_name
    FROM bills b
    JOIN orders o ON b.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY b.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Mark bill as paid
router.put('/:id/payment', (req, res) => {
  const { payment_method } = req.body;
  db.run('UPDATE bills SET payment_status = ?, payment_method = ? WHERE id = ?',
    ['paid', payment_method || 'cash', req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, payment_status: 'paid' });
    }
  );
});

module.exports = router;
