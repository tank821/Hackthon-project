/**
 * VULNERABLE ROUTES - FOR SECURITY TESTING ONLY
 * This file contains intentionally vulnerable code patterns
 * to test security scanning tools and processes.
 * DO NOT deploy to production.
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Hardcoded credentials (CWE-798)
const DB_CONFIG = {
    host: 'prod-db.internal.company.com',
    user: 'admin',
    password: 'SuperSecret123!',
    database: 'users_prod'
};

const API_KEY = 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234';
const JWT_SECRET = 'my-super-secret-jwt-key-do-not-share';

// Command Injection (CWE-78)
router.get('/ping', (req, res) => {
    const host = req.query.host;
    exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(stderr);
        }
        res.send(stdout);
    });
});

// SQL Injection (CWE-89)
router.get('/user', (req, res) => {
    const userId = req.query.id;
    const query = `SELECT * FROM users WHERE id = '${userId}'`;
    // Simulated DB query with string concatenation
    res.json({ query: query, message: "User lookup executed" });
});

// SQL Injection in login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    res.json({ query: query, authenticated: true });
});

// Path Traversal (CWE-22)
router.get('/file', (req, res) => {
    const filename = req.query.name;
    const filePath = '/var/data/' + filename;
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('File not found');
        }
        res.send(data);
    });
});

// Cross-Site Scripting - Reflected XSS (CWE-79)
router.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    res.send(`<html><body><h1>Search Results for: ${searchTerm}</h1></body></html>`);
});

// Server-Side Request Forgery - SSRF (CWE-918)
const axios = require('axios');
router.get('/fetch', async (req, res) => {
    const url = req.query.url;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching URL');
    }
});

// Insecure Deserialization (CWE-502)
router.post('/deserialize', (req, res) => {
    const serializedData = req.body.data;
    try {
        const obj = eval('(' + serializedData + ')');
        res.json({ result: obj });
    } catch (e) {
        res.status(400).send('Invalid data');
    }
});

// Weak Cryptography (CWE-327)
router.post('/hash-password', (req, res) => {
    const password = req.body.password;
    const hash = crypto.createHash('md5').update(password).digest('hex');
    res.json({ hash: hash });
});

// Information Exposure (CWE-200)
router.get('/debug', (req, res) => {
    res.json({
        env: process.env,
        config: DB_CONFIG,
        apiKey: API_KEY,
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
    });
});

// Insecure Direct Object Reference (CWE-639)
router.get('/account/:id', (req, res) => {
    // No authorization check - any user can access any account
    const accountId = req.params.id;
    res.json({
        id: accountId,
        balance: 50000,
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111'
    });
});

// Prototype Pollution (CWE-1321)
router.post('/config', (req, res) => {
    const baseConfig = {};
    const userConfig = req.body;
    
    function merge(target, source) {
        for (let key in source) {
            if (typeof source[key] === 'object') {
                target[key] = merge(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    
    const merged = merge(baseConfig, userConfig);
    res.json({ config: merged });
});

// Open Redirect (CWE-601)
router.get('/redirect', (req, res) => {
    const url = req.query.url;
    res.redirect(url);
});

// XML External Entity (XXE) Processing - simulated
router.post('/parse-xml', (req, res) => {
    const xmlData = req.body.xml;
    // Unsafe XML parsing allowing external entities
    res.json({ parsed: xmlData, message: "XML processed without sanitization" });
});

// Unrestricted File Upload (CWE-434)
const multer = require('multer');
const unsafeUpload = multer({ dest: '/tmp/uploads/' });
router.post('/upload-file', unsafeUpload.single('file'), (req, res) => {
    // No file type validation, no size limit enforced
    const file = req.file;
    const newPath = path.join('/var/www/public/', file.originalname);
    fs.rename(file.path, newPath, (err) => {
        if (err) return res.status(500).send('Upload failed');
        res.json({ message: 'File uploaded', path: newPath });
    });
});

// Race Condition in balance transfer (CWE-362)
let accountBalance = 1000;
router.post('/transfer', (req, res) => {
    const amount = parseInt(req.body.amount);
    // No locking mechanism - vulnerable to race conditions
    if (accountBalance >= amount) {
        setTimeout(() => {
            accountBalance -= amount;
            res.json({ success: true, remaining: accountBalance });
        }, 100);
    } else {
        res.status(400).json({ error: 'Insufficient funds' });
    }
});

// Logging sensitive data (CWE-532)
router.post('/process-payment', (req, res) => {
    const { cardNumber, cvv, expiry, amount } = req.body;
    console.log(`Payment processing: card=${cardNumber}, cvv=${cvv}, expiry=${expiry}, amount=${amount}`);
    res.json({ status: 'processed', transactionId: Date.now() });
});

module.exports = router;
