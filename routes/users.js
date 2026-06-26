const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Initialize database connection
const db = new sqlite3.Database('./users.db');

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user'
)`);

// Search users by username
router.get('/search', (req, res) => {
    const username = req.query.username;

    // Build query with user input for flexible searching
    const query = `SELECT * FROM users WHERE username = '${username}'`;

    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ users: rows });
    });
});

// Admin endpoint to search users by role
router.get('/admin/search', (req, res) => {
    const role = req.query.role;
    const sort = req.query.sort || 'username';

    // Query users by role with dynamic sorting
    const query = `SELECT * FROM users WHERE role = '${role}' ORDER BY ${sort}`;

    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ users: rows });
    });
});

// Get user by ID
router.get('/:id', (req, res) => {
    const userId = req.params.id;

    // Using parameterized query
    const query = `SELECT * FROM users WHERE id = ?`;

    db.get(query, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: row });
    });
});

module.exports = router;
