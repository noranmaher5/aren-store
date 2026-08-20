import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import { useCurrency } from '../context/CurrencyContext';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .cart-root {
    background: radial-gradient(circle at 12% 0%, rgba(185,140,255,.13), transparent 30%), radial-gradient(circle at 90% 65%, rgba(96,55,158,.12), transparent 28%), #030405;
    min-height: 100vh;
    font-family: 'Outfit', sans-serif;
    color: #e8f0e0;
    overflow-x: hidden;
  }

  .cart-glass {
    background: linear-gradient(145deg, rgba(20,18,28,.95), rgba(10,11,13,.96));
    border: 1px solid rgba(185,140,255,.18);
    border-radius: 20px;
    box-shadow: 0 18px 45px rgba(0,0,0,.24), inset 0 1px rgba(255,255,255,.04);
  }

  .cart-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: linear-gradient(135deg, #b98cff, #8150c7);
    color: #120b1d;
    border: none;
    border-radius: 12px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all .2s;
    text-decoration: none;
  }
  .cart-btn-primary:hover { background: linear-gradient(135deg, #d4b8ff, #a66cff); transform: translateY(-2px); box-shadow: 0 10px 25px rgba(185,140,255,.25); }

  .cart-qty-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 18px;
    cursor: pointer;
    transition: color .2s;
  }
  .cart-qty-btn:hover { color: #e8f0e0; }

  .cart-basket-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.25);
    transition: color .2s, background .2s;
    flex-shrink: 0;
  }
  .cart-basket-btn:hover {
    color: #f87171;
    background: rgba(248,113,113,0.08);
  }

  .cart-clear-btn {
    background: transparent;
    border: none;
    font-size: 13px;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    transition: color .2s;
    font-family: 'Outfit', sans-serif;
    padding: 6px 10px;
  }
  .cart-clear-btn:hover { color: #f87171; }

  /* Container */
  .cart-container {
    max-width: 1240px;
    margin: 0 auto;
    padding: 40px 20px;
    box-sizing: border-box;
    width: 100%;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 32px;
    align-items: start;
  }

  /* Item Card */
  .cart-item-card {
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
    transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
  }
  .cart-item-card:hover { transform: translateY(-3px); border-color: rgba(185,140,255,.45); box-shadow: 0 20px 45px rgba(0,0,0,.35), 0 0 24px rgba(185,140,255,.07); }

  .cart-item-img {
    width: 80px; 
    height: 80px;
    border-radius: 14px;
    border: 1px solid rgba(185,140,255,.28);
    object-fit: cover;
    flex-shrink: 0;
  }

  .cart-item-info { flex: 1; min-width: 0; }

  .cart-item-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .cart-qty-box {
    display: flex;
    align-items: center;
    background: rgba(185,140,255,.08);
    border: 1px solid rgba(185,140,255,.22);
    border-radius: 10px;
  }

  .cart-subtotal {
    font-weight: 700;
    color: #f7f3ff;
    font-size: 16px;
    min-width: 90px;
    text-align: right;
  }

  /* Toast */
  .cart-toast-container {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
    width: 90%;
    max-width: 360px;
  }
  .cart-toast {
    display: flex;
    align-items: center;
    direction: rtl;
    gap: 10px;
    background: linear-gradient(135deg, #17121f, #0f1117);
    border: 1px solid rgba(185,140,255,0.38);
    border-radius: 14px;
    padding: 12px 20px;
    font-family: 'Cairo', 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #f5f0ff;
    box-shadow: 0 14px 36px rgba(0,0,0,0.45), 0 0 22px rgba(185,140,255,0.10);
    pointer-events: auto;
    animation: toastIn .25s ease forwards;
    width: 100%;
  }
  .cart-toast.toast-exit { animation: toastOut .25s ease forwards; }
  .cart-toast-icon {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0;
  }
  .cart-toast-icon.success,
  .cart-toast-icon.warning { background: rgba(185,140,255,0.15); color: #b98cff; }
  
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(8px) scale(0.96); }
  }

  /* Responsive */
  @media (max-width: 1100px) {
    .cart-layout {
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 24px;
    }
  }

  @media (max-width: 860px) {
    .cart-layout {
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .cart-summary {
      position: static !important;
      order: 2;
    }
  }

  @media (max-width: 580px) {
    .cart-container { 
      padding: 24px 16px; 
    }
    
    .cart-item-card {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
      gap: 16px;
    }

    .cart-item-main-info {
      display: flex;
      width: 100%;
      gap: 16px;
      align-items: center;
    }

    .cart-item-controls {
      width: 100%;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 16px;
      gap: 12px;
    }

    .cart-qty-box { order: -1; }

    .cart-subtotal {
      text-align: right;
      min-width: auto;
      flex: 1;
      font-size: 15px;
    }
  }

  .cart-summary { overflow: hidden; }
  .cart-root .cart-btn-primary { background: linear-gradient(135deg, #b98cff, #8150c7) !important; color: #120b1d !important; border-color: #d4b8ff !important; }
  .cart-root .cart-btn-primary:hover { background: linear-gradient(135deg, #d4b8ff, #a66cff) !important; }
  .cart-summary::before { content: ''; display: block; height: 3px; margin: -28px -28px 24px; background: linear-gradient(90deg, #b98cff, #ef5d9d, transparent); }
  .cart-header-row h1 { letter-spacing: -.04em; text-shadow: 0 0 24px rgba(185,140,255,.16); }
  .cart-empty-icon { width: 96px; height: 96px; display: grid; place-items: center; margin-bottom: 22px; border: 1px solid rgba(185,140,255,.3); border-radius: 28px; background: rgba(185,140,255,.1); box-shadow: 0 0 45px rgba(185,140,255,.12); }
`;

const BasketIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const show = React.useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
    }, 2800);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  return (
    <div className="cart-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`cart-toast${t.exiting ? ' toast-exit' : ''}`}>
          <span className={`cart-toast-icon ${t.type}`}>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const getProductId = (item) => item.product?._id || item.product;

export default function CartPage() {
  const { items, total, removeItem, updateQuantity, clearCart, isEmpty } = useCart();
  const { format } = useCurrency();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toasts, show: showToast } = useToast();
  const [quantities, setQuantities] = React.useState({});

  // sync local quantities when items change from server
  React.useEffect(() => {
    setQuantities({});
  }, [items.length]);

  const getQty = (item) => quantities[item._id] ?? item.quantity;

const handleUpdateQty = (item, newQty) => {
  if (newQty < 1) {
    handleRemoveItem(item);
    return;
  }
  setQuantities(prev => ({ ...prev, [item._id]: newQty }));
  updateQuantity(getProductId(item), newQty); 
};

  const handleCheckout = () => {
    if (!isAuthenticated) return navigate('/login?redirect=/checkout');
    navigate('/checkout');
  };

  const handleRemoveItem = (item) => {
    removeItem(getProductId(item));
    showToast(`تمت إزالة "${item.name}" من السلة`, 'warning');
  };

  const handleClearCart = () => {
    clearCart();
    showToast('تم إفراغ السلة', 'warning');
  };

  if (isEmpty) return (
    <div className="cart-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '80px 24px' }}>
      <style>{STYLES}</style>
      <div style={{ fontSize: 72, marginBottom: 20 }}>🛒</div>
      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 30, color: '#e8f0e0', marginBottom: 10 }}>السلة فارغة</h2>
      <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 28, fontSize: 15 }}>أضف بعض المنتجات للبدء!</p>
      <Link to="/products" className="cart-btn-primary" style={{ width: 'auto', padding: '13px 32px' }}>تصفح المنتجات</Link>
    </div>
  );

  return (
    <div className="cart-root" style={{ paddingTop: 80, paddingBottom: 64 }}>
      <style>{STYLES}</style>

      <div className="cart-container">
        {/* Header */}
        <div className="cart-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 36, color: '#e8f0e0', margin: 0 }}>سلة المشتريات</h1>
          <button onClick={handleClearCart} className="cart-clear-btn">إفراغ السلة</button>
        </div>

        <div className="cart-layout">
          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => (
              <div key={item._id} className="cart-glass cart-item-card">
                <div className="cart-item-main-info">
                  <img
                    src={getImageUrl(item.image) || `https://placehold.co/80x80/182512/22c55e?text=${encodeURIComponent(item.name[0])}`}
                    alt={item.name}
                    className="cart-item-img"
                    onError={e => { e.target.src = `https://placehold.co/80x80/182512/22c55e?text=${encodeURIComponent(item.name[0])}`; }}
                  />

                  <div className="cart-item-info">
                    <Link
                      to={`/products/${getProductId(item)}`}
                      style={{ 
                        fontWeight: 600, 
                        color: '#e8f0e0', 
                        fontSize: 15, 
                        textDecoration: 'none', 
                        display: 'block', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        transition: 'color .2s' 
                      }}
                      onMouseEnter={e => e.target.style.color = '#6366F1'}
                      onMouseLeave={e => e.target.style.color = '#e8f0e0'}
                    >
                      {item.name}
                    </Link>
                    <p style={{ color: '#6366F1', fontWeight: 700, marginTop: 4, fontSize: 15 }}>
                      {format(item.price)}
                    </p>
                  </div>
                </div>

                <div className="cart-item-controls">
                  <div className="cart-qty-box">
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleUpdateQty(item, getQty(item) - 1)}
                    >−</button>
                    <span style={{ width: 32, textAlign: 'center', color: '#e8f0e0', fontSize: 14, fontWeight: 700 }}>
                      {getQty(item)}
                    </span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleUpdateQty(item, getQty(item) + 1)}
                    >+</button>
                  </div>

                  <p className="cart-subtotal">{format(item.price * getQty(item))}</p>

                  <button
                    className="cart-basket-btn"
                    onClick={() => handleRemoveItem(item)}
                    title="حذف المنتج"
                    aria-label={`حذف ${item.name} من السلة`}
                  >
                    <BasketIcon size={19} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Summary */}
          <div className="cart-glass cart-summary" style={{ padding: '28px', position: 'sticky', top: 100 }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 22, color: '#e8f0e0', marginBottom: 24 }}>ملخص الطلب</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {items.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <span style={{ 
                    color: 'rgba(255,255,255,0.45)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
                    maxWidth: 180 
                  }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span style={{ color: '#e8f0e0', fontWeight: 500 }}>
                    {format(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>الإجمالي</span>
                <span style={{ 
                  fontFamily: 'Rajdhani, sans-serif', 
                  fontWeight: 800, 
                  fontSize: 32, 
                  color: '#e8f0e0' 
                }}>
                  {format(total)}
                </span>
              </div>
            </div>

            <button onClick={handleCheckout} className="cart-btn-primary">
              {isAuthenticated ? 'إتمام الشراء' : 'سجّل الدخول لإتمام الشراء'}
            </button>

            <Link
              to="/products"
              style={{ 
                display: 'block', 
                textAlign: 'center', 
                fontSize: 13, 
                color: 'rgba(255,255,255,0.35)', 
                marginTop: 20, 
                textDecoration: 'none',
                transition: 'color .2s'
              }}
              onMouseEnter={e => e.target.style.color = '#e8f0e0'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
            >
              ← متابعة التسوق
            </Link>

          
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
