import express from "express";
import dotenv from "dotenv";
import pkg from "pg";
import fs from "fs";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());

// Читаем сертификат
const sslCert = fs.readFileSync(new URL("./certs/root.crt", import.meta.url));

const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: { ca: sslCert }
});

// базовый роут
app.get("/", (req, res) => {
  res.send("✅ Backend работает + dotenv + pg + cert");
});

// тестовый роут для проверки БД
app.get("/api/db-test", async (req, res) => {
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
