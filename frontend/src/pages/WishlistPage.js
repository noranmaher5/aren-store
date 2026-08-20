import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_BACKEND_ORIGIN ||
  'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return `https://placehold.co/400x300/090B10/6366F1?text=No+Image`;
  if (img.startsWith('http')) return img;
  return `${API_ORIGIN}${img}`;
};

export default function WishlistPage() {
  const { isAuthenticated, loading } = useAuth();
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [wishlist, setWishlist] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) {
        setPageLoading(false);
        return;
      }
      try {
        const res = await authAPI.getWishlist();
        setWishlist(res.data.wishlist || []);
      } catch {
      toast.error('تعذر تحميل المفضلة');
      } finally {
        setPageLoading(false);
      }
    };
    if (!loading) load();
  }, [isAuthenticated, loading]);

  const removeItem = async (productId) => {
    try {
      const res = await authAPI.toggleWishlist(productId);
      setWishlist(res.data.wishlist || []);
      toast.success('تمت الإزالة من المفضلة');
    } catch {
      toast.error('تعذر تحديث المفضلة');
    }
  };

  if (loading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#08090D', color: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        جارٍ التحميل...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#08090D', color: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 800 }}>المفضلة</h1>
        <p style={{ color: '#94A3B8' }}>سجّل الدخول لعرض منتجاتك المحفوظة.</p>
        <Link to="/login" style={{ background: '#6366F1', color: '#fff', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>تسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="aren-wishlist-shell" style={{ minHeight: '100vh', background: '#08090D', paddingTop: 96, paddingBottom: 64, color: '#F8FAFC' }}>
      <div className="aren-wishlist-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div className="aren-wishlist-heading" style={{ marginBottom: 28 }}>
          <p style={{ color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: 12, fontWeight: 700, margin: 0 }}>المنتجات المحفوظة</p>
          <h1 style={{ fontSize: 36, margin: '8px 0 0', fontWeight: 900, color: '#FFFFFF' }}>قائمة المفضلة</h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="aren-wishlist-empty" style={{ padding: '64px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, background: '#0F131F' }}>
            <h2 style={{ margin: '0 0 8px', color: '#FFFFFF' }}>لا توجد منتجات محفوظة حتى الآن</h2>
            <p style={{ margin: 0, color: '#94A3B8' }}>Tap the heart on any product to save it here for later.</p>
            <Link to="/products" style={{ display: 'inline-block', marginTop: 20, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700 }}>Browse Store</Link>
          </div>
        ) : (
          <div className="aren-wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {wishlist.map((product) => (
              <div key={product._id} className="aren-wishlist-card" style={{ background: '#0F131F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
                <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <img className="aren-wishlist-image" src={getImageUrl(product.image)} alt={product.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  <div className="aren-wishlist-content" style={{ padding: 16 }}>
                    <div style={{ color: '#06B6D4', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>{product.category}</div>
                    <h3 style={{ margin: '8px 0', fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{product.name}</h3>
                    <div style={{ color: '#818CF8', fontWeight: 900, fontSize: 18 }}>{format(product.price || 0)}</div>
                  </div>
                </Link>
                <div className="aren-wishlist-actions" style={{ padding: '0 16px 16px' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => addItem(product)}
                      className="aren-wishlist-add"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(99,102,241,0.3)',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      أضف إلى السلة
                    </button>
                    <button className="aren-wishlist-remove" onClick={() => removeItem(product._id)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.1)', color: '#F87171', fontWeight: 700, cursor: 'pointer' }}>
                      إزالة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
