import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { systemAPI } from './services/api';
import { FaWhatsapp } from 'react-icons/fa';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCodes from './pages/admin/AdminCodes';
import AdminSettings from './pages/admin/AdminSettings';
import NotFoundPage from './pages/NotFoundPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import MaintenancePage from './pages/MaintenancePage';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import OffersPage from './pages/OffersPage';
import Seo, { DEFAULT_DESCRIPTION, getSiteUrl } from './components/common/Seo';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const PUBLIC_SEO = {
  '/': {
    title: 'Aren Store — متجر المنتجات الرقمية',
    description: DEFAULT_DESCRIPTION,
  },
  '/products': {
    title: 'المنتجات الرقمية',
    description: 'تصفح بطاقات الألعاب والاشتراكات والتطبيقات مع توصيل فوري من Aren Store.',
  },
  '/offers': {
    title: 'العروض',
    description: 'أحدث تخفيضات Aren Store على الاشتراكات وبطاقات الألعاب والمنتجات الرقمية.',
  },
  '/terms': {
    title: 'الشروط والأحكام',
    description: 'شروط وأحكام استخدام متجر Aren Store.',
  },
  '/privacy': {
    title: 'سياسة الخصوصية',
    description: 'تعرف على كيفية تعامل Aren Store مع بياناتك وخصوصيتك.',
  },
};

const PRIVATE_SEO_PREFIXES = [
  '/admin',
  '/checkout',
  '/orders',
  '/order-success',
  '/profile',
  '/cart',
  '/wishlist',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const canonicalPath = (pathname, search) => {
  if (pathname !== '/products') return pathname;
  const params = new URLSearchParams(search);
  const next = new URLSearchParams();
  const catalog = params.get('catalog');
  const query = params.get('search');
  if (catalog) next.set('catalog', catalog);
  if (query) next.set('search', query);
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
};

const RouteSeo = () => {
  const { pathname, search } = useLocation();
  if (/^\/products\/[^/]+/.test(pathname)) return null;

  const page = PUBLIC_SEO[pathname];
  const noindex = !page || PRIVATE_SEO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const site = getSiteUrl();
  const jsonLd = pathname === '/'
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Aren Store',
        url: site,
        inLanguage: 'ar',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${site}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }
    : undefined;

  return (
    <Seo
      title={page?.title || 'Aren Store'}
      description={page?.description || DEFAULT_DESCRIPTION}
      path={canonicalPath(pathname, search)}
      noindex={noindex}
      jsonLd={jsonLd}
    />
  );
};

const WhatsAppChat = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;
  return (
    <a
      id="aren-whatsapp-chat"
      href="https://wa.me/966544379441"
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 1000,
        width: 58,
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#25D366',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(37,211,102,.35)',
        transition: 'transform .2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <FaWhatsapp size={32} aria-hidden="true" />
    </a>
  );
};

const MaintenanceGuard = () => {
  const { user, loading: authLoading } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = () => {
      systemAPI.health(`?t=${Date.now()}`)
        .then(res => setIsMaintenance(res.data.maintenanceMode || false))
        .catch(() => setIsMaintenance(false))
        .finally(() => setChecking(false));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (checking || authLoading) return null;

  const canBypassMaintenance = user && ['admin', 'owner', 'hidden', 'manager', 'co-owner', 'editor'].includes(user.role);

  if (isMaintenance && !canBypassMaintenance) {
    return (
      <div dir="rtl" className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#0a0a0a] font-sans">
        <div className="absolute h-[300px] w-[300px] rounded-full bg-[#b98cff]/10 blur-[100px]" />
        <div className="relative z-10 text-center">
          <div className="relative mb-8 inline-block">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-2xl">
              <span className="animate-[hammer_1s_infinite] text-6xl">🔧</span>
            </div>
            <div className="absolute -right-2 -top-2 h-4 w-4 animate-ping rounded-full bg-[#b98cff]" />
          </div>
          <h1 className="mb-2 text-4xl font-black tracking-tight text-white">
            وضع <span className="text-[#b98cff]">الصيانة</span>
          </h1>
          <p className="mb-10 text-[13px] font-medium tracking-widest text-gray-500">
            نعمل على تحسين المتجر من أجلك
          </p>
          <div className="relative mx-auto h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-0 origin-right animate-[loading_2s_infinite] bg-[#b98cff]" style={{ width: '40%' }} />
          </div>
        </div>
        <style>{`
          @keyframes hammer { 0%, 100% { transform: rotate(-20deg) translateY(0); } 50% { transform: rotate(15deg) translateY(-10px); } }
          @keyframes loading { 0% { transform: translateX(250%); } 100% { transform: translateX(-250%); } }
        `}</style>
      </div>
    );
  }

  return <Outlet />;
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return <div className="loading-screen">جاري التحميل...</div>;

  const isAuthorizedAdmin = user && ['admin', 'owner', 'hidden', 'manager', 'co-owner', 'editor'].includes(user.role);

  if (!isAuthorizedAdmin) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'hidden') {
    return children;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/admin" />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return children;
  const isAdmin = user && ['admin', 'owner', 'hidden', 'manager', 'co-owner', 'editor'].includes(user.role);
  return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
};

function AppRoutes() {
  const location = useLocation();
  useEffect(() => {
    const referralCode = new URLSearchParams(location.search).get('ref');
    if (referralCode) localStorage.setItem('aren_referral_code', referralCode.trim().toUpperCase());
  }, [location.search]);
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#050505]">
      <ScrollToTop />
      <RouteSeo />
      <WhatsAppChat />
      <Navbar />
      <main className="min-w-0 flex-1">
        <Routes>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          <Route element={<MaintenanceGuard />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
            <Route path="/order-success/:id" element={<PrivateRoute><OrderSuccessPage /></PrivateRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute permission="manage_products"><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute permission="manage_users"><AdminUsers /></AdminRoute>} />
            <Route path="/admin/codes" element={<AdminRoute><AdminCodes /></AdminRoute>} />
            <Route path="/admin/financials" element={<AdminRoute permission="view_ledger"><AdminFinancials /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute permission="manage_settings"><AdminSettings /></AdminRoute>} />
            <Route path="/admin/discounts" element={<AdminRoute><AdminDiscounts /></AdminRoute>} />
            <Route path="/admin/maintenance" element={<AdminRoute permission="manage_maintenance"><MaintenancePage /></AdminRoute>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, []);
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            containerStyle={{ top: 82, zIndex: 10000 }}
            toastOptions={{
              duration: 2800,
              style: {
                direction: 'rtl',
                background: 'linear-gradient(135deg, #17121f, #0f1117)',
                color: '#f5f0ff',
                border: '1px solid rgba(185,140,255,.38)',
                borderRadius: '14px',
                boxShadow: '0 14px 36px rgba(0,0,0,.45), 0 0 22px rgba(185,140,255,.10)',
                fontFamily: 'Cairo, Tajawal, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                padding: '12px 16px',
                maxWidth: 'calc(100vw - 28px)',
              },
              success: {
                iconTheme: { primary: '#b98cff', secondary: '#17121f' },
                style: { borderColor: 'rgba(185,140,255,.5)' },
              },
              error: {
                iconTheme: { primary: '#ff6b81', secondary: '#211117' },
                style: { borderColor: 'rgba(255,107,129,.45)' },
              },
            }}
          />
        </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}
