require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head><title>User Service</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>User Service</h1>
        <p>This service handles simple register and login endpoints.</p>
        <ul>
          <li>POST /register</li>
          <li>POST /login</li>
        </ul>
      </body>
    </html>
  `);
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : 'root',
  database: process.env.DB_NAME || 'argocd',
  waitForConnections: true,
  connectionLimit: 10
});

let useDb = true;
const inMemoryUsers = []; // {id, email, password_hash}

async function ensureUsersTable() {
  const create = `CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
  await pool.query(create);
}

(async function testDb(){
  try {
    await pool.query('SELECT 1');
    useDb = true;
    console.log('user-service: connected to DB');
    try { await ensureUsersTable(); } catch (e) { console.warn('user-service: ensureUsersTable error', e.message); }
  } catch (err) {
    useDb = false;
    console.warn('user-service: cannot connect to DB, using in-memory users');
  }
})();

app.post('/register', async (req, res) => {
  try {
    const {email, password} = req.body;
    const hash = await bcrypt.hash(password, 10);
    if (useDb) {
      const name = req.body.name || null;
      const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?,?,?)', [name, email, hash]);
      res.json({id: result.insertId});
    } else {
      const id = inMemoryUsers.length ? inMemoryUsers[inMemoryUsers.length-1].id + 1 : 1;
      inMemoryUsers.push({id, email, password_hash: hash});
      res.json({id});
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;
    if (useDb) {
      const [rows] = await pool.query('SELECT id, password FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({error: 'Invalid credentials'});
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({error: 'Invalid credentials'});
      const token = jwt.sign({sub: user.id, email}, process.env.JWT_SECRET || 'dev-secret', {expiresIn: '7d'});
      res.json({token});
    } else {
      const user = inMemoryUsers.find(u => u.email === email);
      if (!user) return res.status(401).json({error: 'Invalid credentials'});
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({error: 'Invalid credentials'});
      const token = jwt.sign({sub: user.id, email}, process.env.JWT_SECRET || 'dev-secret', {expiresIn: '7d'});
      res.json({token});
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('/health', (req, res) => res.json({status: 'ok'}));

const port = process.env.PORT || 4010;
app.listen(port, () => console.log('user-service listening on', port));
