const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const customersRoutes = require('./routes/customers');
const billingRoutes = require('./routes/billing');
const reservationsRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'https://*.web.app',
    'https://*.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ]
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reservations', reservationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Restaurant Billing & Management System running on http://localhost:${PORT}`);
});
