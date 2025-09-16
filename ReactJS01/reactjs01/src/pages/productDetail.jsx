import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, List, Button, Input, Rate, notification } from "antd";
import { getFavoritesApi, addFavoriteApi, removeFavoriteApi } from "../util/api";
import axios from "../util/axios.customize";
import styles from "./productDetail.module.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [comments, setComments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [rating, setRating] = useState(5);

  const loadDetail = async () => {
    try {
      const res = await axios.get(`/v1/api/products/${id}`);
      if (res && res.EC === 0) {
        setProduct(res.DT.product);
        setSimilar(res.DT.similar || []);
      }
    } catch (e) {
      notification.error({ message: "DETAIL", description: e.message });
    }
  };

  const loadComments = async () => {
    try {
      const res = await axios.get(`/v1/api/products/${id}/comments`);
      if (res && res.EC === 0) setComments(res.DT || []);
    } catch (e) {
      // ignore
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await getFavoritesApi();
      if (res && res.EC === 0) setFavorites((res.DT || []).map((p) => p._id || p));
    } catch {}
  };

  useEffect(() => {
    loadDetail();
    loadComments();
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isFavorite = (pid) => favorites.includes(pid);
  const toggleFavorite = async (pid) => {
    try {
      if (isFavorite(pid)) {
        await removeFavoriteApi(pid);
        setFavorites((prev) => prev.filter((x) => x !== pid));
      } else {
        await addFavoriteApi(pid);
        setFavorites((prev) => [...prev, pid]);
      }
    } catch (e) {
      notification.error({ message: "FAVORITE", description: e?.response?.data?.EM || e.message });
    }
  };

  const handleBuy = async () => {
    try {
      if (!product?._id) return;
      const res = await axios.post(`/v1/api/orders`, { items: [{ product: product._id, quantity: 1 }] });
      if (res && res.EC === 0) {
        notification.success({ message: "Đặt hàng thành công" });
        await loadDetail();
      }
    } catch (e) {
      notification.error({ message: "ORDER", description: e?.response?.data?.EM || e.message });
    }
  };

  const handleAddComment = async () => {
    try {
      const content = commentContent.trim();
      if (!content) return;
      const res = await axios.post(`/v1/api/products/${id}/comments`, { productId: id, content, rating });
      if (res && res.EC === 0) {
        setCommentContent("");
        setRating(5);
        await loadComments();
        await loadDetail();
      }
    } catch (e) {
      notification.error({ message: "COMMENT", description: e?.response?.data?.EM || e.message });
    }
  };

  if (!product) return <div className={styles.wrapper}>Loading...</div>;

  const pid = product._id || product.id;

  return (
    <div className={styles.wrapper}>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => navigate(-1)}>← Quay lại</Button>
      </div>
      <div className={styles.hero}>
        <img src={product.image || "https://via.placeholder.com/300"} alt={product.name} className={styles.cover} />
        <div style={{ flex: 1 }}>
          <h2 className={styles.metaTitle}>{product.name}</h2>
          <p>Giá: {product.price}₫</p>
          <p>Danh mục: {product.category}</p>
          <p>Khuyến mãi: {product.promotion || 0}%</p>
          <p>Lượt xem: {product.views || 0}</p>
          <p>Lượt mua: {product.purchasesCount || 0}</p>
          <p>Lượt bình luận: {product.commentsCount || 0}</p>
          <div className={styles.actions}>
            <Button type="primary" onClick={handleBuy}>Mua ngay</Button>
            <Button onClick={() => toggleFavorite(pid)}>{isFavorite(pid) ? "💖 Bỏ thích" : "🤍 Yêu thích"}</Button>
          </div>
        </div>
      </div>

      <h3>Sản phẩm tương tự</h3>
      <List grid={{ gutter: 16, column: 4 }} dataSource={similar} renderItem={(item) => (
        <List.Item>
          <Card onClick={() => navigate(`/product/${item._id}`)} hoverable cover={<img alt={item.name} src={item.image || "https://via.placeholder.com/150"} style={{ height: 160, objectFit: "cover" }} /> }>
            <Card.Meta title={item.name} description={`Giá: ${item.price}₫`} />
          </Card>
        </List.Item>
      )} className={styles.similarGrid} />

      <h3 style={{ marginTop: 24 }}>Bình luận</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Input.TextArea rows={2} value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="Ý kiến của bạn" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Rate value={rating} onChange={setRating} />
          <Button type="primary" onClick={handleAddComment}>Gửi</Button>
        </div>
      </div>
      <List dataSource={comments} renderItem={(c) => (
        <List.Item>
          <List.Item.Meta title={`${c.userEmail} - ${new Date(c.createdAt).toLocaleString()}`} description={<div>
            <div><Rate disabled value={c.rating} /></div>
            <div>{c.content}</div>
          </div>} />
        </List.Item>
      )} />
    </div>
  );
};

export default ProductDetailPage;
