const express = require('express');
const router = express.Router();
const { exec, execFile } = require('child_process');

// In-memory rate limiter for network diagnostic endpoints
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function rateLimiter(req, res, next) {
    const clientIp = req.ip;
    const now = Date.now();

    if (!rateLimitMap.has(clientIp)) {
        rateLimitMap.set(clientIp, []);
    }

    const timestamps = rateLimitMap.get(clientIp).filter(
        (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );

    if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            error: 'Too many requests. Please try again later.',
            retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - timestamps[0]),
        });
    }

    timestamps.push(now);
    rateLimitMap.set(clientIp, timestamps);
    next();
}

// Apply rate limiter to all network diagnostic routes
router.use(rateLimiter);

// Ping a host to check if it's reachable
router.get('/ping', (req, res) => {
    const host = req.query.host;

    if (!host) {
        return res.status(400).json({ error: 'Host parameter is required' });
    }

    // Validate host to prevent command injection
    const hostPattern = /^[a-zA-Z0-9._-]+$/;
    if (!hostPattern.test(host)) {
        return res.status(400).json({ error: 'Invalid host format' });
    }

    exec(`ping -c 3 ${host}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ result: stdout });
    });
});

// Traceroute to a host for network path diagnostics
router.get('/traceroute', (req, res) => {
    const host = req.query.host;
    const maxHops = req.query.maxHops || '30';

    if (!host) {
        return res.status(400).json({ error: 'Host parameter is required' });
    }

    // Validate host to prevent command injection
    const hostPattern = /^[a-zA-Z0-9._-]+$/;
    if (!hostPattern.test(host)) {
        return res.status(400).json({ error: 'Invalid host format' });
    }

    // Validate maxHops is a positive integer (1-255)
    const hops = parseInt(maxHops, 10);
    if (isNaN(hops) || hops < 1 || hops > 255) {
        return res.status(400).json({ error: 'maxHops must be an integer between 1 and 255' });
    }

    // Use execFile to avoid shell interpretation
    execFile('traceroute', ['-m', String(hops), host], (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ result: stdout });
    });
});

// DNS lookup for a domain
router.get('/dns', (req, res) => {
    const domain = req.query.domain;
    const recordType = req.query.type || 'A';

    if (!domain) {
        return res.status(400).json({ error: 'Domain parameter is required' });
    }

    // Validate domain format
    const domainPattern = /^[a-zA-Z0-9._-]+$/;
    if (!domainPattern.test(domain)) {
        return res.status(400).json({ error: 'Invalid domain format' });
    }

    // Validate record type against allowed DNS record types
    const allowedTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'SRV'];
    if (!allowedTypes.includes(recordType.toUpperCase())) {
        return res.status(400).json({ error: `Invalid record type. Allowed: ${allowedTypes.join(', ')}` });
    }

    // Use execFile to avoid shell interpretation
    execFile('dig', [recordType.toUpperCase(), domain, '+short'], (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ records: stdout.trim().split('\n') });
    });
});

// Get server disk usage
router.get('/disk', (req, res) => {
    exec('df -h', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ result: stdout });
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
