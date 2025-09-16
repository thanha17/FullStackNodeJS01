require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product.model");
const esClient = require("../config/elasticsearch");
const connection = require("../config/database");

const ES_INDEX = "products";

(async () => {
  try {
    await connection();
    console.log("Connected MongoDB");

    // Ensure index exists with simple mapping
    try {
      const exists = await esClient.indices.exists({ index: ES_INDEX });
      if (!exists) {
        await esClient.indices.create({
          index: ES_INDEX,
          settings: {
            analysis: { analyzer: { default: { type: "standard" } } },
          },
          mappings: {
            properties: {
              name: { type: "text" },
              category: { type: "keyword" },
              price: { type: "float" },
              image: { type: "keyword" },
              promotion: { type: "integer" },
              views: { type: "integer" },
              purchasesCount: { type: "integer" },
              commentsCount: { type: "integer" },
              createdAt: { type: "date" },
            },
          },
        });
        console.log("Created ES index:", ES_INDEX);
      }
    } catch (e) {
      console.log("[ES] index create/exist error", e.meta?.body || e.message);
    }

    const cursor = Product.find().cursor();
    let count = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      try {
        await esClient.index({
          index: ES_INDEX,
          id: String(doc._id), // dùng làm id của ES document
          document: {
            // ❌ bỏ _id ở đây, không được đưa vào document
            name: doc.name,
            category: doc.category,
            price: doc.price,
            image: doc.image,
            promotion: doc.promotion || 0,
            views: doc.views || 0,
            purchasesCount: doc.purchasesCount || 0,
            commentsCount: doc.commentsCount || 0,
            createdAt: doc.createdAt,
          },
          refresh: false,
        });
        count++;
        if (count % 50 === 0) console.log(`Indexed ${count} products...`);
      } catch (e) {
        console.log("[ES] index doc error", e.meta?.body || e.message);
      }
    }

    await esClient.indices.refresh({ index: ES_INDEX });
    console.log(`Done. Indexed ${count} products.`);
  } catch (e) {
    console.error("Reindex error:", e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
