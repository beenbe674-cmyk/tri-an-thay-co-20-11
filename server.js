const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, "messages.json");
const ADMIN_PIN = process.env.ADMIN_PIN || "2011";

app.use(express.json({ limit: "12kb" }));
app.use(express.static(path.join(__dirname, "public")));

function readMessages() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function saveMessages(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

app.get("/api/messages", (_req, res) => {
  const messages = readMessages().map(({id, name, message, createdAt}) => ({id, name, message, createdAt}));
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  let name = String(req.body.name || "").trim().slice(0, 32);
  let message = String(req.body.message || "").trim().slice(0, 180);
  if (!name || !message) return res.status(400).json({error: "Vui lòng nhập tên và lời chúc."});
  if (message.length < 3) return res.status(400).json({error: "Lời chúc quá ngắn."});
  const messages = readMessages();
  if (messages.length >= 500) return res.status(429).json({error: "Bảng lời chúc đã đầy. Hãy liên hệ ban tổ chức."});
  const item = {id: Date.now().toString(36) + Math.random().toString(36).slice(2,7), name, message, createdAt: new Date().toISOString()};
  messages.push(item);
  saveMessages(messages);
  res.json({ok: true});
});

app.delete("/api/messages/:id", (req, res) => {
  if (String(req.headers["x-admin-pin"] || "") !== ADMIN_PIN)
    return res.status(401).json({error: "Mã quản trị không đúng."});
  const messages = readMessages().filter(m => m.id !== req.params.id);
  saveMessages(messages);
  res.json({ok: true});
});

app.get("/api/health", (_req, res) => res.json({ok: true}));
app.listen(PORT, () => console.log(`Website đang chạy tại cổng ${PORT}`));
