const express = require('express');

const {
  createUser,
  handleLogin,
  getUser,
  getAccount,
} = require('../controllers/userController');

const auth = require('../middleware/auth');
const delay = require('../middleware/delay');

const {
  getProducts,
  createProduct,
  searchProducts,
} = require('../controllers/productController');

const routerAPI = express.Router();

// ===== TEST =====
routerAPI.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello world api" });
});

// ===== AUTH (public) =====
routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);

// ===== PRODUCT (public) =====
routerAPI.get("/products", getProducts);        
routerAPI.get("/products/search", searchProducts);

// ===== USER (private) =====
routerAPI.use(auth); // ✅ áp dụng auth cho tất cả route dưới đây

routerAPI.get("/user", getUser);
routerAPI.get("/account", delay, getAccount);

// ===== PRODUCT (private - ví dụ admin mới được thêm) =====
routerAPI.post("/products", createProduct);

module.exports = routerAPI;
