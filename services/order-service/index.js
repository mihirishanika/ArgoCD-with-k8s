require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head><title>Order Service</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Order Service</h1>
        <p>This service handles checkout and order storage.</p>
        <ul>
          <li>GET /orders</li>
          <li>GET /orders/:id</li>
          <li>POST /orders</li>
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
const dataDir = path.join(__dirname, 'data');
const ordersFile = path.join(dataDir, 'orders.json');

async function ensureOrdersFile() {
  await fs.mkdir(dataDir, {recursive: true});
  try {
    await fs.access(ordersFile);
  } catch (error) {
    await fs.writeFile(ordersFile, '[]', 'utf8');
  }
}

async function readOrders() {
  await ensureOrdersFile();
  const contents = await fs.readFile(ordersFile, 'utf8');
  return JSON.parse(contents || '[]');
}

async function writeOrders(orders) {
  await ensureOrdersFile();
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
}

async function ensureOrdersTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    items JSON NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

(async function testDb() {
  try {
    await pool.query('SELECT 1');
    useDb = true;
    console.log('order-service: connected to DB');
    try {
      await ensureOrdersTable();
    } catch (error) {
      console.warn('order-service: ensureOrdersTable error', error.message);
    }
  } catch (error) {
    useDb = false;
    console.warn('order-service: cannot connect to DB, using JSON fallback');
  }
})();

app.get('/health', (req, res) => res.json({status: 'ok'}));

app.get('/orders', async (req, res) => {
  try {
    if (useDb) {
      const [rows] = await pool.query(
        'SELECT id, customer_email AS customerEmail, items, total, status, created_at AS createdAt FROM orders ORDER BY id ASC'
      );
      const mapped = rows.map((row) => ({
        ...row,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
        total: Number(row.total)
      }));
      res.json(mapped);
    } else {
      const orders = await readOrders();
      res.json(orders);
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({error: 'Invalid order id'});
    }

    if (useDb) {
      const [rows] = await pool.query(
        'SELECT id, customer_email AS customerEmail, items, total, status, created_at AS createdAt FROM orders WHERE id = ?',
        [orderId]
      );
      if (!rows.length) {
        return res.status(404).json({error: 'Order not found'});
      }
      const row = rows[0];
      res.json({
        ...row,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
        total: Number(row.total)
      });
    } else {
      const orders = await readOrders();
      const order = orders.find((item) => item.id === orderId);
      if (!order) {
        return res.status(404).json({error: 'Order not found'});
      }
      res.json(order);
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.post('/orders', async (req, res) => {
  try {
    const {customerEmail, items, total} = req.body;
    if (!customerEmail || !Array.isArray(items)) {
      return res.status(400).json({error: 'customerEmail and items are required'});
    }

    const order = {
      customerEmail,
      items,
      total: Number(total || 0),
      status: 'accepted',
      createdAt: new Date().toISOString()
    };

    if (useDb) {
      const [result] = await pool.query(
        'INSERT INTO orders (customer_email, items, total, status, created_at) VALUES (?, ?, ?, ?, ?)',
        [order.customerEmail, JSON.stringify(order.items), order.total, order.status, order.createdAt]
      );
      return res.status(201).json({...order, id: result.insertId});
    }

    const orders = await readOrders();
    const nextId = orders.length ? orders[orders.length - 1].id + 1 : 1;
    const storedOrder = {...order, id: nextId};
    orders.push(storedOrder);
    await writeOrders(orders);
    res.status(201).json(storedOrder);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

const port = process.env.PORT || 4020;
app.listen(port, () => console.log('order-service listening on', port));