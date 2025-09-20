import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pkg from "pg";
import { fileURLToPath } from "url";

dotenv.config();

const { Client } = pkg;
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  POSTGRESQL_HOST,
  POSTGRESQL_PORT,
  POSTGRESQL_USER,
  POSTGRESQL_PASSWORD,
  POSTGRESQL_DBNAME,
} = process.env;

if (!POSTGRESQL_HOST || !POSTGRESQL_USER || !POSTGRESQL_PASSWORD || !POSTGRESQL_DBNAME) {
  console.error("❌ Missing PostgreSQL configuration in environment variables");
  process.exit(1);
}

const sslOptions = {
  ca: fs.readFileSync(path.join(__dirname, "certs/root.crt"), "utf8"),
  rejectUnauthorized: true,
};

const client = new Client({
  host: POSTGRESQL_HOST,
  port: Number(POSTGRESQL_PORT) || 5432,
  user: POSTGRESQL_USER,
  password: POSTGRESQL_PASSWORD,
  database: POSTGRESQL_DBNAME,
  ssl: sslOptions,
  connectionTimeoutMillis: 5000,
});

// Подключение к базе
client.connect()
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    console.error("ℹ️ Check that your public IP is allowed in the Timeweb panel and that SSL certificates match the server.");
  });

client.on("error", (err) => {
  console.error("❌ DB client error:", err.message);
});

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
