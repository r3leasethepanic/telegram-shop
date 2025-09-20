import express from "express";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());

// Подключение к БД через пул
let pool;
try {
  pool = new Pool({
    host: process.env.POSTGRESQL_HOST,
    port: process.env.POSTGRESQL_PORT,
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    database: process.env.POSTGRESQL_DBNAME,
    ssl: { rejectUnauthorized: false } // нужно для Timeweb
  });
  console.log("✅ Pool initialized");
} catch (err) {
  console.error("❌ Ошибка инициализации пула:", err.message);
}

// базовый роут
app.get("/", (req, res) => {
  res.send("✅ Backend работает + dotenv + pg");
});

// тестовый роут для БД
app.get("/api/db-test", async (req, res) => {
  if (!pool) {
    return res.status(500).json({ ok: false, error: "Нет подключения к БД" });
  }

  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error("❌ DB error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
