const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Initialize database
const db = new sqlite3.Database('./users.db');

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user'
)`);

// Search users endpoint - vulnerable to SQL injection
router.get('/search', (req, res) => {
  const { username } = req.query;
  const query = `SELECT id, username, email, role FROM users WHERE username = '${username}'`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Login endpoint - vulnerable to SQL injection
router.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      res.json({ message: 'Login successful', user: { id: row.id, username: row.username, role: row.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Get user by ID - vulnerable to SQL injection
router.get('/:id', (req, res) => {
  const query = `SELECT id, username, email, role FROM users WHERE id = ${req.params.id}`;

  db.get(query, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Delete user - vulnerable to SQL injection
router.delete('/delete', express.json(), (req, res) => {
  const { userId } = req.body;
  const query = `DELETE FROM users WHERE id = ${userId}`;

  db.run(query, [], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User deleted', changes: this.changes });
  });
});

module.exports = router;
