const Comment = require("../models/comment.model");
const Product = require("../models/product.model");

const listComments = async (req, res) => {
  try {
    const { productId } = req.params;
    const comments = await Comment.find({ product: productId }).sort({ createdAt: -1 });
    return res.status(200).json({ EC: 0, EM: "Success", DT: comments });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: [] });
  }
};

const addComment = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { productId, content, rating = 5 } = req.body;
    if (!userEmail) return res.status(401).json({ EC: 1, EM: "Unauthorized", DT: null });
    if (!productId || !content) return res.status(400).json({ EC: 1, EM: "productId and content are required", DT: null });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ EC: 1, EM: "Product not found", DT: null });

    const comment = await Comment.create({ product: productId, userEmail, content, rating });
    await Product.findByIdAndUpdate(productId, { $inc: { commentsCount: 1 } });

    return res.status(201).json({ EC: 0, EM: "Comment added", DT: comment });
  } catch (error) {
    return res.status(500).json({ EC: 1, EM: error.message, DT: null });
  }
};

module.exports = { listComments, addComment };

