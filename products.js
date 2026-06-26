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

// Search products - uses parameterized queries
router.get('/search', (req, res) => {
  const { name, category } = req.query;
  const query = `SELECT * FROM products WHERE name LIKE ? AND category = ?`;

  db.all(query, [`%${name}%`, category], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get product by ID - uses parameterized query
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const query = `SELECT * FROM products WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
});

// Add product - uses parameterized query with input validation
router.post('/add', express.json(), (req, res) => {
  const { name, description, price, category, stock } = req.body;

  if (!name || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Invalid input: name and valid price are required' });
  }

  const query = `INSERT INTO products (name, description, price, category, stock) VALUES (?, ?, ?, ?, ?)`;

  db.run(query, [name, description || '', price, category || 'uncategorized', stock || 0], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Product added', id: this.lastID });
  });
});

// Update product price - uses parameterized query with validation
router.put('/update-price', express.json(), (req, res) => {
  const { productId, newPrice } = req.body;

  if (!Number.isInteger(productId) || typeof newPrice !== 'number' || newPrice < 0) {
    return res.status(400).json({ error: 'Invalid input: valid productId and newPrice are required' });
  }

  const query = `UPDATE products SET price = ? WHERE id = ?`;

  db.run(query, [newPrice, productId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Price updated', changes: this.changes });
  });
});

// Filter products by price range - uses parameterized query with whitelist for sort
router.get('/filter/price', (req, res) => {
  const min = parseFloat(req.query.min);
  const max = parseFloat(req.query.max);
  const sortDirection = req.query.sort === 'DESC' ? 'DESC' : 'ASC';

  if (isNaN(min) || isNaN(max) || min < 0 || max < min) {
    return res.status(400).json({ error: 'Invalid price range' });
  }

  const query = `SELECT * FROM products WHERE price BETWEEN ? AND ? ORDER BY price ${sortDirection}`;

  db.all(query, [min, max], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;
