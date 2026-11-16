
const express = require("express");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || "2011";
const BUCKET_NAME = "memory-photos";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Thieu cau hinh Supabase.");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Chi chap nhan JPG, PNG hoac WEBP."));
    }

    cb(null, true);
  }
});

app.use(express.json({ limit: "12kb" }));
app.use(express.static(path.join(__dirname, "public")));

// DANH SACH LOI CHUC
app.get("/api/messages", async (_req, res) => {
  const { data, error } = await supabase
    .from("wishes")
    .select("id, sender_name, message, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Khong the tai loi chuc." });
  }

  res.json(data.map(item => ({
    id: item.id,
    name: item.sender_name,
    message: item.message,
    createdAt: item.created_at
  })));
});

// GUI LOI CHUC
app.post("/api/messages", async (req, res) => {
  const name = String(req.body.name || "Ẩn danh").trim().slice(0, 40);
  const message = String(req.body.message || "").trim().slice(0, 500);

  if (!name || !message) {
    return res.status(400).json({ error: "Vui long nhap ten va loi chuc." });
  }

  const { error } = await supabase.from("wishes").insert({
    sender_name: name,
    message
  });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Chua gui duoc loi chuc." });
  }

  res.json({ ok: true });
});

// DANH SACH SO LUU BUT
app.get("/api/guestbook", async (_req, res) => {
  const { data, error } = await supabase
    .from("guestbook_entries")
    .select("id, sender_name, class_name, memory, photos, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Khong the tai so luu but." });
  }

  res.json(data);
});

// GUI TRANG LUU BUT VA NHIEU ANH
app.post("/api/guestbook", upload.array("photos", 5), async (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 40);
  const className = String(req.body.className || "").trim().slice(0, 30);
  const memory = String(req.body.memory || "").trim().slice(0, 2000);
  const files = req.files || [];

  if (!name || !memory) {
    return res.status(400).json({
      error: "Vui long nhap ten va noi dung ky niem."
    });
  }

  const uploadedPaths = [];
  const photoUrls = [];

  try {
    for (const file of files) {
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      }[file.mimetype];

      if (!extension) throw new Error("Anh khong hop le.");

      const filePath = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      uploadedPaths.push(filePath);

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      photoUrls.push(data.publicUrl);
    }

    const { data, error } = await supabase
      .from("guestbook_entries")
      .insert({
        sender_name: name,
        class_name: className,
        memory,
        photos: photoUrls
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, entry: data });
  } catch (error) {
    console.error("Loi gui luu but:", error);

    if (uploadedPaths.length) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(uploadedPaths);

      if (removeError) console.error(removeError);
    }

    res.status(500).json({
      error: "Chua gui duoc luu but. Vui long thu lai."
    });
  }
});

// XOA LOI CHUC
app.delete("/api/messages/:id", async (req, res) => {
  const adminPin = String(req.headers["x-admin-pin"] || "");

  if (adminPin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Ma quan tri khong dung." });
  }

  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Khong the xoa loi chuc." });
  }

  res.json({ ok: true });
});

// XU LY LOI UPLOAD
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Moi anh khong duoc vuot qua 5 MB."
      : "Moi trang chi duoc toi da 5 anh.";

    return res.status(400).json({ error: message });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "Anh khong hop le."
    });
  }
});

// KIEM TRA SERVER
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Website dang chay tai cong ${PORT}`);
});
