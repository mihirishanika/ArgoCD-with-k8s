require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head><title>Product Service</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Product Service</h1>
        <p>This service provides product data for the shop frontend.</p>
        <ul>
          <li>GET /products</li>
          <li>GET /search?q=shirt</li>
          <li>POST /products</li>
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
const inMemoryProducts = [
  {id: 1, name: 'Basic T-Shirt', price: 9.99, stock: 100},
  {id: 2, name: 'Coffee Mug', price: 7.5, stock: 50},
  {id: 3, name: 'Sticker Pack', price: 2.99, stock: 200}
];

(async function testDb(){
  try {
    await pool.query('SELECT 1');
    useDb = true;
    console.log('product-service: connected to DB');
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS products (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        price DECIMAL(10,2),
        stock INT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    } catch (e) {
      console.warn('product-service: ensure schema error', e.message);
    }
  } catch (err) {
    useDb = false;
    console.warn('product-service: cannot connect to DB, using in-memory data');
  }
})();

app.get('/health', (req, res) => res.json({status: 'ok'}));

app.get('/products', async (req, res) => {
  try {
    if (useDb) {
      const [rows] = await pool.query('SELECT id, name, price, stock FROM products');
      res.json(rows);
    } else {
      res.json(inMemoryProducts);
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (useDb) {
      const [rows] = await pool.query('SELECT id, name, price, stock FROM products WHERE name LIKE ?', ['%' + q + '%']);
      res.json(rows);
    } else {
      const filtered = inMemoryProducts.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
      res.json(filtered);
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// Admin: add product
app.post('/products', async (req, res) => {
  try {
    const {name, price, stock} = req.body;
    if (useDb) {
      const [result] = await pool.query('INSERT INTO products (name, price, stock) VALUES (?,?,?)', [name, price, stock]);
      res.json({id: result.insertId});
    } else {
      const id = inMemoryProducts.length ? inMemoryProducts[inMemoryProducts.length-1].id + 1 : 1;
      inMemoryProducts.push({id, name, price, stock});
      res.json({id});
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('product-service listening on', port));
