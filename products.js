const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Initialize database
const db = new sqlite3.Database('./products.db');

// Create products table if not exists
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0
)`);

// Search products - vulnerable to SQL injection
router.get('/search', (req, res) => {
  const { name, category } = req.query;
  const query = `SELECT * FROM products WHERE name LIKE '%${name}%' AND category = '${category}'`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get product by ID - vulnerable to SQL injection
router.get('/:id', (req, res) => {
  const query = `SELECT * FROM products WHERE id = ${req.params.id}`;

  db.get(query, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
});

// Add product - vulnerable to SQL injection
router.post('/add', express.json(), (req, res) => {
  const { name, description, price, category, stock } = req.body;
  const query = `INSERT INTO products (name, description, price, category, stock) VALUES ('${name}', '${description}', ${price}, '${category}', ${stock})`;

  db.run(query, [], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Product added', id: this.lastID });
  });
});

// Update product price - vulnerable to SQL injection
router.put('/update-price', express.json(), (req, res) => {
  const { productId, newPrice } = req.body;
  const query = `UPDATE products SET price = ${newPrice} WHERE id = ${productId}`;

  db.run(query, [], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Price updated', changes: this.changes });
  });
});

// Filter products by price range - vulnerable to SQL injection
router.get('/filter/price', (req, res) => {
  const { min, max, sort } = req.query;
  const query = `SELECT * FROM products WHERE price BETWEEN ${min} AND ${max} ORDER BY price ${sort}`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
