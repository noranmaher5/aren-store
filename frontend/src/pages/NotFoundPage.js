import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from '../components/common/Seo';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <div dir="rtl" className="page-enter relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Seo title="الصفحة غير موجودة" description="الصفحة المطلوبة غير موجودة في أرن ستور." path={pathname} noindex />
      <div className="relative">
        <p className="select-none font-display text-[10rem] font-black leading-none text-[#b98cff] opacity-20">404</p>
        <div className="relative -mt-16">
          <h1 className="mb-4 font-display text-4xl font-bold text-white">الصفحة غير موجودة</h1>
          <p className="mb-8 max-w-md text-[#b8a9cc]">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/" className="rounded-xl bg-[#b98cff] px-6 py-3 text-sm font-bold text-[#17121f] hover:bg-[#d4b8ff]">العودة للرئيسية</Link>
            <Link to="/products" className="rounded-xl border border-[rgba(185,140,255,0.35)] px-6 py-3 text-sm font-bold text-[#c5a0ff] hover:bg-[rgba(185,140,255,0.1)]">تصفح المنتجات</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
