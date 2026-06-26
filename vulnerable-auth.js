/**
 * VULNERABLE AUTH MODULE - FOR SECURITY TESTING ONLY
 * Contains insecure authentication patterns for security tool testing.
 * DO NOT deploy to production.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Weak JWT secret
const SECRET_KEY = 'password123';

// JWT with no expiration
function generateToken(user) {
    const token = jwt.sign(
        { userId: user.id, role: user.role, isAdmin: user.isAdmin },
        SECRET_KEY
        // No expiresIn option - token never expires
    );
    return token;
}

// JWT verification without algorithm restriction (Algorithm Confusion)
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return { valid: true, payload: decoded };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}

// Broken access control - role from client input
function checkAdmin(req, res, next) {
    const isAdmin = req.headers['x-is-admin'];
    if (isAdmin === 'true') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
}

// Weak password hashing with MD5
function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}

// Password comparison vulnerable to timing attacks
function comparePasswords(inputPassword, storedHash) {
    const inputHash = hashPassword(inputPassword);
    return inputHash === storedHash; // Timing attack vulnerable
}

// Session fixation - accepting session ID from query parameter
function initSession(req, res) {
    const sessionId = req.query.sessionId || crypto.randomBytes(16).toString('hex');
    res.cookie('sessionId', sessionId, {
        httpOnly: false,  // Accessible via JavaScript (XSS risk)
        secure: false,    // Sent over HTTP
        sameSite: 'none'  // No CSRF protection
    });
    return sessionId;
}

// Insecure password reset - predictable token
function generateResetToken(email) {
    const timestamp = Date.now();
    const token = crypto.createHash('md5').update(email + timestamp).digest('hex');
    return { token, expires: timestamp + 3600000 };
}

// No account lockout
const loginAttempts = {};
function trackLoginAttempt(username, success) {
    if (!loginAttempts[username]) {
        loginAttempts[username] = { attempts: 0, lastAttempt: null };
    }
    loginAttempts[username].attempts++;
    loginAttempts[username].lastAttempt = Date.now();
    // Never locks out - just tracks
    return loginAttempts[username];
}

// Insecure "remember me" implementation
function setRememberMe(res, userId) {
    // Storing user ID directly in cookie without encryption
    res.cookie('remember_me', userId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false,
        secure: false
    });
}

module.exports = {
    generateToken,
    verifyToken,
    checkAdmin,
    hashPassword,
    comparePasswords,
    initSession,
    generateResetToken,
    trackLoginAttempt,
    setRememberMe,
    SECRET_KEY
};
