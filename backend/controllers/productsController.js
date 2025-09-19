import pool from "../config/db.js";

export async function getAllProducts(req, res) {
  try {
    const result = await pool.query("SELECT * FROM products WHERE status = 'active'");
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}

export async function getProductById(req, res) {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}
