import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="aren-footer">
      <div className="aren-footer-main">
        <div className="aren-footer-brand">
          <Link to="/" className="aren-logo">
            <span className="aren-logo-mark">A</span>
            <span><strong>AREN</strong><small>STORE</small></span>
          </Link>
          <p>اشتراكات رقمية موثوقة، توصيل سريع وتجربة شراء بسيطة وآمنة.</p>
          <Link to="/products" className="aren-footer-cta">تصفح المنتجات <span>←</span></Link>
        </div>

        <div className="aren-footer-column">
          <h4>المتجر</h4>
          <Link to="/products">كل المنتجات</Link>
          <Link to="/offers">العروض</Link>
          <Link to="/wishlist">المفضلة</Link>
          <Link to="/cart">السلة</Link>
        </div>

        <div className="aren-footer-column">
          <h4>المساعدة</h4>
          <Link to="/terms">شروط الاستخدام</Link>
          <Link to="/privacy">سياسة الخصوصية</Link>
          <Link to="/orders">طلباتي</Link>
        </div>
      </div>

      <div className="aren-footer-bottom">
        <span>© {new Date().getFullYear()} Aren Store</span>
        <span>جميع الحقوق محفوظة لـ Aren Store</span>
        <span className="aren-developer-credit">Developed by <a href="https://wa.me/201121967774" target="_blank" rel="noreferrer"><strong>Noran Maher</strong></a></span>
      </div>
    </footer>
  );
}
