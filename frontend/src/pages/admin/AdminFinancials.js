import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useCountUp(target, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ─── Bar Component with animated fill ────────────────────────────────────────
const CHART_HEIGHT_PX = 300; // fixed chart area height in px

function RevenueBar({ item, maxRevenue, index, visible }) {
  const revenue = Number(item.revenue) || 0;
  // Compute real pixel height directly — no percentage ambiguity
  const targetPx = maxRevenue > 0 && revenue > 0
    ? Math.max((revenue / maxRevenue) * CHART_HEIGHT_PX * 0.88, 24)
    : 8;

  const [hovered, setHovered] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setAnimated(true), index * 80);
      return () => clearTimeout(t);
    }
  }, [visible, index]);

  const label = item.name
    ? item.name.split('-').slice(1).join('/')
    : '—';

  return (
    <div
      className="flex-1 flex flex-col items-center justify-end group relative"
      style={{ minWidth: 44, height: CHART_HEIGHT_PX + 32 /* +label */ }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: CHART_HEIGHT_PX + 40,
          left: '50%',
          transform: `translateX(-50%) translateY(${hovered ? '0px' : '6px'})`,
          opacity: hovered ? 1 : 0,
          pointerEvents: 'none',
          transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
          zIndex: 40,
          whiteSpace: 'nowrap',
        }}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2 shadow-2xl text-center"
      >
        <div className="text-emerald-400 font-bold text-base">${revenue.toLocaleString()}</div>
        <div className="text-zinc-400 text-xs mt-0.5">{item.name || '—'}</div>
        {/* Arrow */}
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          width: 12, height: 6, overflow: 'hidden'
        }}>
          <div style={{
            width: 10, height: 10, background: '#27272a',
            border: '1px solid #3f3f46', transform: 'rotate(45deg)',
            marginTop: -6, marginLeft: 1
          }} />
        </div>
      </div>

      {/* Background track — full chart height */}
      <div
        className="absolute bottom-8 left-0 right-0 rounded-t-xl"
        style={{ height: CHART_HEIGHT_PX, background: 'rgba(39,39,42,0.4)' }}
      />

      {/* Filled bar — fixed px height, grows upward */}
      <div
        className="relative w-full rounded-t-xl"
        style={{
          height: animated ? targetPx : 0,
          transition: animated
            ? `height 0.75s cubic-bezier(.4,0,.2,1) ${index * 0.07}s`
            : 'none',
          marginBottom: 32, // space for label below
          background: hovered
            ? 'linear-gradient(to top, #059669, #34d399, #a7f3d0)'
            : 'linear-gradient(to top, #047857, #10b981, #6ee7b7)',
          boxShadow: hovered
            ? '0 0 28px 6px rgba(16,185,129,0.4)'
            : '0 0 10px 2px rgba(16,185,129,0.15)',
          transform: hovered ? 'scaleX(0.9)' : 'scaleX(1)',
          transformOrigin: 'bottom',
          transitionProperty: animated ? 'height' : 'none',
        }}
      >
        {/* Shine */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '38%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
          borderRadius: 'inherit',
        }} />
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '8%', right: '8%',
          height: 3,
            background: 'rgba(255,255,255,0.55)',
            borderRadius: 4,
            filter: 'blur(1px)',
          }} />
      </div>

      {/* Date label */}
      <span
        className="text-xs font-medium transition-colors"
        style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          color: hovered ? '#34d399' : '#71717a',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, growth, icon, delay }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const counted = useCountUp(value, 1400, visible);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const isPositive = growth >= 0;

  return (
    <div
      ref={ref}
      className="relative bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 overflow-hidden group transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(.4,0,.2,1) ${delay}ms, border-color 0.3s`,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgb(39,39,42)'}
    >
      {/* Ambient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
      />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">{label}</p>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <span className="text-4xl font-semibold tracking-tight text-white tabular-nums">
          ${counted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className={`mt-5 flex items-center gap-2 text-sm relative z-10 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        <span className="font-medium">
          {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
        </span>
        <span className="text-zinc-600 text-xs">مقارنة بالشهر الماضي</span>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-500 group-hover:w-full"
        style={{ width: '0%', background: 'linear-gradient(to right, #10b981, transparent)' }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminFinancials() {
  const [data, setData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const calculateGrowth = (chartData) => {
    if (!chartData || chartData.length < 2) return 0;
    const sorted = [...chartData].sort((a, b) => new Date(b.name) - new Date(a.name));
    const current = sorted[0]?.revenue || 0;
    const previous = sorted[1]?.revenue || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    const fetchData = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const res = await adminAPI.getFinancials();
        if (res.data.success) {
          setData(res.data);
          setAllTransactions(res.data.transactions || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('تعذر تحميل البيانات المالية');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    const scheduleDailyRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setDate(now.getDate() + 1);
      nextMidnight.setHours(0, 0, 5, 0);

      const msUntilMidnight = nextMidnight.getTime() - now.getTime();
      refreshTimerRef.current = setTimeout(async () => {
        await fetchData(false);
        scheduleDailyRefresh();
      }, msUntilMidnight);
    };

    fetchData(true).then(scheduleDailyRefresh);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setChartVisible(true); }, { threshold: 0.1 });
    if (chartRef.current) obs.observe(chartRef.current);
    return () => obs.disconnect();
  }, [data]);

  const handleDownloadFullReport = async () => {
    const transactionsToDownload = allTransactions.length > 0 ? allTransactions : (data?.transactions || []);
    if (transactionsToDownload.length === 0) {
      toast.error('لا توجد معاملات متاحة للتنزيل');
      return;
    }
    setDownloading(true);
    try {
      const headers = ['رقم المعاملة', 'اسم العميل', 'البريد الإلكتروني', 'الحالة', 'طريقة الدفع', 'المبلغ بالدولار', 'التاريخ'];
      const rows = transactionsToDownload.map(tx => {
        const dateObj = tx.date || tx.createdAt || tx.transactionDate;
        const date = dateObj
          ? new Date(dateObj).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'N/A';
        return [
          tx._id || 'N/A',
          `"${(tx.user?.name || 'Anonymous User').replace(/"/g, '""')}"`,
          tx.user?.email || 'غير متاح',
          tx.status || 'مكتمل',
          'تحويل بنكي',
          tx.totalAmount || 0,
          `"${date}"`,
        ];
      });
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Full_Transactions_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`تم تنزيل ${transactionsToDownload.length} معاملات`);
    } catch {
      toast.error('تعذر تنزيل التقرير');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center ">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" />
            <div className="absolute inset-3 border-2 border-transparent border-t-emerald-400/40 rounded-full animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
          </div>
          <p className="text-zinc-500 text-sm font-medium tracking-widest">جارٍ تحميل البيانات المالية</p>
        </div>
      </div>
    );
  }

  const revenueGrowth = data?.revenueGrowth !== undefined ? data.revenueGrowth : calculateGrowth(data?.chartData);
  const profitGrowth = data?.profitGrowth !== undefined ? data.profitGrowth : 8.7;
  const aovGrowth = data?.aovGrowth !== undefined ? data.aovGrowth : 3.2;

  const chartData = data?.chartData?.length > 0
    ? data.chartData
    : [{ name: 'لا توجد بيانات', revenue: 0 }];

  const maxRevenue = chartData.length > 0
    ? Math.max(...chartData.map(item => Number(item.revenue) || 0), 1)
    : 1;

  const stats = [
    { label: 'إجمالي الإيرادات', value: data?.totalRevenue || 0, growth: revenueGrowth, icon: '💰', delay: 0 },
    { label: 'صافي الربح', value: data?.netProfit || 0, growth: profitGrowth, icon: '📈', delay: 100 },
    { label: 'متوسط قيمة الطلب', value: data?.avgOrderValue || 0, growth: aovGrowth, icon: '🛒', delay: 200 },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-950 text-zinc-200 p-10 md:p-10 lg:p-14 pt-20">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="mb-14 flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 tracking-widest uppercase"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              لوحة مباشرة
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter text-white leading-none mb-4">
              المالية<br />
              <span style={{ color: '#10b981' }}>نظرة عامة</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-md">
              رؤى فورية حول أداء المتجر واتجاهات الإيرادات.
            </p>
          </div>

          {/* Decorative mini chart */}
          <div className="hidden lg:flex items-end gap-1.5 h-20 opacity-30">
            {[30, 55, 40, 70, 45, 85, 60, 90, 75, 100].map((h, i) => (
              <div
                key={i}
                className="w-3 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: `rgba(16,185,129,${0.3 + (i / 10) * 0.7})`,
                  animation: `barAppear 0.4s ease ${i * 0.05}s both`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* ── Revenue Chart ─────────────────────────────────────── */}
        <div
          ref={chartRef}
          className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 md:p-12 mb-14 relative overflow-hidden"
          style={{ transition: 'border-color 0.3s' }}
        >
          {/* Background grid texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10">
            {/* Chart header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">اتجاه الإيرادات</h2>
                <p className="text-zinc-500 mt-1 text-sm">الأداء اليومي — آخر 7 أيام</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Max label */}
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-zinc-600 tracking-widest">الذروة</div>
                  <div className="text-sm font-semibold text-emerald-400">${maxRevenue.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs text-emerald-400"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>

            {/* Y-axis labels + bars */}
            <div className="flex gap-4">
              {/* Y-axis */}
              <div className="flex flex-col justify-between text-right shrink-0" style={{ width: 56, height: CHART_HEIGHT_PX + 32, paddingBottom: 32 }}>
                {[...Array(5)].map((_, i) => {
                  const val = maxRevenue * ((4 - i) / 4);
                  return (
                    <span key={i} className="text-xs text-zinc-600 tabular-nums">
                      {val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${Math.round(val)}`}
                    </span>
                  );
                })}
              </div>

              {/* Chart area */}
              <div className="flex-1 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-0 flex flex-col justify-between pointer-events-none" style={{ top: 0, height: CHART_HEIGHT_PX, paddingBottom: 0 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border-t border-zinc-800/60 w-full" />
                  ))}
                </div>

                {/* Bars */}
                <div className="flex items-end gap-2 sm:gap-3" style={{ height: CHART_HEIGHT_PX + 32 }}>
                  {chartData.map((item, i) => (
                    <RevenueBar
                      key={i}
                      item={item}
                      maxRevenue={maxRevenue}
                      index={i}
                      visible={chartVisible}
                    />
                  ))}
                </div>
              </div>
            </div>

            {maxRevenue <= 1 && (
              <div className="text-center text-zinc-600 py-8 text-sm">لا توجد بيانات إيرادات بعد</div>
            )}
          </div>
        </div>

        {/* ── Transactions Table ────────────────────────────────── */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
          {/* Table header */}
          <div className="px-8 md:px-12 py-7 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">أحدث المعاملات</h2>
              <span className="text-xs px-2.5 py-1 rounded-full tabular-nums"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                {data?.transactions?.length || 0} records
              </span>
            </div>

            <button
              onClick={handleDownloadFullReport}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
              style={{
                background: downloading ? 'rgba(39,39,42,0.8)' : 'rgba(16,185,129,0.9)',
                color: downloading ? '#71717a' : '#fff',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = '#10b981'; }}
              onMouseLeave={e => { if (!downloading) e.currentTarget.style.background = 'rgba(16,185,129,0.9)'; }}
            >
              <span>{downloading ? '⏳' : '⬇'}</span>
              {downloading ? 'جارٍ التنزيل…' : 'تنزيل كل المعاملات'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-zinc-800/80">
                  {['رقم المعاملة', 'العميل', 'الحالة', 'طريقة الدفع', 'المبلغ'].map((h, i) => (
                    <th
                      key={h}
                      className="px-8 py-5 text-xs uppercase tracking-widest text-zinc-600 font-medium"
                      style={{ textAlign: i === 4 ? 'right' : 'left' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.transactions || []).map((tx, idx) => (
                  <tr
                    key={tx._id}
                    className="border-b border-zinc-800/40 transition-colors duration-150"
                    style={{ animationDelay: `${idx * 40}ms` }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(39,39,42,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-8 py-5">
                      <span className="font-mono text-xs text-zinc-500 bg-zinc-800/50 px-2.5 py-1 rounded-lg">
                        {tx._id?.slice(-10).toUpperCase() || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                        >
                          {(tx.user?.name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{tx.user?.name || 'مستخدم مجهول'}</div>
                          <div className="text-xs text-zinc-600">{tx.user?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium"
                        style={{
                          background: 'rgba(16,185,129,0.08)',
                          color: '#34d399',
                          border: '1px solid rgba(16,185,129,0.18)',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {tx.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-md">
                        تحويل بنكي
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-lg font-semibold text-white tabular-nums">
                        ${Number(tx.totalAmount || 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}

                {(!data?.transactions || data.transactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-zinc-600 text-sm">
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Keyframe for decorative mini bars */}
      <style>{`
        @keyframes barAppear {
          from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
          to   { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
        }
      `}</style>
    </div>
  );
}
