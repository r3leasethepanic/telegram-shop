import express from "express";

const app = express();
app.use(express.json());

/** ---------- Моки продуктов ---------- **/
const PRODUCTS = [
  {
    id: "ear-001",
    title: "Серьги «Лунный свет»",
    price: 2400,
    description: "Серебро 925, куб. цирконий",
    category: "Серьги",
    images: [
      "https://picsum.photos/seed/ear1a/800/800",
      "https://picsum.photos/seed/ear1b/800/800"
    ],
    attributes: { color: ["silver", "gold"], size: ["S", "M", "L"] },
    status: "active"
  },
  {
    id: "bro-001",
    title: "Брошь «Астра»",
    price: 1800,
    description: "Латунь, эмаль",
    category: "Броши",
    images: [
      "https://picsum.photos/seed/bro1a/800/800",
      "https://picsum.photos/seed/bro1b/800/800"
    ],
    attributes: { color: ["emerald", "ruby"] },
    status: "active"
  }
];

/** ---------- Заказы ---------- **/
const ORDERS = [];

/** ---------- Эндпоинты ---------- **/

// Healthcheck
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, msg: "pong" });
});

// Все продукты (с фильтром по категории)
app.get("/api/products", (req, res) => {
  const { category } = req.query;
  let list = PRODUCTS.filter(p => p.status === "active");
  if (category) list = list.filter(p => p.category === category);
  res.json(list);
});

// Один продукт
app.get("/api/products/:id", (req, res) => {
  const item = PRODUCTS.find(p => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Product not found" });
  res.json(item);
});

// Создать заказ
app.post("/api/orders", (req, res) => {
  const { name, phone, items } = req.body || {};
  if (!name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Bad request" });
  }

  let total = 0;
  const detailedItems = items.map(({ id, qty }) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return null;
    const lineTotal = product.price * qty;
    total += lineTotal;
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      qty,
      lineTotal
    };
  }).filter(Boolean);

  if (detailedItems.length === 0) {
    return res.status(400).json({ error: "No valid products" });
  }

  const order = {
    id: "ord_" + Date.now(),
    name,
    phone,
    items: detailedItems,
    total,
    status: "new",
    createdAt: new Date().toISOString()
  };

  ORDERS.push(order);
  res.json({ ok: true, orderId: order.id });
});

// Получить все заказы
app.get("/api/orders", (req, res) => {
  res.json(ORDERS);
});

// Получить один заказ
app.get("/api/orders/:id", (req, res) => {
  const order = ORDERS.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// Обновить статус заказа
app.put("/api/orders/:id", (req, res) => {
  const order = ORDERS.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });

  order.status = status;
  res.json({ ok: true, id: order.id, status: order.status });
});

/** ---------- Запуск ---------- **/
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API running on ${port}`));
