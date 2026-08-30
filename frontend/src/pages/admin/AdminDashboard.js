import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// Reusable Stat Card Component
const StatCard = ({ label, value, icon, trend }) => (
  <div className="group relative overflow-hidden glass rounded-[2rem] p-5 sm:p-6 lg:p-8 border border-white/5 bg-zinc-900/20 hover:border-white/20 transition-all duration-500 min-w-0">
    <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      {trend && (
        <span className="text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl sm:text-4xl font-bold text-white mb-1 truncate">{value}</h3>
      <p className="text-zinc-500 text-xs font-normal">{label}</p>
    </div>
    {/* Decorative background element */}
    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-colors" />
  </div>
);

const formatSAR = value => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Number(value) || 0);

const ORDER_STATUS_LABELS = {
  completed: 'مكتمل',
  paid: 'مدفوع',
  paid_unconfirmed: 'مدفوع ويحتاج مراجعة',
  processing: 'قيد المعالجة',
  pending_fulfillment: 'قيد التجهيز',
  failed: 'فشل',
  refunded: 'مسترد',
  cancelled: 'ملغي'
};

export default function AdminDashboard() {
  const { user, hasPermission } = useAuth();
  const canViewDashboard = ['admin', 'manager', 'co-owner', 'owner', 'hidden'].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminAPI.getDashboard();
      setStats(res.data.stats);
    } catch (err) {
      toast.error('خطأ: تعذر تحديث بيانات لوحة التحكم');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewDashboard) {
      setLoading(false);
      return undefined;
    }
    loadDashboardData();
    const interval = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [canViewDashboard]);

  const navItems = [
    { to: '/admin/products', label: 'المنتجات', icon: '📦' },
    { to: '/admin/codes', label: 'مفاتيح المنتجات', icon: '🔑' },
    { to: '/admin/orders', label: 'سجل المبيعات', icon: '🛒' },
    { to: '/admin/users', label: 'المستخدمون', icon: '👥' },
    { to: '/admin/financials', label: 'السجل المالي', icon: '💰' },
    { to: '/admin/discounts', label: 'الخصومات', icon: '🏷️' },
    { to: '/admin/settings', label: 'إعدادات النظام', icon: '⚙️' },
  ];

  if (!canViewDashboard) {
    const allowedItems = navItems.filter(item => {
      const permissionByRoute = {
        '/admin/products': 'manage_products',
        '/admin/orders': 'manage_orders',
        '/admin/users': 'manage_users',
        '/admin/financials': 'view_analytics',
        '/admin/settings': 'manage_settings',
      };
      return hasPermission(permissionByRoute[item.to]);
    });

    return (
      <div dir="rtl" className="min-h-screen bg-[#050505] text-white px-4 pt-36 pb-24 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs text-emerald-400 mb-3">تم تسجيل الدخول بنجاح</p>
            <h1 className="text-3xl sm:text-4xl font-bold">مرحبًا {user?.name}</h1>
            <p className="text-sm text-zinc-500 mt-3">اختر من الصلاحيات المتاحة لحسابك.</p>
          </div>
          {allowedItems.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {allowedItems.map(item => <Link key={item.to} to={item.to} className="rounded-2xl border border-white/10 bg-white/[.03] p-6 text-center hover:bg-white hover:text-black transition-all"><div className="text-2xl mb-3">{item.icon}</div><p className="text-xs font-semibold">{item.label}</p></Link>)}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-200">لا توجد صلاحيات مفعلة لهذا الحساب. تواصل مع مدير النظام.</div>
          )}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505]">
      <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-xs font-normal text-zinc-500">جارٍ تحميل لوحة التحكم...</p>
    </div>
  );

  return (
    <div dir="rtl" className="admin-dashboard pt-36 sm:pt-40 pb-24 sm:pb-16 min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-zinc-500">حالة النظام: يعمل بشكل طبيعي</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-none">لوحة التحكم</h1>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-16">
          <StatCard label="إجمالي الإيرادات" value={formatSAR(stats?.totalRevenue)} icon="💵"  />
          <StatCard label="الطلبات المعالجة" value={stats?.totalOrders} icon="⚡" />
          <StatCard label="عدد المنتجات" value={stats?.totalProducts} icon="📦" />
          <StatCard label="المستخدمون المسجلون" value={stats?.totalUsers} icon="👥" />
        </div>

        {/* Global Navigation Hub */}
        <div className="grid grid-cols-2 min-[520px]:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-12 sm:mb-20">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className="group relative p-4 sm:p-6 lg:p-8 glass border border-white/5 rounded-2xl sm:rounded-[2rem] hover:bg-white transition-all duration-500 text-center overflow-hidden min-w-0">
              <div className="relative z-10 text-2xl sm:text-3xl mb-2 sm:mb-4 group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-500">{item.icon}</div>
              <p className="relative z-10 font-semibold text-xs text-zinc-400 group-hover:text-black transition-colors">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Secondary Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Recent Sales Monitor */}
          <div className="lg:col-span-7 glass border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-10 bg-zinc-900/10 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6 sm:mb-10">
              <h2 className="text-sm font-semibold text-zinc-500">أحدث الطلبات</h2>
              <Link to="/admin/orders" className="text-xs font-semibold border-b border-white/20 pb-1 hover:border-white transition-all">عرض الكل</Link>
            </div>
            <div className="space-y-4">
              {stats?.recentOrders?.map(order => (
                <div key={order._id} className="flex items-center justify-between gap-3 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all min-w-0">
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <div className="text-xs font-mono font-semibold text-zinc-600">#{order.orderNumber.slice(-5)}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200 truncate max-w-[120px] sm:max-w-none">{order.user?.name || 'زائر'}</p>
                      <p className="text-xs text-zinc-600 font-normal">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold text-white">${order.totalAmount.toFixed(2)}</p>
                    <p className={`text-xs font-semibold ${order.status === 'completed' ? 'text-emerald-500' : 'text-zinc-500'}`}>{ORDER_STATUS_LABELS[order.status] || 'غير معروف'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Alerts (Low Stock) */}
          <div className="lg:col-span-5 glass border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-10 bg-zinc-900/10 min-w-0">
            <h2 className="text-sm font-semibold text-zinc-500 mb-6 sm:mb-10">تنبيهات المخزون</h2>
            <div className="space-y-4">
              {stats?.lowStockProducts?.map(product => (
                <div key={product._id} className="flex items-center justify-between gap-3 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${product.stock === 0 ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-orange-500'}`} />
                    <p className="text-xs font-semibold text-zinc-300 truncate max-w-[130px] sm:max-w-[150px]">{product.name}</p>
                  </div>
                  <span className={`text-xs font-mono font-semibold px-4 py-2 rounded-xl ${product.stock === 0 ? 'bg-rose-500 text-white' : 'bg-white/5 text-zinc-400'}`}>
                    متبقي {product.stock}
                  </span>
                </div>
              ))}
              {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-2xl mb-4 opacity-20">🛡️</div>
                  <p className="text-zinc-700 text-xs font-normal">كل الأنظمة تعمل بشكل طبيعي</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
