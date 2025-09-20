const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());

// Подключение к БД с сертификатом
const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: {
    ca: fs.readFileSync(__dirname + '/certs/root.crt').toString()
  }
});

// Тестовый эндпоинт
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error('Ошибка подключения к БД:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(3000, () => console.log('✅ Server running on port 3000'));
