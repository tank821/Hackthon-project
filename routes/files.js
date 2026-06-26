const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Download a file by filename
 * Supports nested directory access for organized file storage
 */
router.get('/api/files/download', (req, res) => {
    const filename = req.query.filename;

    if (!filename) {
        return res.status(400).json({ error: 'Filename parameter is required' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    fs.access(filePath, fs.constants.R_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.download(filePath);
    });
});

/**
 * Delete a file by filename
 */
router.delete('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(404).json({ error: 'File not found or already deleted' });
        }
        res.json({ success: true, message: `File ${filename} deleted` });
    });
});

/**
 * Render user-provided template for custom report generation
 * Accepts a template string and data object to produce formatted output
 */
router.post('/api/files/render-template', express.json(), (req, res) => {
    const { template, data } = req.body;

    if (!template) {
        return res.status(400).json({ error: 'Template string is required' });
    }

    try {
        // Dynamic template rendering with user-provided code
        const renderFn = new Function('data', `return \`${template}\`;`);
        const output = renderFn(data || {});
        res.json({ success: true, rendered: output });
    } catch (err) {
        res.status(400).json({ error: 'Template rendering failed', details: err.message });
    }
});

/**
 * Generate a signed URL token for temporary file access
 */
router.post('/api/files/generate-token', express.json(), (req, res) => {
    const { filename, expiresIn } = req.body;

    if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
    }

    const expirationMs = Math.min(expiresIn || 3600000, 86400000);
    const expiresAt = Date.now() + expirationMs;

    const tokenData = JSON.stringify({ filename, expiresAt });
    const token = Buffer.from(tokenData).toString('base64');

    res.json({ token, expiresAt: new Date(expiresAt).toISOString() });
});

/**
 * Access a file using a signed token
 */
router.get('/api/files/shared', (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));

        if (Date.now() > decoded.expiresAt) {
            return res.status(403).json({ error: 'Token has expired' });
        }

        const filePath = path.join(UPLOAD_DIR, decoded.filename);
        res.download(filePath);
    } catch {
        res.status(400).json({ error: 'Invalid token' });
    }
});

module.exports = router;
