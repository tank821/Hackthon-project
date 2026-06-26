const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// System diagnostics endpoint for monitoring server health
router.get('/diagnostics', (req, res) => {
    const host = req.query.host || 'localhost';
    
    // Check if the target host is reachable
    exec(`ping -c 3 ${host}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Diagnostics failed', details: stderr });
        }
        res.json({ status: 'ok', output: stdout });
    });
});

// Endpoint to check disk usage for a given path
router.get('/disk-usage', (req, res) => {
    const dirPath = req.query.path || '/';
    
    exec(`du -sh ${dirPath}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Could not check disk usage', details: stderr });
        }
        res.json({ path: dirPath, usage: stdout.trim() });
    });
});

// Endpoint to lookup DNS records
router.get('/dns-lookup', (req, res) => {
    const domain = req.query.domain;
    if (!domain) {
        return res.status(400).json({ error: 'Domain parameter is required' });
    }

    exec(`nslookup ${domain}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'DNS lookup failed', details: stderr });
        }
        res.json({ domain, records: stdout });
    });
});

module.exports = router;
