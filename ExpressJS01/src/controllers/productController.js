const Product = require("../models/product.model");
const User = require("../models/user");
const esClient = require("../config/elasticsearch");
const ES_INDEX = "products";

const indexProductToES = async (product) => {
  try {
    await esClient.index({
      index: ES_INDEX,
      id: String(product._id),
      document: {
        _id: String(product._id),
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        promotion: product.promotion || 0,
        views: product.views || 0,
        purchasesCount: product.purchasesCount || 0,
        commentsCount: product.commentsCount || 0,
        createdAt: product.createdAt,
      },
    });
  } catch (e) {
    console.error("[ES] index error", e.meta?.body || e.message);
  }
};

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

    // Index to Elasticsearch (best-effort)
    indexProductToES(product);

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

// GET: tìm kiếm sản phẩm (Elasticsearch + filter)
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
    const from = (pageNum - 1) * limitNum;

    // Parse numeric filters safely
    const minPriceNum = minPrice === undefined || minPrice === "" ? undefined : Number(minPrice);
    const maxPriceNum = maxPrice === undefined || maxPrice === "" ? undefined : Number(maxPrice);

    // Build ES query
    const must = [];
    const filter = [];

    if (keyword && keyword.trim()) {
      must.push({
        multi_match: {
          query: keyword,
          fields: ["name^3", "category^1"],
          type: "best_fields",
          fuzziness: "AUTO",
          operator: "and",
        },
      });
    }

    if (category) {
      filter.push({ term: { category } });
    }

    if ((minPriceNum !== undefined && !Number.isNaN(minPriceNum)) || (maxPriceNum !== undefined && !Number.isNaN(maxPriceNum))) {
      const range = {};
      if (minPriceNum !== undefined && !Number.isNaN(minPriceNum)) range.gte = minPriceNum;
      if (maxPriceNum !== undefined && !Number.isNaN(maxPriceNum)) range.lte = maxPriceNum;
      filter.push({ range: { price: range } });
    }

    if (promotion === "true") {
      filter.push({ range: { promotion: { gte: 1 } } });
    }

    const sortMap = {
      priceAsc: [{ price: { order: "asc" } }],
      priceDesc: [{ price: { order: "desc" } }],
      views: [{ views: { order: "desc" } }],
      newest: [{ createdAt: { order: "desc" } }],
      mostPurchased: [{ purchasesCount: { order: "desc" } }],
    };
    const esSort = sortMap[sortBy] || [];

    let esResp;
    try {
      esResp = await esClient.search({
        index: ES_INDEX,
        from,
        size: limitNum,
        sort: esSort,
        query: {
          bool: {
            must: must.length ? must : [{ match_all: {} }],
            filter,
          },
        },
      });
    } catch (e) {
      console.error("[ES] search error:", e.meta?.body || e.message);
      esResp = null;
    }

    const esTotal = esResp?.hits?.total?.value ?? 0;
    if (esResp?.hits && esTotal > 0) {
      const ids = esResp.hits.hits.map((h) => h._id);

      // Apply filters in Mongo to ensure correctness even if ES docs miss fields
      const mongoFilter = { _id: { $in: ids } };
      if (category) mongoFilter.category = category;
      if ((minPriceNum !== undefined && !Number.isNaN(minPriceNum)) || (maxPriceNum !== undefined && !Number.isNaN(maxPriceNum))) {
        mongoFilter.price = {};
        if (minPriceNum !== undefined && !Number.isNaN(minPriceNum)) mongoFilter.price.$gte = minPriceNum;
        if (maxPriceNum !== undefined && !Number.isNaN(maxPriceNum)) mongoFilter.price.$lte = maxPriceNum;
      }
      if (promotion === "true") mongoFilter.promotion = { $gte: 1 };

      let products = await Product.find(mongoFilter);

      // keep ES order
      const orderMap = new Map(ids.map((id, idx) => [String(id), idx]));
      products.sort((a, b) => (orderMap.get(String(a._id)) ?? 0) - (orderMap.get(String(b._id)) ?? 0));

      const total = products.length;
      const sliced = products.slice(0, limitNum);

      return res.status(200).json({
        EC: 0,
        EM: "Success",
        DT: {
          data: sliced,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum) || 0,
        },
      });
    }

    // No hits from ES
    return res.status(200).json({
      EC: 0,
      EM: "Success",
      DT: {
        data: [],
        total: 0,
        page: pageNum,
        totalPages: 0,
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

// GET: chi tiết sản phẩm + tương tự
const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ EC: 1, EM: "Product not found", DT: null });

    // tăng view + lưu recentlyViewed nếu có user
    product.views = (product.views || 0) + 1;
    await product.save();
    // sync ES views
    try { await esClient.update({ index: ES_INDEX, id: String(product._id), doc: { views: product.views } }); } catch {}

    if (req.user?.email) {
      const user = await User.findOne({ email: req.user.email });
      if (user) {
        const pid = product._id.toString();
        const list = (user.recentlyViewed || []).map(id => id.toString()).filter(v => v !== pid);
        list.unshift(pid);
        user.recentlyViewed = list.slice(0, 20); // giữ 20 sp gần nhất
        await user.save();
      }
    }

    // Sản phẩm tương tự: cùng category, ưu tiên nhiều mua, nhiều view
    const similar = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    }).sort({ purchasesCount: -1, views: -1 }).limit(6);

    return res.status(200).json({ EC: 0, EM: "Success", DT: { product, similar } });
  } catch (error) {
    return res.status(500).json({
      EC: 1,
      EM: error.message,
      DT: null,
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  searchProducts,
  getProductDetail,
};
