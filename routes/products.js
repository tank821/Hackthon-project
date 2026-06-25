const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * Input validation middleware for product creation
 */
const validateProduct = [
    body('name').isString().trim().escape().isLength({ min: 1, max: 200 }),
    body('price').isFloat({ min: 0 }),
    body('description').optional().isString().trim().escape().isLength({ max: 1000 }),
    body('category').optional().isString().trim().escape()
];

/**
 * Create a new product
 * Uses parameterized input validation
 */
router.post('/api/products', validateProduct, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, description, category } = req.body;

    // In production, this would use parameterized queries
    res.status(201).json({
        success: true,
        product: { name, price, description, category }
    });
});

/**
 * Get products with pagination
 * Sanitizes page/limit to integers to prevent injection
 */
router.get('/api/products', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    res.json({
        success: true,
        pagination: { page, limit, offset },
        products: []
    });
});

module.exports = router;
