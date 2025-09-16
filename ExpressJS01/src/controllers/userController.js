const { createUserService, loginService, getUserService } = require("../services/userService");
const User = require("../models/user");

const createUser = async (req, res) => {
    const data = await createUserService(req.body.name, req.body.email, req.body.password);
    return res.status(200).json(data);
};

const handleLogin = async (req, res) => {
    const data = await loginService(req.body.email, req.body.password);
    return res.status(200).json(data);
};

const getUser = async (req, res) => {
    const data = await getUserService();
    return res.status(200).json(data);
};

const getAccount = async (req, res) => {
    return res.status(200).json(req.user);
};

// ===== FAVORITES =====
const getFavorites = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('favorites');
    if (!user) {
      return res.status(404).json({ EC: 1, EM: 'User not found', DT: [] });
    }
    return res.status(200).json({ EC: 0, EM: 'Success', DT: user.favorites || [] });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: [] });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ EC: 1, EM: 'productId is required', DT: null });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ EC: 1, EM: 'User not found', DT: null });

    const exists = (user.favorites || []).some(id => id.toString() === productId);
    if (!exists) {
      user.favorites = [...(user.favorites || []), productId];
      await user.save();
    }
    return res.status(200).json({ EC: 0, EM: 'Added to favorites', DT: user.favorites });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ EC: 1, EM: 'productId is required', DT: null });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ EC: 1, EM: 'User not found', DT: null });

    user.favorites = (user.favorites || []).filter(id => id.toString() !== productId);
    await user.save();
    return res.status(200).json({ EC: 0, EM: 'Removed from favorites', DT: user.favorites });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

module.exports = { createUser, handleLogin, getUser, getAccount, getFavorites, addFavorite, removeFavorite };
