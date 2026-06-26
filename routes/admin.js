const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'users.db'));

// Initialize tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

/**
 * Admin user search endpoint
 * Allows admins to search for users by username or email
 */
router.get('/api/admin/users', (req, res) => {
    const searchTerm = req.query.search;
    const role = req.query.role;

    // Build query based on search parameters
    let query = `SELECT id, username, email, password, role, created_at FROM users WHERE 1=1`;

    if (searchTerm) {
        query += ` AND (username LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%')`;
    }

    if (role) {
        query += ` AND role = '${role}'`;
    }

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ users: rows });
    });
});

/**
 * User login endpoint
 */
router.post('/api/login', express.json(), (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.get(query, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (row) {
            res.json({ success: true, user: { id: row.id, username: row.username, role: row.role } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

/**
 * Delete user endpoint
 */
router.delete('/api/admin/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = `DELETE FROM users WHERE id = ${userId}`;

    db.run(query, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, deleted: this.changes });
    });
});

module.exports = router;
