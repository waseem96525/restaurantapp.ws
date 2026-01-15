const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all orders
router.get('/', (req, res) => {
  const query = `
    SELECT o.*, c.name as customer_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.order_date DESC
  `;
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get order details
router.get('/:id', (req, res) => {
  const query = `
    SELECT o.*, c.name as customer_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `;
  db.get(query, [req.params.id], (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    
    // Get order items
    db.all('SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
      [req.params.id],
      (err, items) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ ...order, items });
      }
    );
  });
});

// Create new order
router.post('/', (req, res) => {
  const { customer_id, items, notes } = req.body;
  
  db.run('INSERT INTO orders (customer_id, notes, status) VALUES (?, ?, ?)',
    [customer_id, notes || '', 'pending'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const orderId = this.lastID;
      let total = 0;
      let itemsAdded = 0;
      
      // Add items to order
      items.forEach(item => {
        db.run('INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.menu_item_id, item.quantity, item.price, item.quantity * item.price],
          (err) => {
            if (!err) {
              total += item.quantity * item.price;
              itemsAdded++;
              
              // Update order total when all items are added
              if (itemsAdded === items.length) {
                db.run('UPDATE orders SET total = ? WHERE id = ?', [total, orderId]);
              }
            }
          }
        );
      });
      
      res.json({ id: orderId, customer_id, items, notes, status: 'pending' });
    }
  );
});

// Update order status
router.put('/:id', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE orders SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: req.params.id, status });
    }
  );
});

// Delete order
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM order_items WHERE order_id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Order deleted', id: req.params.id });
    });
  });
});

module.exports = router;
