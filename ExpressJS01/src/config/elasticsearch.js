// src/config/elasticsearch.js
const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({
  node: "http://localhost:9200", // URL Elasticsearch
});

module.exports = esClient;
