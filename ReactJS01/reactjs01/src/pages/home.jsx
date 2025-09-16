// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  List,
  Card,
  Spin,
  notification,
  Input,
  Select,
  Button,
  Badge,
} from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  getProductsApi,
  searchProductsApi,
  getFavoritesApi,
  addFavoriteApi,
  removeFavoriteApi,
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
} from "../util/api";
import { useNavigate } from "react-router-dom";
import axios from "../util/axios.customize";
import styles from "./home.module.css";
import { Modal } from "cart-library-thanha17";

const { Search } = Input;
const { Option } = Select;

// 🔑 đổi cờ này:
// true  => auto load khi chọn filter
// false => chỉ load khi bấm nút "Lọc"
const autoSearchOnChange = false;

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 🔍 Filter state
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [promotion, setPromotion] = useState("");
  const [sortBy, setSortBy] = useState("");

  // 🛒 Cart state
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ❤️ Favorites
  const [favorites, setFavorites] = useState([]);

  // 👀 Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Dedup key
  const lastFetchKeyRef = useRef("");

  // Fetch sản phẩm
  const fetchProducts = async (pageNumber, replace = false) => {
    try {
      let res;
      if (keyword || category || priceRange || promotion || sortBy) {
        const [minPrice, maxPrice] = priceRange ? priceRange.split("-") : ["", ""];
        res = await searchProductsApi({
          page: pageNumber,
          limit: 6,
          keyword,
          category,
          minPrice,
          maxPrice,
          promotion,
          sortBy,
        });
      } else {
        res = await getProductsApi(pageNumber, 6);
      }

      if (res && res.EC === 0) {
        const data = res.DT?.data || [];
        if (data.length === 0) {
          setHasMore(false);
          return;
        }
        setProducts((prev) => (replace ? data : [...prev, ...data]));
      } else {
        notification.error({
          message: "LOAD PRODUCTS",
          description: res?.EM || "Lỗi khi tải sản phẩm",
        });
        setHasMore(false);
      }
    } catch (err) {
      notification.error({
        message: "LOAD PRODUCTS",
        description: err.message || "Có lỗi xảy ra",
      });
      setHasMore(false);
    }
  };

  // Favorites
  const fetchFavorites = async () => {
    try {
      const res = await getFavoritesApi();
      if (res && res.EC === 0) {
        setFavorites((res.DT || []).map((p) => p._id || p));
      }
    } catch {}
  };

  // Recently viewed (placeholder)
  const fetchRecentlyViewed = async () => {
    try {
      const resAcc = await axios.get(`/v1/api/account`);
      if (!resAcc?.email) return;
      // TODO: endpoint lấy sản phẩm đã xem
    } catch {}
  };

  // Cart
  const fetchCart = async () => {
    try {
      const res = await getCartApi();
      if (res && res.EC === 0) {
        const items = (res.DT.items || []).map((it) => ({
          id: it.product?._id || it.product,
          name: it.product?.name || "",
          price: it.product?.price || 0,
          quantity: it.quantity || 1,
        }));
        setCartItems(items);
      }
    } catch {}
  };

  useEffect(() => {
    // 👇 Fetch lần đầu khi vào trang
    fetchProducts(1, true);
  }, []);

  // Auto fetch products khi page/filter thay đổi (nếu autoSearchOnChange = true)
  useEffect(() => {
    if (!autoSearchOnChange) return;
    const key = `${page}|${keyword}|${category}|${priceRange}|${promotion}|${sortBy}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;

    const shouldReplace = page === 1;
    fetchProducts(page, shouldReplace);
  }, [page, keyword, category, priceRange, promotion, sortBy]);

  // Fetch favorites + recently viewed khi vào page
  useEffect(() => {
    fetchFavorites();
    fetchRecentlyViewed();
  }, []);

  const loadMore = () => setPage((prev) => prev + 1);

  // Khi bấm "Lọc"
  const handleSearch = () => {
    lastFetchKeyRef.current = "";
    setProducts([]);
    setHasMore(true);
    setPage(1);

    // Nếu chế độ bấm nút => gọi fetchProducts thủ công
    if (!autoSearchOnChange) {
      fetchProducts(1, true);
    }
  };

  // Cart handlers
  const handleAddToCart = async (product) => {
    try {
      const pid = product._id || product.id;
      await addToCartApi(pid, 1);
      await fetchCart();
    } catch (e) {
      notification.error({ message: "CART", description: e?.response?.data?.EM || e.message });
    }
  };

  const handleUpdateQuantity = async (id, quantity) => {
    try {
      await updateCartItemApi(id, quantity);
      await fetchCart();
    } catch (e) {
      notification.error({ message: "CART", description: e?.response?.data?.EM || e.message });
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await removeCartItemApi(id);
      await fetchCart();
    } catch (e) {
      notification.error({ message: "CART", description: e?.response?.data?.EM || e.message });
    }
  };

  // Favorites toggle
  const isFavorite = (productId) => favorites.includes(productId);
  const toggleFavorite = async (product) => {
    try {
      const pid = product._id || product.id;
      if (!pid) return;
      if (isFavorite(pid)) {
        await removeFavoriteApi(pid);
        setFavorites((prev) => prev.filter((id) => id !== pid));
      } else {
        await addFavoriteApi(pid);
        setFavorites((prev) => [...prev, pid]);
      }
    } catch (e) {
      notification.error({ message: "FAVORITE", description: e?.response?.data?.EM || e.message });
    }
  };

  const totalAmount = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return (
    <div className={styles.container}>
      <h2>Danh sách sản phẩm</h2>

      {/* Toolbar filter */}
      <div className={styles.toolbar} style={{ position: "fixed", top: 46, left: 0, right: 0, zIndex: 1000, display: "flex", alignItems: "center", gap: 10, padding: "10px 20px" }}>
        <Search
          placeholder="Tìm sản phẩm..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton
          style={{ width: 250 }}
        />

        <Select placeholder="Danh mục" value={category || undefined} onChange={(val) => { setCategory(val); if (autoSearchOnChange) handleSearch(); }} style={{ width: 150 }}>
          <Option value="">Tất cả</Option>
          <Option value="Nước hoa">Nước hoa</Option>
          <Option value="laptop">Laptop</Option>
          <Option value="accessory">Phụ kiện</Option>
        </Select>

        <Select placeholder="Khoảng giá" value={priceRange || undefined} onChange={(val) => { setPriceRange(val); if (autoSearchOnChange) handleSearch(); }} style={{ width: 150 }}>
          <Option value="">Tất cả</Option>
          <Option value="0-1000000">0 - 1.000.000₫</Option>
          <Option value="1000000-10000000">1.000.000 - 10.000.000₫</Option>
          <Option value="10000000-100000000">10.000.000 - 100.000.000₫</Option>
        </Select>

        <Select placeholder="Khuyến mãi" value={promotion || undefined} onChange={(val) => { setPromotion(val); if (autoSearchOnChange) handleSearch(); }} style={{ width: 120 }}>
          <Option value="">Tất cả</Option>
          <Option value="true">Có KM</Option>
          <Option value="false">Không KM</Option>
        </Select>

        <Select placeholder="Sắp xếp" value={sortBy || undefined} onChange={(val) => { setSortBy(val); if (autoSearchOnChange) handleSearch(); }} style={{ width: 150 }}>
          <Option value="">Mặc định</Option>
          <Option value="priceAsc">Giá tăng dần</Option>
          <Option value="priceDesc">Giá giảm dần</Option>
          <Option value="views">Lượt xem</Option>
          <Option value="mostPurchased">Mua nhiều</Option>
        </Select>

        {!autoSearchOnChange && (
          <Button type="primary" onClick={handleSearch}>Lọc</Button>
        )}

        {/* Cart */}
        <div style={{ marginLeft: "auto", cursor: "pointer" }} onClick={async () => { setIsCartOpen(true); await fetchCart(); }}>
          <Badge count={cartItems.reduce((sum, i) => sum + i.quantity, 0)} size="small">
            <ShoppingCartOutlined style={{ fontSize: 28 }} />
          </Badge>
        </div>
      </div>

      {/* Product list */}
      <div style={{ paddingTop: 120 }}>
        <InfiniteScroll
          dataLength={products.length}
          next={loadMore}
          hasMore={hasMore}
          loader={<Spin />}
          endMessage={<p style={{ textAlign: "center" }}>Hết sản phẩm</p>}
          style={{ overflow: "hidden" }}
        >
          <List
            className={styles.grid}
            grid={{ gutter: 16, column: 3 }}
            dataSource={products}
            renderItem={(item) => (
              <List.Item>
                <Card
                  className={styles.clickableCard}
                  onClick={() => navigate(`/product/${item._id || item.id}`)}
                  cover={<img alt={item.name} src={item.image || "https://via.placeholder.com/150"} className={styles.image} />}
                  actions={[
                    <Button type="primary" onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}>Thêm vào giỏ</Button>,
                    <Button onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}>
                      {isFavorite(item._id || item.id) ? "💖 Bỏ thích" : "🤍 Yêu thích"}
                    </Button>,
                  ]}
                >
                  <Card.Meta title={item.name} description={`Giá: ${item.price}₫`} />
                  <div className={styles.counts}>
                    <span>🛒 {item.purchasesCount || 0}</span>
                    <span>💬 {item.commentsCount || 0}</span>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </InfiniteScroll>
      </div>

      {/* Cart modal */}
      <Modal open={isCartOpen} onClose={() => setIsCartOpen(false)}>
        <h3 className="mb-4 font-bold text-lg">🛒 Giỏ hàng</h3>
        <div className={styles.cartContent}>
          <List
            dataSource={cartItems}
            locale={{ emptyText: "Giỏ hàng trống" }}
            renderItem={(it) => (
              <List.Item
                actions={[
                  <Button size="small" onClick={() => handleUpdateQuantity(it.id, Math.max(0, it.quantity - 1))}>-</Button>,
                  <span style={{ padding: "0 8px" }}>{it.quantity}</span>,
                  <Button size="small" onClick={() => handleUpdateQuantity(it.id, it.quantity + 1)}>+</Button>,
                  <Button danger size="small" onClick={() => handleRemoveItem(it.id)}>Xoá</Button>,
                ]}
              >
                <List.Item.Meta title={it.name} description={`Giá: ${it.price}₫`} />
                <div style={{ fontWeight: 600 }}>{(it.price * it.quantity).toLocaleString()}₫</div>
              </List.Item>
            )}
          />
          <div className={styles.cartTotal}>
            <div>Tổng:</div>
            <div>{totalAmount.toLocaleString()}₫</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
