const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());

// Пробуем подключение к БД
let pool;
try {
  pool = new Pool({
    host: process.env.POSTGRESQL_HOST,
    port: process.env.POSTGRESQL_PORT,
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    database: process.env.POSTGRESQL_DBNAME,
    ssl: { rejectUnauthorized: false }
  });
  console.log("✅ Pool initialized");
} catch (err) {
  console.error("❌ Ошибка инициализации пула:", err.message);
}

// Тестовый роут
app.get("/", (req, res) => {
  res.send("✅ Backend работает (БД проверяй через /api/db-test)");
});

// Тестовый запрос к БД
app.get("/api/db-test", async (req, res) => {
  if (!pool) return res.status(500).json({ ok: false, error: "Нет подключения к БД" });

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
