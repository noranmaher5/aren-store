import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import { getArenCatalogCategory } from '../../config/arenCatalog';
import { useCurrency } from '../../context/CurrencyContext';

const categoryColor = { movies: 'aren-product-red', games: 'aren-product-purple', 'gift-cards': 'aren-product-gold', chatgpt: 'aren-product-green', steam: 'aren-product-blue' };

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isAuthenticated, user, updateUser } = useAuth();
  const { format } = useCurrency();
  const [busy, setBusy] = useState(false);
  const discount = product.discountPercentage || (product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);
  const promotionName = product.promotion?.active && product.promotion?.name?.trim() ? product.promotion.name.trim() : '';
  const wishlisted = !!user?.wishlist?.some?.(item => item?._id === product._id || item === product._id);
  const out = !product.isUnlimited && (Number(product.availableStock ?? product.stock ?? 0) <= 0 || product.isOutOfStock);
  const image = getImageUrl(product.image) || `https://placehold.co/600x420/141414/e9b949?text=${encodeURIComponent(product.name || 'A')}`;
  const catalogCategory = getArenCatalogCategory(product);
  const toggleWishlist = async event => {
    event.preventDefault(); event.stopPropagation();
    if (!isAuthenticated) return toast.error('سجّل الدخول لاستخدام المفضلة');
    setBusy(true);
    try { const response = await authAPI.toggleWishlist(product._id); updateUser({ wishlist: response.data.wishlist }); toast.success(response.data.inWishlist ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة'); }
    catch (error) { toast.error(error.response?.data?.message || 'تعذر تحديث المفضلة'); }
    finally { setBusy(false); }
  };
  return <article className={`aren-product-card ${categoryColor[product.category] || ''}`}>
    <Link to={`/products/${product._id}`} className="aren-product-image"><img src={image} alt={product.name} onError={event => { event.currentTarget.src = `https://placehold.co/600x420/141414/e9b949?text=${encodeURIComponent(product.name?.[0] || '?')}`; }} /><span className="aren-product-glow" />{discount > 0 && <b className="aren-discount">-{discount}%</b>}<button className={`aren-wishlist ${wishlisted ? 'selected' : ''}`} onClick={toggleWishlist} disabled={busy} aria-label="Wishlist">{wishlisted ? '♥' : '♡'}</button></Link>
    <div className="aren-product-body"><span className="aren-product-label">{promotionName || catalogCategory?.shortName || 'منتج رقمي'}</span><Link to={`/products/${product._id}`} className="aren-product-name">{product.name}</Link><div className="aren-rating"><span>★★★★★</span><small>{Number(product.rating?.average || 0).toFixed(1)} ({product.rating?.count || 0})</small></div><div className="aren-product-bottom"><div><strong>{format(product.price || 0)}</strong>{product.originalPrice > product.price && <del>{format(product.originalPrice)}</del>}</div><button className="aren-add-button" disabled={out} onClick={() => addItem(product)}>{out ? 'نفد المخزون' : 'أضف +'}</button></div></div>
  </article>;
}
