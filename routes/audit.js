const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_LOG_FILE = path.join(LOG_DIR, 'audit.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Audit logging middleware
 * Records admin actions with timestamp, user, and action details
 */
function auditLogger(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            ip: req.ip,
        };

        const logLine = JSON.stringify(logEntry) + '\n';

        fs.appendFile(AUDIT_LOG_FILE, logLine, (err) => {
            if (err) {
                console.error('Failed to write audit log:', err.message);
            }
        });
    });

    next();
}

/**
 * GET /api/audit/logs
 * Returns recent audit log entries (last 100)
 */
router.get('/api/audit/logs', (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    fs.readFile(AUDIT_LOG_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json({ logs: [] });
            }
            return res.status(500).json({ error: 'Unable to read audit logs' });
        }

        const lines = data.trim().split('\n').filter(Boolean);
        const recentLogs = lines.slice(-limit).reverse().map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);

        res.json({ logs: recentLogs });
    });
});

/**
 * GET /api/audit/stats
 * Returns summary statistics of recent requests
 */
router.get('/api/audit/stats', (req, res) => {
    fs.readFile(AUDIT_LOG_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json({ totalRequests: 0, avgDurationMs: 0, statusCodes: {} });
            }
            return res.status(500).json({ error: 'Unable to read audit logs' });
        }

        const lines = data.trim().split('\n').filter(Boolean);
        const entries = lines.map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);

        const totalRequests = entries.length;
        const avgDurationMs = totalRequests > 0
            ? Math.round(entries.reduce((sum, e) => sum + (e.durationMs || 0), 0) / totalRequests)
            : 0;

        const statusCodes = {};
        for (const entry of entries) {
            const code = String(entry.statusCode || 'unknown');
            statusCodes[code] = (statusCodes[code] || 0) + 1;
        }

        res.json({ totalRequests, avgDurationMs, statusCodes });
    });
});

module.exports = { router, auditLogger };
