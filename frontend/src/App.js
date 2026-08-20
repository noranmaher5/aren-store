import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { systemAPI } from './services/api';
import { FaWhatsapp } from 'react-icons/fa';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
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


// â¬†ï¸ ScrollToTop â€” ÙŠØ±Ø¬Ø¹ Ù„Ù„Ø£Ø¹Ù„Ù‰ Ø¹Ù†Ø¯ ÙƒÙ„ ØªØºÙŠÙŠØ± ÙÙŠ Ø§Ù„Ù€ route
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// ðŸ’¬ Chatwoot Widget (ÙƒÙ„ Ø§Ù„ØµÙØ­Ø§Øª Ù…Ø§ Ø¹Ø¯Ø§ /admin)
const WhatsAppChat = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const removeLegacyChat = () => {
      document.querySelectorAll('script[src*="syriana"], script[src*="chatwoot"], #chatwoot-sdk, #chatwoot_live_chat_widget, #woot-widget-bubble, .woot-widget-bubble, .woot-widget-holder, .chatwoot-widget, [id*="chatwoot"], [class*="chatwoot"], [id*="woot"], [class*="woot-widget"], iframe[src*="syriana"], iframe[src*="chatwoot"]').forEach(node => node.remove());
      document.querySelectorAll('body > iframe, body > div').forEach(node => { const box = node.getBoundingClientRect(); if (node.id !== 'root' && box.width < 120 && box.height < 120) node.remove(); });
    };
    const style = document.createElement('style');
    style.id = 'disable-chatwoot-widget';
    style.textContent = '#chatwoot_live_chat_widget,#woot-widget-bubble,.woot-widget-bubble,.woot-widget-holder,.chatwoot-widget,[id*="chatwoot"],[class*="chatwoot"],[id*="woot"],[class*="woot-widget"],iframe[src*="syriana"],iframe[src*="chatwoot"]{display:none!important;visibility:hidden!important;pointer-events:none!important;}';
    document.head.appendChild(style);
    removeLegacyChat();
    const observer = new MutationObserver(removeLegacyChat);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); style.remove(); };
  }, []);

  /* Legacy Chatwoot script intentionally disabled. */
  if (isAdmin) return null;
  return <a id="aren-whatsapp-chat" href="https://wa.me/966544379441" target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000, width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#25D366', color: '#fff', boxShadow: '0 8px 24px rgba(37,211,102,.35)', transition: 'transform .2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
    <FaWhatsapp size={32} aria-hidden="true" />
  </a>;

  /*
  useEffect(() => {
    const styleId = 'chatwoot-hide-style';

    if (isAdmin) {
      // Ø¥Ø®ÙØ§Ø¡ ÙƒÙ„ Ø¹Ù†Ø§ØµØ± Chatwoot Ø¹Ø¨Ø± CSS
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          #chatwoot_live_chat_widget,
          .woot-widget-bubble,
          .woot-widget-holder { display: none !important; visibility: hidden !important; }
        `;
        document.head.appendChild(style);
      }
      return;
    }

    // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ù€ hide style Ù„Ùˆ Ø±Ø¬Ø¹ Ù…Ù† Ø§Ù„Ø£Ø¯Ù…Ù†
    const hideStyle = document.getElementById(styleId);
    if (hideStyle) hideStyle.remove();

    // Ø§Ù…Ù†Ø¹ Ø§Ù„ØªÙƒØ±Ø§Ø± Ù„Ùˆ Ø§Ù„Ø³ÙƒØ±ÙŠØ¨Øª Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„
    if (document.getElementById('chatwoot-sdk')) return;

    const BASE_URL = 'https://app-bot.syriana.software';
    const script = document.createElement('script');
    script.id = 'chatwoot-sdk';
    script.src = `${BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: 'ahHbRPEmY3BmUtGyuGZqTAWo',
        baseUrl: BASE_URL,
      });
      window.addEventListener('chatwoot:ready', () => {
        const style = document.createElement('style');
        style.innerHTML = `
          #chatwoot_live_chat_widget { clip-path: inset(0px 0px 35px 0px) !important; bottom: -15px !important; }
          .woot-widget-bubble--brand { display: none !important; visibility: hidden !important; }
        `;
        document.head.appendChild(style);

        // Ù†Ø³ØªÙ†Ù‰ Ø§Ù„Ù€ widget ÙŠØªØ­Ù…Ù„ ÙƒØ§Ù…Ù„ Ø§Ù„Ø£ÙˆÙ„
        setTimeout(() => {
          const interval = setInterval(() => {
            try {
              const widgetHolder = document.querySelector('.woot-widget-holder');
              if (widgetHolder && !widgetHolder.querySelector('.clean-cover')) {
                const cover = document.createElement('div');
                cover.className = 'clean-cover';
                cover.style.cssText = `
                  position: absolute; bottom: 0; right: 0;
                  width: 100%; height: 35px; background: #fff;
                  z-index: 9999; pointer-events: none;
                  border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;
                `;
                widgetHolder.appendChild(cover);
                clearInterval(interval); // Ø®Ù„Ø§Øµ Ù„Ù‚ÙŠÙ†Ø§Ù‡ØŒ ÙˆÙ‚ÙÙ†Ø§ Ø§Ù„Ù€ interval
              }
            } catch (e) {
              // ignore
            }
          }, 1500);
        }, 2000);
      });
    };
    document.body.appendChild(script);
  }, [isAdmin]);
  */
};

// ðŸ›¡ï¸ 1. Ø¬Ø§Ø±Ø¯ ÙˆØ¶Ø¹ Ø§Ù„ØµÙŠØ§Ù†Ø© (Maintenance Guard)
const MaintenanceGuard = () => {
  // âœ… Ø£Ø¶ÙÙ†Ø§ user Ù‡Ù†Ø§ Ù„Ø¶Ù…Ø§Ù† Ø¹Ù…Ù„ ÙØ­Øµ Ø§Ù„Ø±ØªØ¨Ø© Ø¨Ù†Ø¬Ø§Ø­
  const { user, loading: authLoading } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lang, setLang] = useState('ar');

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

  // âœ… Ø§Ù„Ø³Ù…Ø§Ø­ Ù„Ù„Ø£Ø¯Ù…Ù†ØŒ Ø§Ù„Ø£ÙˆÙ†Ø±ØŒ ÙˆØ§Ù„Ø±ØªØ¨Ø© Ø§Ù„Ù…Ø®ÙÙŠØ© Ø¨ØªØ®Ø·ÙŠ Ø´Ø§Ø´Ø© Ø§Ù„ØµÙŠØ§Ù†Ø©
  const canBypassMaintenance = user && ['admin', 'owner', 'hidden', 'manager', 'co-owner', 'editor'].includes(user.role);

  if (isMaintenance && !canBypassMaintenance) {
    return (
      <div className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center font-sans overflow-hidden ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="absolute top-8 right-8 z-[10000] px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-bold tracking-[2px] hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md uppercase"
        >
          {lang === 'ar' ? 'English' : 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©'}
        </button>

        <div className="absolute w-[300px] h-[300px] bg-[#6366F1]/10 blur-[100px] rounded-full" />
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-6xl animate-[hammer_1s_infinite]">ðŸ”¨</span>
            </div>
            <div className="absolute -right-2 -top-2 w-4 h-4 bg-[#6366F1] rounded-full animate-ping" />
          </div>
          <h1 className="text-white text-4xl font-black tracking-tight mb-2 uppercase">
            {lang === 'ar' ? (<>ÙˆØ¶Ø¹ <span className="text-[#6366F1]">Ø§Ù„ØµÙŠØ§Ù†Ø©</span></>) : (<>Under <span className="text-[#6366F1]">Maintenance</span></>)}
          </h1>
          <p className="text-gray-500 font-medium tracking-widest text-[10px] uppercase mb-10">
            {lang === 'ar' ? 'Ù†Ø¹Ù…Ù„ Ø¹Ù„Ù‰ Ø¨Ù†Ø§Ø¡ Ø´ÙŠØ¡ Ø£Ø³Ø·ÙˆØ±ÙŠ Ù…Ù† Ø£Ø¬Ù„Ùƒ' : 'Building something legendary for you'}
          </p>
          <div className="w-48 h-[2px] bg-white/10 mx-auto relative overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-[#6366F1] animate-[loading_2s_infinite] origin-left" style={{ width: '40%' }} />
          </div>
        </div>
        <style>{`
          @keyframes hammer { 0%, 100% { transform: rotate(-20deg) translateY(0); } 50% { transform: rotate(15deg) translateY(-10px); } }
          @keyframes loading { 0% { transform: translateX(-250%); } 100% { transform: translateX(250%); } }
          .rtl { direction: rtl; font-family: 'Cairo', 'Tahoma', sans-serif; }
          .ltr { direction: ltr; }
          .rtl .animate-[loading_2s_infinite] { left: 0; right: auto; }
        `}</style>
      </div>
    );
  }

  return <Outlet />;
};

// ðŸ”’ Guards Ø§Ù„Ø­Ù…Ø§ÙŠØ©
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// âœ… ØªØ¹Ø¯ÙŠÙ„ Ø¬Ø§Ø±Ø¯ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ù„ÙŠØ¯Ø¹Ù… Ø§Ù„Ø±ØªØ¨Ø© Ø§Ù„Ù…Ø®ÙÙŠØ© "hidden"
const AdminRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return <div className="loading-screen">LOADING...</div>;

  // 1. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø£Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù„Ø¯ÙŠÙ‡ Ø±ØªØ¨Ø© Ø¥Ø¯Ø§Ø±ÙŠØ© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§
  const isAuthorizedAdmin = user && ['admin', 'owner', 'hidden', 'manager', 'co-owner', 'editor'].includes(user.role);

  if (!isAuthorizedAdmin) {
    return <Navigate to="/login" />;
  }

  // 2. Ø¥Ø°Ø§ ÙƒØ§Ù†Øª Ø§Ù„Ø±ØªØ¨Ø© "hidden"ØŒ ÙŠØªÙ… ØªØ®Ø·ÙŠ ÙØ­Øµ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„ÙØ±Ø¹ÙŠØ© (ÙˆØµÙˆÙ„ ÙƒØ§Ù…Ù„)
  if (user.role === 'hidden') {
    return children;
  }

  // 3. Ù„Ø¨Ø§Ù‚ÙŠ Ø§Ù„Ø±ØªØ¨ØŒ ÙŠØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ù„ÙƒÙ„ ØµÙØ­Ø©
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
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] overflow-x-hidden">
      <ScrollToTop />
      <WhatsAppChat />
      <Navbar />
      <main className="flex-1 min-w-0">
        <Routes>
          {/* Guest Routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
         

          {/* Maintenance Protected Routes */}
          <Route element={<MaintenanceGuard />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* User Protected Routes */}
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
            <Route path="/order-success/:id" element={<PrivateRoute><OrderSuccessPage /></PrivateRoute>} />

            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            
            <Route path="/admin/products" element={
              <AdminRoute permission="manage_products">
                <AdminProducts />
              </AdminRoute>
            } />
            
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            } />

            <Route path="/admin/users" element={
              <AdminRoute permission="manage_users">
                <AdminUsers />
              </AdminRoute>
            } />

            <Route path="/admin/codes" element={
              <AdminRoute>
                <AdminCodes />
              </AdminRoute>
            } />

            <Route path="/admin/financials" element={
              <AdminRoute permission="view_ledger">
                <AdminFinancials />
              </AdminRoute>
            } />

            <Route path="/admin/settings" element={
              <AdminRoute permission="manage_settings">
                <AdminSettings />
              </AdminRoute>
            } />
            <Route path="/admin/discounts" element={<AdminRoute><AdminDiscounts /></AdminRoute>} />


            <Route path="/admin/maintenance" element={
              <AdminRoute permission="manage_maintenance">
                <MaintenancePage />
              </AdminRoute>
            } />
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
