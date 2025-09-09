const Product = require("../models/product.model");

// GET: danh sách sản phẩm (có phân trang)
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments(),
    ]);

    return res.status(200).json({
      EC: 0,
      EM: "Success",
      DT: {
        data: products,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      EC: 1,
      EM: error.message,
      DT: [],
    });
  }
};

// POST: thêm sản phẩm mới
const createProduct = async (req, res) => {
  try {
    const { name, price, category, image, promotion = 0, views = 0 } = req.body;

    const product = new Product({ name, price, category, image, promotion, views });
    await product.save();

    return res.status(201).json({
      EC: 0,
      EM: "Product created successfully",
      DT: product,
    });
  } catch (error) {
    return res.status(500).json({
      EC: 1,
      EM: error.message,
      DT: null,
    });
  }
};

// GET: tìm kiếm sản phẩm (fuzzy + filter)
const searchProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      promotion,
      sortBy,
      page = 1,
      limit = 6,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // 🔹 Fuzzy search theo tên sản phẩm
    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    // 🔹 Lọc theo category
    if (category) {
      query.category = category;
    }

    // 🔹 Lọc theo giá
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    // 🔹 Lọc theo khuyến mãi (promotion=true)
    if (promotion === "true") {
      query.promotion = { $gte: 1 };
    }

    // 🔹 Sort
    const sortOptions = {
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      views: { views: -1 },
      newest: { createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || {};

    // 🔹 Query DB song song
    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      EC: 0,
      EM: "Success",
      DT: {
        data: products,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      EC: 1,
      EM: error.message,
      DT: [],
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  searchProducts,
};
