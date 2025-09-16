const Order = require("../models/order.model");
const Product = require("../models/product.model");

const createOrder = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { items } = req.body; // [{ product, quantity }]
    if (!userEmail) return res.status(401).json({ EC: 1, EM: "Unauthorized", DT: null });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ EC: 1, EM: "items is required", DT: null });
    }

    // tính tổng
    let totalAmount = 0;
    const normalized = [];
    for (const it of items) {
      const prod = await Product.findById(it.product);
      if (!prod) return res.status(404).json({ EC: 1, EM: "Product not found", DT: null });
      const qty = Math.max(1, parseInt(it.quantity || 1));
      totalAmount += prod.price * qty;
      normalized.push({ product: prod._id, quantity: qty, priceAtPurchase: prod.price });
    }

    const order = await Order.create({ userEmail, items: normalized, totalAmount });

    // cập nhật đếm mua cho mỗi sp
    for (const it of normalized) {
      await Product.findByIdAndUpdate(it.product, { $inc: { purchasesCount: it.quantity } });
    }

    return res.status(201).json({ EC: 0, EM: "Order created", DT: order });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

module.exports = { createOrder };

