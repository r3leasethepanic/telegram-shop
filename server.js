import express from "express";
import fs from "fs";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(express.json());

// Подключение к БД через отдельные переменные .env
const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: {
    ca: fs.readFileSync("./certs/root.crt").toString(), // загружаем сертификат
  },
});

// Тестовый эндпоинт для проверки БД
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Проверка, что сервер поднялся
app.get("/", (req, res) => {
  res.send("✅ Backend работает и ждёт запросов!");
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
