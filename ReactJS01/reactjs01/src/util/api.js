// src/util/api.js
import axios from "./axios.customize";

// ===== AUTH =====
const createUserApi = (name, email, password) => {
  const URL_API = "/v1/api/register";
  const data = { name, email, password };
  return axios.post(URL_API, data);
};

const loginApi = (email, password) => {
  const URL_API = "/v1/api/login";
  const data = { email, password };
  return axios.post(URL_API, data);
};

const getUserApi = () => {
  const URL_API = "/v1/api/user";
  return axios.get(URL_API);
};

const getAccountApi = () => {
  const URL_API = "/v1/api/account";
  return axios.get(URL_API);
};

// ===== PRODUCT =====
// 1. Lấy danh sách sản phẩm (chỉ phân trang, không filter nâng cao)
const getProductsApi = (page = 1, limit = 6) => {
  const URL_API = `/v1/api/products?page=${page}&limit=${limit}`;
  return axios.get(URL_API);
};

// 2. Search + filter (fuzzy, category, price, promotion, sort)
const searchProductsApi = ({
  keyword = "",
  category = "",
  minPrice = "",
  maxPrice = "",
  promotion = "",
  sortBy = "",
  page = 1,
  limit = 6,
}) => {
  const query = new URLSearchParams();

  query.append("page", page);
  query.append("limit", limit);

  if (keyword) query.append("keyword", keyword);
  if (category) query.append("category", category);
  if (minPrice) query.append("minPrice", minPrice);
  if (maxPrice) query.append("maxPrice", maxPrice);
  if (promotion) query.append("promotion", promotion);
  if (sortBy) query.append("sortBy", sortBy);

  const URL_API = `/v1/api/products/search?${query.toString()}`;
  return axios.get(URL_API);
};

// ===== FAVORITES =====
const getFavoritesApi = () => axios.get(`/v1/api/favorites`);
const addFavoriteApi = (productId) => axios.post(`/v1/api/favorites`, { productId });
const removeFavoriteApi = (productId) => axios.delete(`/v1/api/favorites/${productId}`);

// ===== CART =====
const getCartApi = () => axios.get(`/v1/api/cart`);
const addToCartApi = (productId, quantity = 1) => axios.post(`/v1/api/cart/items`, { productId, quantity });
const updateCartItemApi = (productId, quantity) => axios.put(`/v1/api/cart/items`, { productId, quantity });
const removeCartItemApi = (productId) => axios.delete(`/v1/api/cart/items/${productId}`);

export {
  createUserApi,
  loginApi,
  getUserApi,
  getAccountApi,
  getProductsApi,      // danh sách cơ bản
  searchProductsApi,   // tìm kiếm nâng cao
  getFavoritesApi,
  addFavoriteApi,
  removeFavoriteApi,
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
};
