// server.js
import express from "express";

const app = express();
app.use(express.json());

// !!! поставь сюда домен фронта, чтобы работал CORS между фронтом и бэком
const FRONT_ORIGIN = "https://<твой-фронт-домен>"; // напр. https://r3lease...github.io/telegram-shop/ или твой timeweb фронт

// Минимальный CORS без доп. зависимостей
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONT_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health
app.get("/", (_, res) => res.json({ ok: true, service: "api" }));
app.get("/api/ping", (_, res) => res.json({ ok: true, msg: "pong" }));

/** ---------- Моки данных (до БД) ---------- **/

// Продукты (образец структуры; добавишь свои)
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
      color: ["emerald", "ruby"],
      clasp: ["pin"]
    },
    status: "active"
  },
  {
    id: "rin-001",
    title: "Кольцо «Ветер»",
    price: 3200,
    description: "Серебро 925",
    category: "Кольца",
    images: [
      "https://picsum.photos/seed/ring1a/800/800"
    ],
    attributes: {
      size: ["15", "16", "17", "18"]
    },
    status: "active"
  }
];

// Заказы (in-memory, только для теста)
const ORDERS = [];

/** ---------- Endpoints продуктов ---------- **/

app.get("/api/products", (req, res) => {
  const { category } = req.query; // опциональный фильтр: /api/products?category=Серьги
  let list = PRODUCTS.filter(p => p.status === "active");
  if (category) list = list.filter(p => p.category === category);
  res.json(list);
});

app.get("/api/products/:id", (req, res) => {
  const item = PRODUCTS.find(p => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Product not found" });
  res.json(item);
});

/** ---------- Endpoints заказов ---------- **/

// Утилита для ID заказа
const genOrderId = () =>
  "ord_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Пересчёт суммы на сервере (не доверяем клиенту)
function calcTotal(items = []) {
  let sum = 0;
  for (const it of items) {
    const p = PRODUCTS.find(x => x.id === it.productId);
    if (!p) continue;
    const qty = Number(it.qty) || 1;
    sum += p.price * qty;
  }
  return sum;
}

app.post("/api/orders", (req, res) => {
  const { name, phone, delivery, address, payment, items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Empty items" });
  }
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  const orderId = genOrderId();
  const total = calcTotal(items);

  const order = {
    id: orderId,
    created_at: new Date().toISOString(),
    name,
    phone,
    delivery: delivery || "Самовывоз",
    address: address || "",
    payment: payment || "При получении",
    total,
    status: "Новый",
    items: items.map(it => ({
      productId: it.productId,
      title: PRODUCTS.find(p => p.id === it.productId)?.title || "",
      qty: Number(it.qty) || 1,
      selected_attributes: it.selected_attributes || {}
    }))
  };

  ORDERS.unshift(order); // положили в память для проверки
  res.json({ ok: true, orderId, total });
});

// (опционально) получить список заказов — пригодится для админки
app.get("/api/orders", (_, res) => {
  res.json(ORDERS);
});

/** ---------- Запуск ---------- **/
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API running on ${port}`));
