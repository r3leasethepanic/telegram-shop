import pool from "../config/db.js";

export async function createOrder(req, res) {
  const { name, phone, delivery, address, payment, total, items } = req.body;

  try {
    // Создаём заказ
    const orderRes = await pool.query(
      "INSERT INTO orders (name, phone, delivery, address, payment, total) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [name, phone, delivery, address, payment, total]
    );
    const orderId = orderRes.rows[0].id;

    // Добавляем позиции заказа
    for (const it of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_title, qty, price, selected_attributes) VALUES ($1,$2,$3,$4,$5)",
        [orderId, it.title, it.qty, it.price, JSON.stringify(it.selected_attributes || {})]
      );
    }

    res.json({ ok: true, orderId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка при создании заказа" });
  }
}

export async function getAllOrders(req, res) {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}

export async function getOrderById(req, res) {
  try {
    const orderRes = await pool.query("SELECT * FROM orders WHERE id=$1", [req.params.id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: "Заказ не найден" });
    }
    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id=$1", [req.params.id]);

    res.json({
      ...orderRes.rows[0],
      items: itemsRes.rows
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}
