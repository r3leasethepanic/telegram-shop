const express = require("express");

const app = express();
app.use(express.json());

// тестовый роут
app.get("/", (req, res) => {
  res.send("✅ Backend работает на 3000!");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
