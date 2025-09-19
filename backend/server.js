import express from "express";

const app = express();
app.use(express.json());

// тестовый роут
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, msg: "pong" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API running on port ${port}`));
