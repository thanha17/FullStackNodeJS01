// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { List, Card, Spin, notification, Input, Select, Button } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { getProductsApi, searchProductsApi } from "../util/api";

const { Search } = Input;
const { Option } = Select;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 🔍 State tìm kiếm + filter
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [promotion, setPromotion] = useState(""); // "" | "true" | "false"
  const [sortBy, setSortBy] = useState("");

  // 🔹 Hàm fetch sản phẩm
  const fetchProducts = async (pageNumber, replace = false) => {
    try {
      let res;

      if (keyword || category || priceRange || promotion || sortBy) {
        const [minPrice, maxPrice] = priceRange
          ? priceRange.split("-")
          : ["", ""];
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
        console.log(res,"page",page)
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
  // 🔹 Lazy load & tự động fetch khi filter/search thay đổi
  useEffect(() => {
    // if(page === 1) fetchProducts(page, true);
    // else 
      fetchProducts(page);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, category, priceRange, promotion, sortBy]);

  // 🔹 Scroll load more
  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  // 🔹 Reset state khi search/filter → page sẽ tự trigger fetchProducts
  const handleSearch = () => {
    setProducts([]);
    setHasMore(true);
    setPage(1);
    fetchProducts(1, true); // replace = true để không append cũ
  };

  return (
    <div style={{ padding: 20, overflowX: "hidden" }}>
      <h2>Danh sách sản phẩm</h2>

      {/* 🔍 Search + filter */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}
      >
        <Search
          placeholder="Tìm sản phẩm..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton
          style={{ width: 250 }}
        />

        <Select
          placeholder="Danh mục"
          value={category || undefined}
          onChange={(val) => setCategory(val)}
          style={{ width: 150 }}
        >
          <Option value="">Tất cả</Option>
          <Option value="Nước hoa">Nước hoa</Option>
          <Option value="laptop">Laptop</Option>
          <Option value="accessory">Phụ kiện</Option>
        </Select>

        <Select
          placeholder="Khoảng giá"
          value={priceRange || undefined}
          onChange={(val) => setPriceRange(val)}
          style={{ width: 150 }}
        >
          <Option value="">Tất cả</Option>
          <Option value="0-1000000">0 - 1.000.000₫</Option>
          <Option value="1000000-5000000">1.000.000 - 5.000.000₫</Option>
          <Option value="5000000-10000000">5.000.000 - 10.000.000₫</Option>
        </Select>

        <Select
          placeholder="Khuyến mãi"
          value={promotion || undefined}
          onChange={(val) => setPromotion(val)}
          style={{ width: 120 }}
        >
          <Option value="">Tất cả</Option>
          <Option value="true">Có KM</Option>
          <Option value="false">Không KM</Option>
        </Select>

        <Select
          placeholder="Sắp xếp"
          value={sortBy || undefined}
          onChange={(val) => setSortBy(val)}
          style={{ width: 150 }}
        >
          <Option value="">Mặc định</Option>
          <Option value="priceAsc">Giá tăng dần</Option>
          <Option value="priceDesc">Giá giảm dần</Option>
          <Option value="views">Lượt xem</Option>
        </Select>

        <Button type="primary" onClick={handleSearch}>
          Lọc
        </Button>
      </div>

      {/* 🔹 Lazy load products */}
      <InfiniteScroll
        dataLength={products.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<Spin />}
        endMessage={<p style={{ textAlign: "center" }}>Hết sản phẩm</p>}
        style={{ overflow: "hidden" }}
      >
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={products}
          renderItem={(item) => (
            <List.Item>
              <Card
                cover={
                  <img
                    alt={item.name}
                    src={item.image || "https://via.placeholder.com/150"}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                }
              >
                <Card.Meta
                  title={item.name}
                  description={`Giá: ${item.price}₫`}
                />
              </Card>
            </List.Item>
          )}
        />
      </InfiniteScroll>
    </div>
  );
};

export default HomePage;
