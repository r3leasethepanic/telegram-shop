const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());

// Подключение к БД
const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: { rejectUnauthorized: false } // нужно для Timeweb
});

// Тестовый роут для проверки
app.get("/", (req, res) => {
  res.send("✅ Backend работает и подключен к PostgreSQL (попробуй /api/db-test)");
});

// Проверка БД
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error("❌ DB error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Сервер
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
