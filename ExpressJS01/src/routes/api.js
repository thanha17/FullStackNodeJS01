const express = require('express');

const {
  createUser,
  handleLogin,
  getUser,
  getAccount,
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/userController');

const auth = require('../middleware/auth');
const delay = require('../middleware/delay');

const {
  getProducts,
  createProduct,
  searchProducts,
  getProductDetail,
} = require('../controllers/productController');
const { createOrder } = require('../controllers/orderController');
const { listComments, addComment } = require('../controllers/commentController');
const { getCart, addOrUpdateItem, updateQuantity, removeItem } = require('../controllers/cartController');

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
routerAPI.get("/products/:id", getProductDetail);
routerAPI.get("/products/:productId/comments", listComments);

// ===== USER (private) =====
routerAPI.use(auth); // ✅ áp dụng auth cho tất cả route dưới đây

routerAPI.get("/user", getUser);
routerAPI.get("/account", delay, getAccount);
// Favorites
routerAPI.get("/favorites", getFavorites);
routerAPI.post("/favorites", addFavorite);
routerAPI.delete("/favorites/:productId", removeFavorite);

// Cart
routerAPI.get("/cart", getCart);
routerAPI.post("/cart/items", addOrUpdateItem);
routerAPI.put("/cart/items", updateQuantity);
routerAPI.delete("/cart/items/:productId", removeItem);

// ===== PRODUCT (private - ví dụ admin mới được thêm) =====
routerAPI.post("/products", createProduct);
routerAPI.post("/orders", createOrder);
routerAPI.post("/products/:productId/comments", addComment);

module.exports = routerAPI;
