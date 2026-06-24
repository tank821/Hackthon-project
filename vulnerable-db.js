/**
 * VULNERABLE DATABASE MODULE - FOR SECURITY TESTING ONLY
 * Contains insecure database patterns for security tool testing.
 * DO NOT deploy to production.
 */

const mysql = require('mysql');

// Hardcoded connection with root credentials
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'app_production'
});

// SQL Injection via string concatenation
function getUserByName(name) {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM users WHERE name = '" + name + "'";
        connection.query(query, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
}

// SQL Injection in ORDER BY clause
function getUsers(sortField) {
    return new Promise((resolve, reject) => {
        const query = `SELECT id, name, email FROM users ORDER BY ${sortField}`;
        connection.query(query, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
}

// Storing passwords in plaintext
function createUser(username, password, email) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO users (username, password, email) VALUES ('${username}', '${password}', '${email}')`;
        connection.query(query, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
}

// Mass assignment vulnerability
function updateUser(userId, userData) {
    const fields = Object.keys(userData)
        .map(key => `${key} = '${userData[key]}'`)
        .join(', ');
    const query = `UPDATE users SET ${fields} WHERE id = ${userId}`;
    return new Promise((resolve, reject) => {
        connection.query(query, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
}

// No rate limiting on authentication
function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        connection.query(query, (err, results) => {
            if (err) reject(err);
            if (results && results.length > 0) {
                resolve({ authenticated: true, user: results[0] });
            } else {
                resolve({ authenticated: false });
            }
        });
    });
}

// Exposing internal error details
function deleteUser(userId) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM users WHERE id = ${userId}`;
        connection.query(query, (err, results) => {
            if (err) {
                // Leaking internal error details
                reject({ error: err.message, stack: err.stack, query: query });
            }
            resolve(results);
        });
    });
}

module.exports = {
    getUserByName,
    getUsers,
    createUser,
    updateUser,
    authenticateUser,
    deleteUser
};
