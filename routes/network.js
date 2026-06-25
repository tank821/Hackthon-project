const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

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

// Get server disk usage
router.get('/disk', (req, res) => {
    exec('df -h', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ result: stdout });
    });
});

module.exports = router;
