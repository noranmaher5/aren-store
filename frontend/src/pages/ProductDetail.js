import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, authAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import userDefaultAvatar from '../assets/user.png';
import { getArenCatalogCategory } from '../config/arenCatalog';
import { useCurrency } from '../context/CurrencyContext';
import Seo, { DEFAULT_DESCRIPTION, getSiteUrl } from '../components/common/Seo';

const getEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_BACKEND_ORIGIN ||
  'http://localhost:5000';

const StarRating = ({ value = 0, size = 14, color = '#818CF8' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} style={{ fontSize: size, lineHeight: 1, color: star <= Math.round(value) ? color : 'rgba(255,255,255,0.18)' }}>★</span>
    ))}
  </div>
);

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const categoryLabels = { movies: 'الأفلام والترفيه', discord: 'التواصل والتطبيقات', chatgpt: 'التصميم والإنتاجية والذكاء الاصطناعي' };

const STYLES = `
  .pd-root { background: #030405; min-height: 100vh; font-family: 'Cairo', sans-serif; color: #f5f5f3; }
  .pd-glass { background: linear-gradient(145deg, #131516, #090a0b); border: 1px solid rgba(255,255,255,.1); border-radius: 13px; }
  .pd-page-shell { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
  .pd-main-grid { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(0, .96fr); gap: 42px; align-items: start; }
  .pd-badge { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: .04em; }
  .pd-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #6366F1; color: #fff; border: 0; border-radius: 7px; padding: 13px 24px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all .2s; text-decoration: none; }
  .pd-btn-primary:hover { background: #818CF8; transform: translateY(-2px); }
  .pd-btn-primary:disabled { opacity: .45; cursor: not-allowed; transform: none; }
  .pd-qty-btn { width: 38px; height: 40px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #9d9e9b; font-size: 20px; cursor: pointer; }
  .pd-qty-btn:hover { color: #818CF8; }
  .pd-thumb-btn { flex-shrink: 0; width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); cursor: pointer; background: #101214; padding: 0; opacity: .65; transition: .2s; }
  .pd-thumb-btn:hover, .pd-thumb-btn.active { border-color: #6366F1; opacity: 1; }
  .pd-review-item { display: flex; gap: 14px; padding: 16px; background: #0e1011; border-radius: 10px; border: 1px solid rgba(255,255,255,.08); position: relative; }
  .pd-avatar { width: 38px; height: 38px; border-radius: 50%; background: #17191a; display: flex; align-items: center; justify-content: center; color: #818CF8; font-weight: 700; }
  .pd-main-image { box-shadow: 0 18px 45px rgba(0,0,0,.35); }
  .pd-main-image img { transition: transform .45s ease; }
  .pd-main-image:hover img { transform: scale(1.025); }

  .pd-review-dots-btn {
    background: none; border: none; cursor: pointer; padding: 4px 6px;
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.25); transition: all 0.2s;
  }
  .pd-review-dots-btn:hover { background: rgba(99,102,241,.12); color: #818CF8; }

  .pd-review-menu {
    position: absolute; right: 12px; top: 38px;
    background: #131517; border: 1px solid rgba(255,255,255,.12);
    border-radius: 10px; z-index: 50; overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6); min-width: 150px;
  }
  .pd-review-menu-item {
    width: 100%; padding: 10px 14px; border: none; background: none;
    color: #818CF8; font-size: 12px; font-weight: 600; text-align: left;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: background 0.15s;
  }
  .pd-review-menu-item:hover { background: rgba(99,102,241,.12); }

  .swal2-popup.pd-swal-custom { border: 1px solid rgba(99,102,241,.35) !important; border-radius: 16px !important; padding: 20px !important; }
  .pd-info-grid { display: grid; grid-template-columns: 1fr; gap: 15px; text-align: left; }
  .pd-info-video-container { position: relative; width: 100%; padding-top: 56.25%; border-radius: 15px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-top: 10px; }
  .pd-info-video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

  @media (max-width: 1024px) { .pd-main-grid { gap: 36px; } }
  @media (max-width: 768px) {
    .pd-page-shell { padding: 0 16px; }
    .pd-main-grid { grid-template-columns: 1fr; gap: 28px; }
    .pd-root { padding-top: 72px !important; padding-bottom: 44px !important; }
    .pd-main-title { font-size: 30px !important; margin-top: 10px !important; }
    .pd-price { font-size: 38px !important; }
    .pd-actions-row { flex-direction: column; gap: 12px !important; }
    .pd-qty-box, .pd-btn-primary, .pd-wishlist-btn { width: 100%; }
    .pd-qty-box { justify-content: center; }
    .pd-review-shell { margin-top: 36px !important; padding: 22px 18px !important; }
    .pd-review-header { font-size: 22px !important; margin-bottom: 20px !important; }
  }
  @media (max-width: 480px) {
    .pd-page-shell { padding: 0 12px; }
    .pd-root { padding-top: 66px !important; }
    .pd-main-image { aspect-ratio: 1 / 1; border-radius: 18px !important; }
    .pd-thumb-btn { width: 54px; height: 54px; }
    .pd-price { font-size: 32px !important; }
    .pd-review-item { padding: 14px; }
  }
`;

export default function ProductDetail() {
  const { format } = useCurrency();
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);

  const isAdmin = user && ['admin', 'owner', 'hidden', 'manager', 'editor'].includes(user.role);
  const catalogCategory = getArenCatalogCategory(product);

  useEffect(() => {
    productAPI.getOne(id)
      .then(res => { setProduct(res.data.product); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const loadWishlistState = async () => {
      if (!isAuthenticated || !product?._id) { setInWishlist(false); return; }
      try {
        const res = await authAPI.getWishlist();
        setInWishlist((res.data.wishlist || []).some(item => item._id === product._id));
      } catch { setInWishlist(false); }
    };
    loadWishlistState();
  }, [isAuthenticated, product?._id]);

  const getImageUrl = (img) => {
    if (!img) return `https://placehold.co/600x600/141414/818CF8?text=${encodeURIComponent('لا توجد صورة')}`;
    if (img.startsWith('http')) return img;
    return `${API_ORIGIN}${img}`;
  };

const handleAddToCart = async () => {
  if (!product) return;

  if (!product.isUnlimited && !product.availableStock) {
    toast.error('المنتج غير متوفر حالياً', { id: 'cart-status' });
    return;
  }

  await addItem(product, quantity);
};

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) return toast.error('سجّل الدخول لاستخدام المفضلة');
    if (!product?._id) return;
    setWishlistLoading(true);
    try {
      const res = await authAPI.toggleWishlist(product._id);
      setInWishlist(res.data.inWishlist);
      toast.success(res.data.inWishlist ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث المفضلة');
    } finally { setWishlistLoading(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('سجّل الدخول لكتابة تقييم');
    setSubmitting(true);
    try {
      await productAPI.addReview(product._id, review);
      toast.success('تم إرسال التقييم بنجاح');
      const res = await productAPI.getOne(id);
      setProduct(res.data.product);
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر إرسال التقييم');
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await productAPI.deleteReview(product._id, reviewId);
      toast.success('تم حذف التقييم');
      setProduct(prev => ({ ...prev, reviews: prev.reviews.filter(r => r._id !== reviewId) }));
      setActiveMenu(null);
    } catch { toast.error('تعذر حذف التقييم'); }
  };

  const handleInfoClick = () => {
    if (!product) return;
    const currentImageUrl = getImageUrl(images[activeImg]);
    const embedUrl = getEmbedUrl(product.youtubeUrl);
    Swal.fire({
      title: `<span style="font-family:'Manrope'; font-weight:800; color:#f5f4ef;">تفاصيل المنتج</span>`,
      background: '#0e1011', showCloseButton: true, showConfirmButton: false,
      width: '700px', customClass: { popup: 'pd-swal-custom' },
      html: `
        <div class="pd-info-grid">
          <div style="display:flex;gap:20px;align-items:start;">
            <img src="${currentImageUrl}" style="width:150px;height:150px;object-fit:cover;border-radius:10px;border:1px solid rgba(99,102,241,.35);" />
            <div style="flex:1;">
              <h3 style="margin:0 0 8px 0;color:#818CF8;font-family:'Manrope';font-size:22px;">${product.name}</h3>
              <div style="margin-bottom:10px;"><span style="background:rgba(99,102,241,.14);color:#818CF8;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;">${categoryLabels[product.category] || 'التصنيف'}</span></div>
              <p style="color:rgba(232,240,224,0.7);font-size:14px;line-height:1.5;margin:0;">${product.description}</p>
            </div>
          </div>
          ${product.extraInfo ? `<div style="background:rgba(99,102,241,.06);padding:15px;border-radius:10px;border-left:3px solid #6366F1;"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);font-style:italic;">"${product.extraInfo}"</p></div>` : ''}
          ${embedUrl ? `<div style="margin-top:15px;border-top:1px solid rgba(255,255,255,0.1);padding-top:15px;"><h4 style="margin:0 0 12px 0;font-size:16px;color:#E8EAED;font-family:'Rajdhani';letter-spacing:1px;">معاينة الفيديو</h4><div class="pd-info-video-container"><iframe src="${embedUrl}?autoplay=1&mute=1" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>` : ''}
        </div>`
    });
  };

  if (loading) return <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جارٍ تحميل المنتج...</div>;
  if (!product) {
    return (
      <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Seo title="المنتج غير موجود" description={DEFAULT_DESCRIPTION} path={`/products/${id}`} noindex />
        المنتج غير موجود
      </div>
    );
  }

  const productDescription = String(product.shortDescription || product.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160) || DEFAULT_DESCRIPTION;
  const productImage = getImageUrl(product.image);
  const productUrl = `/products/${product._id}`;
  const inStock = product.isUnlimited || Number(product.availableStock || 0) > 0;

  const images = [product.image, ...(product.images || [])].filter(Boolean);

  return (
    <div className="pd-root" style={{ paddingTop: 80, paddingBottom: 64 }}>
      <Seo
        title={product.name}
        description={productDescription}
        path={productUrl}
        image={productImage}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: productDescription,
          image: productImage,
          sku: String(product._id),
          offers: {
            '@type': 'Offer',
            url: `${getSiteUrl()}${productUrl}`,
            priceCurrency: product.currency || 'USD',
            price: String(product.price || 0),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          ...(product.rating?.count
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: Number(product.rating.average || 0).toFixed(1),
                  reviewCount: product.rating.count,
                },
              }
            : {}),
        }}
      />
      <style>{STYLES}</style>
      <div className="pd-page-shell">
        <nav style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>الرئيسية</Link>
          <span>/</span>
          <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>المتجر</Link>
          <span>/</span>
          <span style={{ color: '#6366F1' }}>{product.name}</span>
        </nav>

        <div className="pd-main-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="pd-glass pd-main-image" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', borderRadius: 24 }}>
              <img src={getImageUrl(images[activeImg])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
              <button onClick={handleInfoClick} title="عرض التفاصيل والفيديو" style={{ position: 'absolute', top: 15, right: 15, width: 42, height: 42, borderRadius: '50%', background: '#6366F1', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>i</button>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 5 }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`pd-thumb-btn ${activeImg === i ? 'active' : ''}`}>
                  <img src={getImageUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
            <div>
            <span className="pd-badge" style={{ background: 'rgba(99,102,241,.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,.3)' }}>
                {catalogCategory?.name || categoryLabels[product.category] || 'منتج رقمي'}
              </span>
              <h1 className="pd-main-title" style={{ fontSize: 42, fontWeight: 800, color: '#f5f4ef', marginTop: 15, fontFamily: 'Manrope' }}>{product.name}</h1>
            </div>

            <div className="pd-glass" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 15 }}>
                <span className="pd-price" style={{ fontSize: 48, fontWeight: 800, color: '#818CF8' }}>{format(product.price)}</span>
                {product.originalPrice > product.price && (
                  <span className="pd-strike-price" style={{ fontSize: 22, color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>{format(product.originalPrice)}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: (product.availableStock > 0 || product.isUnlimited) ? '#6366F1' : '#ff4444' }}></div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {product.isUnlimited ? '∞ مخزون غير محدود' : product.availableStock > 0 ? `${product.availableStock} وحدة متاحة` : 'نفد المخزون'}
                </span>
              </div>
            </div>

            <div className="pd-actions-row" style={{ display: 'flex', gap: 15 }}>
              <div className="pd-glass pd-qty-box" style={{ display: 'flex', alignItems: 'center', borderRadius: 15 }}>
                <button className="pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 'bold' }}>{quantity}</span>
                <button className="pd-qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button onClick={handleAddToCart} className="pd-btn-primary" style={{ flex: 1 }} disabled={!product.isUnlimited && !product.availableStock}>
                {(!product.isUnlimited && !product.availableStock) ? 'نفد المخزون' : 'أضف إلى السلة'}
              </button>
            </div>

            <button onClick={handleToggleWishlist} disabled={wishlistLoading} className="pd-glass pd-wishlist-btn" style={{ padding: '14px 18px', borderRadius: 15, border: `1px solid ${inWishlist ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`, background: inWishlist ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', color: inWishlist ? '#f87171' : '#E8EAED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, cursor: wishlistLoading ? 'not-allowed' : 'pointer' }}>
              <span>{wishlistLoading ? '...' : (inWishlist ? '♥' : '♡')}</span>
              {inWishlist ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
            </button>

            <div>
              <h3 style={{ fontSize: 18, color: '#E8EAED', marginBottom: 10, fontFamily: 'Rajdhani' }}>عن هذا المنتج</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: 15 }}>{product.description}</p>
            </div>
          </div>
        </div>

        <div className="pd-glass pd-review-shell" style={{ marginTop: 60, padding: 40 }}>
          <h2 className="pd-review-header" style={{ fontSize: 28, fontFamily: 'Rajdhani', marginBottom: 30 }}>تقييمات المنتج</h2>
          {isAuthenticated ? (
            <form onSubmit={handleReview} style={{ marginBottom: 40, display: 'grid', gap: 15 }}>
              <div>
                <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>تقييمك</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReview({ ...review, rating: star })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 28, color: star <= review.rating ? '#818CF8' : 'rgba(255,255,255,0.2)' }}>★</button>
                  ))}
                </div>
              </div>
              <textarea className="pd-input" rows="3" placeholder="شاركنا رأيك..." style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: '#fff' }} value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button type="submit" className="pd-btn-primary" style={{ width: 'fit-content' }}>{submitting ? 'جارٍ الإرسال...' : 'إرسال التقييم'}</button>
            </form>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 30 }}>سجّل الدخول لكتابة تقييم.</p>
          )}

          <div style={{ display: 'grid', gap: 15 }}>
            {product.reviews?.length > 0 ? product.reviews.map((r, i) => (
              <div key={r._id || i} className="pd-review-item">
                <img src={r.user?.avatar || userDefaultAvatar} alt="User" className="pd-avatar" style={{ objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 15, color: '#818CF8' }}>{r.user?.name || r.name || 'عميل'}</h4>
                      <StarRating value={r.rating} size={11} />
                    </div>

                    {isAdmin && (
                      <div style={{ position: 'relative' }}>
                        <button
                          className="pd-review-dots-btn"
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === r._id ? null : r._id); }}
                          title="Review options"
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                        {activeMenu === r._id && (
                          <div className="pd-review-menu">
                            <button
                              onClick={() => handleDeleteReview(r._id)}
                              className="pd-review-menu-item"
                            >
                              <TrashIcon />
                              حذف التقييم
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '5px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{r.comment}</p>
                </div>
              </div>
            )) : <p style={{ color: 'rgba(255,255,255,0.2)' }}>لا توجد تقييمات حتى الآن.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
