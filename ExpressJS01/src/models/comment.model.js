const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  userEmail: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);

