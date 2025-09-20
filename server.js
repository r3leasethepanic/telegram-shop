const express = require("express");

const app = express();
app.use(express.json());

// Тестовый роут
app.get("/", (req, res) => {
  res.send("✅ Backend работает без БД");
});

// Timeweb ожидает, что сервер слушает process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
