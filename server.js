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
    attributes: {
      color: ["silver", "gold"],
      size: ["S", "M", "L"]
    },
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
    attributes: {
      color: ["emerald", "ruby"]
    },
    status: "active"
  }
];

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

// Заказы (пока заглушка)
app.post("/api/orders", (req, res) => {
  const { name, phone, items } = req.body || {};
  if (!name || !phone || !Array.isArray(items)) {
    return res.status(400).json({ error: "Bad request" });
  }
  res.json({ ok: true, orderId: "ord_" + Date.now() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API running on ${port}`));
