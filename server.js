import express from "express";

const app = express();
app.use(express.json());

// Тестовый эндпоинт
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, msg: "pong" });
});

// Продукты
app.get("/api/products", (req, res) => {
  res.json([{ id: "test-1", title: "Тестовый товар", price: 1000 }]);
});

// Заказы
app.post("/api/orders", (req, res) => {
  const { name, phone, items } = req.body || {};
  if (!name || !phone || !Array.isArray(items)) {
    return res.status(400).json({ error: "Bad request" });
  }
  res.json({ ok: true, orderId: "ord_" + Date.now() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API running on ${port}`));
