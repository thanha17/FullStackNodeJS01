const Cart = require("../models/cart.model");

const getCart = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ EC: 1, EM: "Unauthorized", DT: null });

    let cart = await Cart.findOne({ userEmail }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }
    return res.status(200).json({ EC: 0, EM: "Success", DT: cart });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

const addOrUpdateItem = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { productId, quantity = 1 } = req.body;
    if (!userEmail) return res.status(401).json({ EC: 1, EM: "Unauthorized", DT: null });
    if (!productId) return res.status(400).json({ EC: 1, EM: "productId is required", DT: null });

    let cart = await Cart.findOne({ userEmail });
    if (!cart) cart = await Cart.create({ userEmail, items: [] });

    const qty = Math.max(1, parseInt(quantity));
    const idx = cart.items.findIndex((it) => it.product.toString() === productId);
    if (idx >= 0) {
      cart.items[idx].quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }
    await cart.save();

    cart = await cart.populate("items.product");
    return res.status(200).json({ EC: 0, EM: "Updated", DT: cart });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { productId, quantity } = req.body;
    if (!userEmail) return res.status(401).json({ EC: 1, EM: "Unauthorized", DT: null });
    if (!productId || typeof quantity !== 'number') return res.status(400).json({ EC: 1, EM: "productId and quantity required", DT: null });

    let cart = await Cart.findOne({ userEmail });
    if (!cart) return res.status(404).json({ EC: 1, EM: "Cart not found", DT: null });

    const idx = cart.items.findIndex((it) => it.product.toString() === productId);
    if (idx < 0) return res.status(404).json({ EC: 1, EM: "Item not found", DT: null });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    await cart.save();

    cart = await cart.populate("items.product");
    return res.status(200).json({ EC: 0, EM: "Updated", DT: cart });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

const removeItem = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { productId } = req.params;
    if (!userEmail) return res.status(401).json({ EC: 1, EM: "Unauthorized", DT: null });

    let cart = await Cart.findOne({ userEmail });
    if (!cart) return res.status(404).json({ EC: 1, EM: "Cart not found", DT: null });

    cart.items = cart.items.filter((it) => it.product.toString() !== productId);
    await cart.save();
    cart = await cart.populate("items.product");

    return res.status(200).json({ EC: 0, EM: "Removed", DT: cart });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

module.exports = { getCart, addOrUpdateItem, updateQuantity, removeItem };

