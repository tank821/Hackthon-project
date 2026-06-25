const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Version endpoint
router.get('/version', (req, res) => {
    const packageJson = require('../package.json');
    res.json({
        name: packageJson.name,
        version: packageJson.version
    });
});

module.exports = router;
