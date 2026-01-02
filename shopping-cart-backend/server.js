const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // thay bằng user của bạn nếu khác
  password: "512008", // thay bằng mật khẩu MySQL của bạn
  database: "shopping_cart2",
});
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// Danh sách sản phẩm cố định (theo hình)
const PRODUCTS = [
  { name: "Áo thun", price: 150000 },
  { name: "Quần jean", price: 550000 },
  { name: "Giày sneaker", price: 900000 },
];

// API: lấy danh sách sản phẩm (màn Cửa hàng)
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

// API: lấy giỏ hàng
app.get("/api/cart", (req, res) => {
  db.query("SELECT * FROM cart_items", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API: thêm vào giỏ (tăng quantity nếu trùng name)
app.post("/api/cart", (req, res) => {
  const { name, price, quantity } = req.body;
  const findQuery = "SELECT * FROM cart_items WHERE name = ? LIMIT 1";
  db.query(findQuery, [name], (err, rows) => {
    if (err) throw err;
    if (rows.length) {
      const updateQuery =
        "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?";
      db.query(updateQuery, [quantity, rows[0].id], (err2) => {
        if (err2) throw err2;
        db.query(
          "SELECT * FROM cart_items WHERE id = ?",
          [rows[0].id],
          (err3, updated) => {
            if (err3) throw err3;
            res.json(updated[0]);
          }
        );
      });
    } else {
      const insertQuery =
        "INSERT INTO cart_items (name, price, quantity) VALUES (?, ?, ?)";
      db.query(insertQuery, [name, price, quantity], (err4, result) => {
        if (err4) throw err4;
        db.query(
          "SELECT * FROM cart_items WHERE id = ?",
          [result.insertId],
          (err5, created) => {
            if (err5) throw err5;
            res.json(created[0]);
          }
        );
      });
    }
  });
});

// API: xóa 1 item trong giỏ (tuỳ chọn)
app.delete("/api/cart/:id", (req, res) => {
  db.query("DELETE FROM cart_items WHERE id = ?", [req.params.id], (err) => {
    if (err) throw err;
    res.json({ ok: true });
  });
});

// API: tổng thanh toán
app.get("/api/cart-total", (req, res) => {
  db.query(
    "SELECT SUM(price * quantity) AS total FROM cart_items",
    (err, rows) => {
      if (err) throw err;
      const total = rows[0].total || 0;
      res.json({ total });
    }
  );
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
