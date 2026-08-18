import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="aren-footer">
    <div className="aren-footer-main"><div className="aren-footer-brand"><Link to="/" className="aren-logo"><span className="aren-logo-mark">A</span><span><strong>AREN</strong><small>STORE</small></span></Link><p>شريكك الموثوق للاشتراكات الرقمية، بحسابات مميزة وتوصيل فوري ودعم متواصل.</p></div><div><h4>المتجر</h4><Link to="/products">كل المنتجات</Link><Link to="/categories">التصنيفات</Link><Link to="/offers">العروض</Link><Link to="/categories">تصفح الاشتراكات</Link></div><div><h4>الشركة</h4><Link to="/about">عن المتجر</Link><Link to="/about">كيف نعمل؟</Link><Link to="/support">تواصل معنا</Link></div><div><h4>الدعم</h4><Link to="/support">مركز المساعدة</Link><Link to="/terms">شروط الاستخدام</Link><Link to="/privacy">سياسة الخصوصية</Link><a href="mailto:support@arenstore.com">support@arenstore.com</a></div><div><h4>تابعنا</h4><div className="aren-socials"><span>f</span><span>𝕏</span><span>◎</span><span>◉</span></div><small className="aren-copy">© {new Date().getFullYear()} Aren Store. جميع الحقوق محفوظة.</small></div></div>
  </footer>;
}
