const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Detect environment: Use PostgreSQL if DATABASE_URL is set (Vercel), otherwise SQLite
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');

let db;

if (usePostgres) {
  // PostgreSQL mode (Production/Vercel)
  console.log('📊 Using PostgreSQL database (Production mode)');
  
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  client.connect();

  // Create callback-compatible wrapper
  db = {
    run: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      client.query(sql, params, (err, result) => {
        if (callback) callback(err);
      });
    },
    all: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      client.query(sql, params, (err, result) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result.rows);
        }
      });
    },
    get: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      client.query(sql, params, (err, result) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result.rows[0]);
        }
      });
    },
    serialize: function(callback) {
      callback();
    }
  };

  initializePostgres(client);

} else {
  // SQLite mode (Local development)
  console.log('💾 Using SQLite database (Development mode)');
  
  const DB_PATH = path.join(__dirname, 'restaurant.db');
  
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      initializeDatabase();
    }
  });
}

function initializeDatabase() {
  // SQLite initialization
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        total REAL DEFAULT 0,
        notes TEXT,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        reservation_date DATETIME NOT NULL,
        guest_count INTEGER NOT NULL,
        status TEXT DEFAULT 'confirmed',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        bill_number TEXT UNIQUE,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        payment_status TEXT DEFAULT 'unpaid',
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(id)
      )
    `);

    console.log('Database tables initialized successfully');
  });
}

function initializePostgres(client) {
  // PostgreSQL initialization - create tables if they don't exist
  const queries = [
    `CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      available INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER,
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      total REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      reservation_date TIMESTAMP NOT NULL,
      guest_count INTEGER NOT NULL,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      bill_number TEXT UNIQUE,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_status TEXT DEFAULT 'unpaid',
      payment_method TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )`
  ];

  queries.forEach(query => {
    client.query(query, (err) => {
      if (err) {
        console.log('Table already exists or query error:', err.message);
      }
    });
  });

  console.log('PostgreSQL tables initialized');
}

module.exports = db;
