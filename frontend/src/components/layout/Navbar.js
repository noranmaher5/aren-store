import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from '../common/NotificationBell';
import { productAPI } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';

const paths = {
  home: 'M3 12l2-2 7-7 7 7M5 10v10h5v-6h4v6h5V10',
  search: 'm21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2 2h12m-2 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2',
  heart: 'M20.8 8.8a5 5 0 0 0-7.1 0L12 10.5l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 24l8.8-8.1a5 5 0 0 0 0-7.1Z',
  user: 'M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'm6 9 6 6 6-6'
};

function Icon({ name, size = 19, stroke = 1.7 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function Badge({ children }) {
  return children > 0 ? <span className="aren-badge">{children > 99 ? '99+' : children}</span> : null;
}

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return <Link to={to} className={`aren-nav-link ${active ? 'active' : ''}`}>{children}</Link>;
}

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasOffers, setHasOffers] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    let alive = true;
    productAPI.getAll({ onSale: true, limit: 1 }).then(res => {
      if (alive) setHasOffers((res.data?.products || []).length > 0);
    }).catch(() => { if (alive) setHasOffers(false); });
    return () => { alive = false; };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : '/products');
  };

  const close = () => setOpen(false);
  return <>
    <header className="aren-header">
      <div className="aren-header-inner">
        <Link to="/" className="aren-logo" aria-label="الصفحة الرئيسية لمتجر Aren">
          <span className="aren-logo-mark">A</span><span><strong>AREN</strong><small>STORE</small></span>
        </Link>
        <nav className="aren-desktop-nav">
          <NavLink to="/">الرئيسية</NavLink>
          <NavLink to="/products">الاشتراكات <Icon name="chevron" size={13} /></NavLink>
          {hasOffers && <NavLink to="/offers">العروض <em>جديد</em></NavLink>}
        </nav>
        <div className="aren-header-actions">
          <div className="aren-currency-switcher" aria-label="Currency selector"><button type="button" className={currency === 'USD' ? 'active' : ''} onClick={() => setCurrency('USD')}>USD</button><button type="button" className={currency === 'SAR' ? 'active' : ''} onClick={() => setCurrency('SAR')}>SAR</button></div>
          <form className="aren-search" onSubmit={submitSearch}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..." aria-label="البحث عن المنتجات" /><button type="submit"><Icon name="search" size={18} /></button></form>
          <Link to="/cart" className="aren-icon-action" aria-label="السلة"><Icon name="cart" /><Badge>{itemCount}</Badge></Link>
          <Link to="/wishlist" className="aren-icon-action aren-heart-action" aria-label="المفضلة"><Icon name="heart" /></Link>
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? <div className="aren-account-wrap"><button className="aren-account-button" onClick={() => setAccountOpen(v => !v)}><span className="aren-avatar"><Icon name="user" size={17} /></span><span>حسابي</span><Icon name="chevron" size={13} /></button>{accountOpen && <div className="aren-account-menu"><div><strong>{user?.name}</strong><small>{user?.email}</small></div><Link to="/profile">بيانات الحساب</Link><Link to="/orders">طلباتي</Link><button onClick={() => { logout(); navigate('/'); }}>تسجيل الخروج</button></div>}</div> : <Link className="aren-account-button" to="/login"><span className="aren-avatar"><Icon name="user" size={17} /></span><span>تسجيل الدخول</span></Link>}
          <button className="aren-menu-button" onClick={() => setOpen(true)} aria-label="فتح القائمة"><Icon name="menu" /></button>
        </div>
      </div>
    </header>
    <div className={`aren-mobile-backdrop ${open ? 'show' : ''}`} onClick={close} />
    <aside className={`aren-mobile-drawer ${open ? 'show' : ''}`}>
      <div className="aren-drawer-head"><Link to="/" className="aren-logo" onClick={close}><span className="aren-logo-mark">A</span><span><strong>AREN</strong><small>STORE</small></span></Link><button onClick={close}><Icon name="close" /></button></div>
      <form className="aren-mobile-search" onSubmit={e => { submitSearch(e); close(); }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن المنتجات..." /><button><Icon name="search" /></button></form>
      <nav className="aren-mobile-links"><Link to="/" onClick={close}>الرئيسية</Link><Link to="/products" onClick={close}>كل المنتجات</Link>{hasOffers && <Link to="/offers" onClick={close}>العروض</Link>}{isAuthenticated && <Link to="/orders" onClick={close}>طلباتي</Link>}</nav>
      <div className="aren-drawer-bottom">{isAuthenticated ? <button onClick={() => { logout(); close(); navigate('/'); }}>تسجيل الخروج</button> : <Link to="/login" onClick={close}>تسجيل الدخول</Link>}</div>
    </aside>
    <nav className="aren-bottom-nav"><Link to="/"><Icon name="home" size={18} /><small>الرئيسية</small></Link><Link to="/products"><span>⌕</span><small>المنتجات</small></Link><Link to="/cart"><span className="aren-bottom-icon"><Icon name="cart" size={18} /><Badge>{itemCount}</Badge></span><small>السلة</small></Link><Link to="/orders"><span>▣</span><small>الطلبات</small></Link><Link to={isAuthenticated ? '/profile' : '/login'}><Icon name="user" size={18} /><small>حسابي</small></Link></nav>
  </>;
}
