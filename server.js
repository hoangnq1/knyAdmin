const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// cấu hình multer: lưu vào thư mục public/assets
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/assets");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // giữ nguyên tên file
  },
});
const upload = multer({ storage });

// cho phép truy cập file tĩnh trong public/
app.use(express.static("public"));

// API upload
app.post("/upload", upload.single("image"), (req, res) => {
  const fileUrl = `https://8x9flp.csb.app/assets/${req.file.originalname}`;
  res.json({ status: "success", url: fileUrl });
});

app.listen(PORT, () => {
  console.log(`Server chạy ở http://localhost:${PORT}`);
});
