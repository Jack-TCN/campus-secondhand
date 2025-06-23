const db = require('../config/database');

async function findByUsernameOrEmail(username, email) {
    const [rows] = await db.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
    );
    return rows;
}

async function createUser({ username, password, email, phone_number }) {
    const [result] = await db.execute(
        'INSERT INTO users (username, password, email, phone_number) VALUES (?, ?, ?, ?)',
        [username, password, email, phone_number]
    );
    return result.insertId;
}

async function findByCredentials(username, password) {
    const [users] = await db.execute(
        'SELECT id, username, email FROM users WHERE username = ? AND password = ?',
        [username, password]
    );
    return users;
}

module.exports = {
    findByUsernameOrEmail,
    createUser,
    findByCredentials
};
