
const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PIN = process.env.ADMIN_PIN || "2011";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Thieu cau hinh Supabase.");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.json({ limit: "12kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Lay danh sach loi chuc
app.get("/api/messages", async (_req, res) => {
  const { data, error } = await supabase
    .from("wishes")
    .select("id, sender_name, message, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return res.status(500).json({
      error: "Khong the tai loi chuc."
    });
  }

  res.json(data.map(item => ({
    id: item.id,
    name: item.sender_name,
    message: item.message,
    createdAt: item.created_at
  })));
});

// Gui loi chuc moi
app.post("/api/messages", async (req, res) => {
  const name = String(req.body.name || "Ẩn danh")
    .trim()
    .slice(0, 40);

  const message = String(req.body.message || "")
    .trim()
    .slice(0, 500);

  if (!name || !message) {
    return res.status(400).json({
      error: "Vui long nhap ten va loi chuc."
    });
  }

  const { error } = await supabase
    .from("wishes")
    .insert({
      sender_name: name,
      message: message
    });

  if (error) {
    console.error(error);
    return res.status(500).json({
      error: "Chua gui duoc loi chuc. Vui long thu lai."
    });
  }

  res.json({ ok: true });
});

// Xoa loi chuc
app.delete("/api/messages/:id", async (req, res) => {
  const adminPin = String(req.headers["x-admin-pin"] || "");

  if (adminPin !== ADMIN_PIN) {
    return res.status(401).json({
      error: "Ma quan tri khong dung."
    });
  }

  const id = req.params.id;

  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return res.status(500).json({
      error: "Khong the xoa loi chuc."
    });
  }

  res.json({ ok: true });
});

// Kiem tra server
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Website dang chay tai cong ${PORT}`);
});
