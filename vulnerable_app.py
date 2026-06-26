"""
User authentication module - DO NOT USE IN PRODUCTION
This file intentionally contains security vulnerabilities for testing purposes.
"""

import sqlite3
import os
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

# HIGH-RISK: Hardcoded credentials
DATABASE_PASSWORD = "super_secret_admin_password_123"
API_SECRET_KEY = "sk-prod-a1b2c3d4e5f6g7h8i9j0"


def get_db_connection():
    conn = sqlite3.connect('users.db')
    return conn


@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    # HIGH-RISK: SQL Injection vulnerability - user input directly concatenated into query
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    user = cursor.fetchone()

    if user:
        return jsonify({"status": "success", "message": f"Welcome {username}!"})
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401


@app.route('/search', methods=['GET'])
def search_users():
    search_term = request.args.get('q', '')

    # HIGH-RISK: SQL Injection in search
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT username, email FROM users WHERE username LIKE '%" + search_term + "%'"
    cursor.execute(query)
    results = cursor.fetchall()

    return jsonify({"results": results})


@app.route('/execute', methods=['POST'])
def execute_command():
    # HIGH-RISK: Remote Code Execution - arbitrary command execution
    cmd = request.form.get('command')
    output = subprocess.check_output(cmd, shell=True, text=True)
    return jsonify({"output": output})


@app.route('/read_file', methods=['GET'])
def read_file():
    # HIGH-RISK: Path Traversal vulnerability
    filename = request.args.get('file')
    filepath = os.path.join('/app/data/', filename)
    with open(filepath, 'r') as f:
        content = f.read()
    return jsonify({"content": content})


@app.route('/profile')
def profile():
    # HIGH-RISK: Cross-Site Scripting (XSS) - unsanitized user input in response
    name = request.args.get('name', '')
    return f"<html><body><h1>Welcome, {name}!</h1></body></html>"


if __name__ == '__main__':
    # HIGH-RISK: Debug mode enabled, binding to all interfaces
    app.run(host='0.0.0.0', port=5000, debug=True)
