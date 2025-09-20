import express from "express";
import fs from "fs";
import pkg from "pg";

const { Client } = pkg;
const app = express();
app.use(express.json());

// Настраиваем клиента PostgreSQL напрямую
const client = new Client({
  user: "gen_user",
  host: "ebbc81ddef8824fd1188953b.twc1.net", // можно и IP, но лучше домен
  database: "default_db",
  password: "g1oGc7p+20dmgz",
  port: 5432,
  ssl: {
    ca: fs.readFileSync("./certs/root.crt").toString(),
  },
});

// Подключение к базе
client.connect()
  .then(() => console.log("✅ Connected to DB"))
  .catch(err => console.error("❌ DB connection error:", err.message));

// Базовый роут
app.get("/", (req, res) => {
  res.send("✅ Backend работает + прямое подключение к PostgreSQL");
});

// Тестовый эндпоинт
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await client.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error("❌ DB query error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
