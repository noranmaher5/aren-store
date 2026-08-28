import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

/* ─── Google Font (Space Grotesk) ─────────────────────────────────────────── */
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
    rel="stylesheet"
  />
);

/* ─── Action badge config ──────────────────────────────────────────────────── */
const ACTION_META = {
  MAINTENANCE_ON:       { label: 'Maintenance ON',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  icon: '🔒' },
  MAINTENANCE_OFF:      { label: 'النظام يعمل',        color: '#6366F1', bg: 'rgba(99,102,241,0.08)',  icon: '✅' },
  TOGGLE_STATUS:        { label: 'Account Toggle',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '👤' },
  UPDATE_ROLE:          { label: 'تم تحديث الدور',       color: '#a855f7', bg: 'rgba(168,85,247,0.08)', icon: '🛡️' },
  CONFIRM_ORDER:        { label: 'تم تأكيد الطلب',    color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  icon: '📦' },
  UPDATE_EMAIL_SETTINGS:{ label: 'إعدادات البريد',     color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: '📧' },
  DEFAULT:              { label: 'Action',             color: '#71717a', bg: 'rgba(113,113,122,0.08)',icon: '⚡' },
};

const getMeta = (action) => ACTION_META[action] || ACTION_META.DEFAULT;
const DEFAULT_CAMPAIGN = {
  enabled: true,
  eyebrow: 'Limited time offers',
  titleLine1: 'Big deals.',
  titleLine2: 'Small prices.',
  description: 'Discover real promotions on selected Aren Store subscriptions and digital products.',
  stripTitle: 'Special prices are live right now',
  stripText: 'Grab your favorites while these verified promotions are active.',
  showCountdown: false,
  countdownEndsAt: '',
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminSettings() {
  const [activeTab, setActiveTab]             = useState('general');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailSettings, setEmailSettings]     = useState({
    orderConfirmation: true,
    welcomeEmail:      true,
    lowStockAlert:     true,
    adminNewOrder:     false,
  });
  const [promotionCampaign, setPromotionCampaign] = useState(DEFAULT_CAMPAIGN);
  const [bankTransfer, setBankTransfer] = useState({ enabled: true, whatsapp: '', instructions: 'حوّل المبلغ ثم ارفع صورة التحويل أو أرسلها عبر واتساب.', accounts: [] });
  const [savingBankTransfer, setSavingBankTransfer] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [toggling, setToggling]               = useState(false);
  const [togglingEmail, setTogglingEmail]     = useState(null); 
  const [logs, setLogs]                       = useState([]);
  const [loadingLogs, setLoadingLogs]         = useState(false);

  /* ── Fetch settings ───────────────────────────────────────────────────── */
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await adminAPI.getDashboard();
      if (res.data.success) {
        setMaintenanceMode(res.data.stats.maintenanceMode ?? false);
        if (res.data.stats.emailNotifications) {
          setEmailSettings(res.data.stats.emailNotifications);
        }
        const savedCampaign = res.data.stats.promotionCampaign || {};
        setPromotionCampaign({ ...DEFAULT_CAMPAIGN, ...savedCampaign, countdownEndsAt: toDateTimeLocal(savedCampaign.countdownEndsAt) });
        const savedBank = res.data.stats.bankTransfer || {};
        setBankTransfer({
          enabled: savedBank.enabled !== false,
          whatsapp: savedBank.whatsapp || '',
          instructions: savedBank.instructions || 'حوّل المبلغ ثم ارفع صورة التحويل أو أرسلها عبر واتساب.',
          accounts: Array.isArray(savedBank.accounts) && savedBank.accounts.length
            ? savedBank.accounts.map(account => ({ ...account, enabled: account.enabled !== false }))
            : []
        });
      }
    } catch {
      toast.error('تعذر تحميل الإعدادات');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await adminAPI.getLogs();
      if (res.data.success) setLogs(res.data.logs);
    } catch {
      toast.error('تعذر تحميل سجل النشاط');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  
  const silentRefreshLogs = useCallback(async () => {
    try {
      const res = await adminAPI.getLogs();
      if (res.data.success) {
        setLogs(prev => {
          const prevIds = prev.map(l => l._id).join(',');
          const nextIds = res.data.logs.map(l => l._id).join(',');
          
          if (prevIds === nextIds) return prev;
          return res.data.logs;
        });
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (activeTab === 'logs') fetchLogs(); }, [activeTab, fetchLogs]);


  useEffect(() => {
    if (activeTab !== 'logs') return;
    const interval = setInterval(silentRefreshLogs, 20000);
    return () => clearInterval(interval);
  }, [activeTab, silentRefreshLogs]);

  /* ── Toggle maintenance ───────────────────────────────────────────────── */
  const toggleMaintenance = async () => {
    setToggling(true);
    const next = !maintenanceMode;
    try {
      await adminAPI.updateSettings({ maintenanceMode: next });
      setMaintenanceMode(next);
      toast.success(next ? '🔒 Maintenance activated' : '✅ Store is live', {
        style: { background: '#0a0a0a', color: '#fff', border: '1px solid #27272a', fontFamily: 'Space Grotesk, sans-serif' }
      });
    } catch {
      toast.error('فشل التحديث');
    } finally {
      setToggling(false);
    }
  };

  const savePromotionCampaign = async () => {
    setSavingCampaign(true);
    try {
      const response = await adminAPI.updateSettings({
        promotionCampaign: {
          ...promotionCampaign,
          countdownEndsAt: promotionCampaign.countdownEndsAt || null,
        }
      });
      if (response.data?.promotionCampaign) {
        const savedCampaign = response.data.promotionCampaign;
        setPromotionCampaign({ ...DEFAULT_CAMPAIGN, ...savedCampaign, countdownEndsAt: toDateTimeLocal(savedCampaign.countdownEndsAt) });
      }
      toast.success('تم حفظ محتوى صفحة العروض');
    } catch {
      toast.error('تعذر حفظ محتوى صفحة العروض');
    } finally {
      setSavingCampaign(false);
    }
  };

  const saveBankTransfer = async () => {
    setSavingBankTransfer(true);
    try {
      const response = await adminAPI.updateSettings({ bankTransfer });
      if (response.data?.bankTransfer) {
        setBankTransfer({
          enabled: response.data.bankTransfer.enabled !== false,
          whatsapp: response.data.bankTransfer.whatsapp || '',
          instructions: response.data.bankTransfer.instructions || '',
          accounts: response.data.bankTransfer.accounts || []
        });
      }
      toast.success('تم حفظ أرقام التحويل');
    } catch {
      toast.error('تعذر حفظ أرقام التحويل');
    } finally {
      setSavingBankTransfer(false);
    }
  };

  const updateAccount = (index, key, value) => {
    setBankTransfer(current => ({
      ...current,
      accounts: current.accounts.map((account, i) => i === index ? { ...account, [key]: value } : account)
    }));
  };

  /* ── Toggle a single email setting ────────────────────────────── */
  const toggleEmailSetting = async (key) => {
    setTogglingEmail(key);
    const next = !emailSettings[key];
    const optimistic = { ...emailSettings, [key]: next };
    setEmailSettings(optimistic); // optimistic update
    try {
      await adminAPI.updateSettings({ emailNotifications: { [key]: next } });
      toast.success(next ? '📧 Enabled' : '🔕 Disabled', {
        style: { background: '#0a0a0a', color: '#fff', border: '1px solid #27272a', fontFamily: 'Space Grotesk, sans-serif' }
      });
    } catch {
      setEmailSettings(emailSettings); // rollback
      toast.error('تعذر حفظ إعداد البريد الإلكتروني');
    } finally {
      setTogglingEmail(null);
    }
  };

  /* ── Tabs config ──────────────────────────────────────────────────────── */
  const tabs = [
    { id: 'general',  label: 'General',     icon: '⚙️' },
    { id: 'logs',     label: 'Activity Log', icon: '📋' },
  ];

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <FontLink />
      <style>{`
        .sg { font-family: 'Space Grotesk', sans-serif; }
        .sm { font-family: 'Space Mono', monospace; }
        .glass-card {
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .glass-card-hover:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0  rgba(239,68,68,0); }
        }
        .pulse-ring { animation: pulse-ring 2s ease infinite; }
      `}</style>

      <div dir="rtl" className="sg min-h-screen bg-[#080808] text-white pt-24 pb-20 px-5 md:px-10">
        <div className="max-w-4xl mx-auto">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="mb-10 fade-up">
            <p className="sm text-[10px] tracking-[0.35em] text-zinc-600 uppercase mb-3">
              الإدارة › إعدادات النظام
            </p>
            <div className="flex items-end justify-between gap-4">
              <h1 style={{ fontWeight: 700, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                الإعدادات
              </h1>
              {/* live status pill */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
                <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-red-500' : 'bg-emerald-500'} ${maintenanceMode ? '' : 'animate-pulse'}`} />
                <span className="sm text-[10px] tracking-widest text-zinc-400 uppercase">
                  {maintenanceMode ? 'صيانة' : 'يعمل'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 rounded-2xl glass-card mb-8 w-fit fade-up" style={{ animationDelay: '0.05s' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{ transition: 'all 0.25s ease' }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide ${
                  activeTab === t.id
                    ? 'bg-white text-black shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span style={{ fontSize: '14px' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              GENERAL TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'general' && (
            <div className="fade-up space-y-4" style={{ animationDelay: '0.1s' }}>

              {loadingSettings ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                </div>
              ) : (
                <>
                  {/* ── Maintenance card ──────────────────────────────── */}
                  <div
                    className="rounded-3xl p-8 transition-all duration-500"
                    style={{
                      background: maintenanceMode
                        ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(8,8,8,0) 60%)'
                        : 'rgba(255,255,255,0.025)',
                      border: maintenanceMode
                        ? '1px solid rgba(239,68,68,0.2)'
                        : '1px solid rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-6">
                      {/* Left info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                              maintenanceMode ? 'bg-red-500/15 pulse-ring' : 'bg-white/5'
                            }`}
                            style={{ transition: 'all 0.4s ease' }}
                          >
                            {maintenanceMode ? '🔒' : '🌐'}
                          </div>
                          <div>
                            <h3 style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.02em' }}>
                              Maintenance Mode
                            </h3>
                            {maintenanceMode && (
                              <span className="sm text-[9px] tracking-widest text-red-400 uppercase">
                                ● Active
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-sm" style={{ fontWeight: 400 }}>
                          يمنع الوصول العام إلى المتجر. يستطيع المسؤولون فقط التصفح أثناء تفعيله.
                        </p>
                      </div>

                      {/* Toggle switch */}
                      <button
                        onClick={toggleMaintenance}
                        disabled={toggling}
                        aria-label="Toggle maintenance mode"
                        style={{
                          width: '56px', height: '30px', borderRadius: '999px',
                          position: 'relative', flexShrink: 0,
                          background: maintenanceMode ? '#ef4444' : 'rgba(255,255,255,0.08)',
                          border: maintenanceMode ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                          opacity: toggling ? 0.5 : 1,
                          cursor: toggling ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: maintenanceMode ? 'calc(100% - 27px)' : '3px',
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          transition: 'left 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                      </button>
                    </div>

                    {/* Active warning banner */}
                    {maintenanceMode && (
                      <div
                        className="mt-6 p-4 rounded-2xl flex items-center gap-3"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                      >
                        <span>⚠️</span>
                        <p className="sm text-xs text-red-400 font-semibold tracking-wide">
                          STORE IS IN MAINTENANCE — Public access is currently blocked
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Email Notifications card ──────────────────── */}
                  {false && (()=>{
                    const emailItems = [
                      {
                        key: 'orderConfirmation',
                        icon: '📦',
                                title: 'تأكيد الطلب',
                        desc: 'Send customer their digital codes once an order is confirmed.',
                      },
                      {
                        key: 'welcomeEmail',
                        icon: '👋',
                        title: 'رسالة ترحيب',
                        desc: "Send a welcome message to every new user after registration.",
                      },
                      {
                        key: 'lowStockAlert',
                        icon: '⚠️',
                        title: 'تنبيه انخفاض المخزون',
                        desc: 'إشعار المسؤول عند انخفاض مخزون المنتج إلى 5 أو أقل.',
                      },
                      {
                        key: 'adminNewOrder',
                        icon: '🛒',
                        title: 'تنبيه طلب جديد',
                        desc: 'إرسال بريد للإدارة عند إنشاء العميل طلباً جديداً.',
                      },
                    ];
                    return (
                      <div
                        className="rounded-3xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                      >
                        {/* card header */}
                        <div className="flex items-center gap-3 px-8 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                            📧
                          </div>
                          <div>
          <h3 style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.02em' }}>إشعارات البريد الإلكتروني</h3>
                            <p className="sm text-[10px] tracking-wide text-zinc-600">رسائل النظام التلقائية</p>
                          </div>
                        </div>

                        {/* rows */}
                        {emailItems.map((item, idx) => {
                          const isOn      = emailSettings[item.key];
                          const isSaving  = togglingEmail === item.key;
                          return (
                            <div
                              key={item.key}
                              className="flex items-center gap-5 px-8 py-5"
                              style={{
                                borderBottom: idx < emailItems.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                background: isOn ? 'transparent' : 'rgba(0,0,0,0.15)',
                                transition: 'background 0.3s'
                              }}
                            >
                              {/* icon */}
                              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>

                              {/* text */}
                              <div className="flex-1 min-w-0">
                                <p style={{ fontWeight: 600, fontSize: '13px', color: isOn ? '#e4e4e7' : '#52525b', transition: 'color 0.3s', letterSpacing:'-0.01em' }}>
                                  {item.title}
                                </p>
                                <p style={{ fontSize: '12px', color: '#3f3f46', marginTop: '2px', fontWeight: 400 }}>
                                  {item.desc}
                                </p>
                              </div>

                              {/* status label */}
                              <span
                                className="sm text-[9px] font-bold uppercase tracking-widest flex-shrink-0 mr-2"
                                style={{ color: isOn ? '#6366F1' : '#3f3f46', transition: 'color 0.3s' }}
                              >
                                {isOn ? 'ON' : 'OFF'}
                              </span>

                              {/* toggle */}
                              <button
                                onClick={() => toggleEmailSetting(item.key)}
                                disabled={isSaving}
                                aria-label={`Toggle ${item.title}`}
                                style={{
                                  width: '48px', height: '26px', borderRadius: '999px', flexShrink: 0,
                                  position: 'relative',
                                  background: isOn ? '#6366F1' : 'rgba(255,255,255,0.06)',
                                  border: isOn ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                  opacity: isSaving ? 0.5 : 1,
                                  cursor: isSaving ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                                }}
                              >
                                <div style={{
                                  position: 'absolute', top: '3px',
                                  left: isOn ? 'calc(100% - 23px)' : '3px',
                                  width: '18px', height: '18px', borderRadius: '50%',
                                  background: 'white',
                                  boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
                                  transition: 'left 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                                }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(255,255,255,0.025))', border: '1px solid rgba(239,68,68,0.18)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-start justify-between gap-4 mb-7">
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '15px' }}>حملة صفحة العروض</h3>
                        <p className="text-zinc-500 text-sm mt-1">تحكم في الواجهة والشريط الترويجي الظاهرين في صفحة العروض.</p>
                      </div>
                      <button type="button" onClick={() => setPromotionCampaign(p => ({ ...p, enabled: !p.enabled }))} className={`px-3 py-1.5 rounded-full text-xs font-bold ${promotionCampaign.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {promotionCampaign.enabled ? 'ظاهر' : 'مخفي'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ['eyebrow', 'Small label'], ['titleLine1', 'Headline line 1'], ['titleLine2', 'Headline line 2'],
                        ['description', 'Hero description'], ['stripTitle', 'Strip title'], ['stripText', 'Strip text'],
                      ].map(([key, label]) => (
                        <label key={key} className={key === 'description' || key === 'stripText' ? 'md:col-span-2' : ''}>
                          <span className="block text-xs text-zinc-500 mb-2">{label}</span>
                          {key === 'description' || key === 'stripText' ? (
                            <textarea rows={2} value={promotionCampaign[key]} onChange={e => setPromotionCampaign(p => ({ ...p, [key]: e.target.value }))} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-400/60" />
                          ) : (
                            <input value={promotionCampaign[key]} onChange={e => setPromotionCampaign(p => ({ ...p, [key]: e.target.value }))} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-400/60" />
                          )}
                        </label>
                      ))}
                      <label className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
                        <input type="checkbox" checked={promotionCampaign.showCountdown} onChange={e => setPromotionCampaign(p => ({ ...p, showCountdown: e.target.checked }))} />
                        <span className="text-sm text-zinc-300">إظهار العد التنازلي</span>
                      </label>
                      <label>
                        <span className="block text-xs text-zinc-500 mb-2">تنتهي الحملة في</span>
                        <input type="datetime-local" value={promotionCampaign.countdownEndsAt || ''} onChange={e => setPromotionCampaign(p => ({ ...p, countdownEndsAt: e.target.value }))} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none" />
                      </label>
                    </div>
                    <button type="button" onClick={savePromotionCampaign} disabled={savingCampaign} className="mt-6 px-5 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 disabled:opacity-50">
                      {savingCampaign ? 'جارٍ الحفظ…' : 'حفظ حملة العروض'}
                    </button>
                  </div>

                  <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '15px' }}>أرقام التحويل البنكي</h3>
                        <p className="text-zinc-500 text-sm mt-1">تظهر للعميل في صفحة الدفع وصفحة الطلب كبديل لبوابة الدفع.</p>
                      </div>
                      <button type="button" onClick={() => setBankTransfer(current => ({ ...current, enabled: !current.enabled }))} className={`px-3 py-1.5 rounded-full text-xs font-bold ${bankTransfer.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {bankTransfer.enabled ? 'مفعّل' : 'متوقف'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <label>
                        <span className="block text-xs text-zinc-500 mb-2">واتساب استلام السكرين</span>
                        <input dir="ltr" value={bankTransfer.whatsapp} onChange={e => setBankTransfer(current => ({ ...current, whatsapp: e.target.value }))} placeholder="+9665xxxxxxxx" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none" />
                      </label>
                      <label className="md:col-span-2">
                        <span className="block text-xs text-zinc-500 mb-2">تعليمات التحويل</span>
                        <textarea rows={2} value={bankTransfer.instructions} onChange={e => setBankTransfer(current => ({ ...current, instructions: e.target.value }))} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none" />
                      </label>
                    </div>
                    <div className="space-y-4">
                      {bankTransfer.accounts.map((account, index) => (
                        <div key={account.id || index} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-bold">حساب {index + 1}</p>
                            <button type="button" onClick={() => setBankTransfer(current => ({ ...current, accounts: current.accounts.filter((_, i) => i !== index) }))} className="text-xs text-rose-400">حذف</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              ['label', 'الاسم الظاهر', 'InstaPay / البنك الأهلي'],
                              ['bankName', 'اسم البنك', ''],
                              ['accountName', 'اسم صاحب الحساب', ''],
                              ['accountNumber', 'رقم الحساب / المحفظة', ''],
                              ['iban', 'IBAN', ''],
                              ['currency', 'العملة', 'SAR'],
                            ].map(([key, label, placeholder]) => (
                              <label key={key}>
                                <span className="block text-xs text-zinc-500 mb-1">{label}</span>
                                <input dir="ltr" value={account[key] || ''} placeholder={placeholder} onChange={e => updateAccount(index, key, e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
                              </label>
                            ))}
                            <label className="md:col-span-2">
                              <span className="block text-xs text-zinc-500 mb-1">ملاحظة للعميل</span>
                              <input value={account.notes || ''} onChange={e => updateAccount(index, 'notes', e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={() => setBankTransfer(current => ({ ...current, accounts: [...current.accounts, { id: crypto.randomUUID?.() || String(Date.now()), label: '', bankName: '', accountName: '', accountNumber: '', iban: '', currency: 'SAR', notes: '', enabled: true }] }))} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-zinc-300">إضافة رقم تحويل</button>
                      <button type="button" onClick={saveBankTransfer} disabled={savingBankTransfer} className="px-5 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold disabled:opacity-50">{savingBankTransfer ? 'جارٍ الحفظ…' : 'حفظ أرقام التحويل'}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              LOGS TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'logs' && (
            <div className="fade-up" style={{ animationDelay: '0.1s' }}>
              {/* header row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.02em' }}>نشاط الإدارة</h2>
                  <p className="text-zinc-600 text-xs mt-0.5">كل الإجراءات المصرح بها · الأحدث أولاً</p>
                </div>
                <button
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white glass-card glass-card-hover transition-all"
                >
                  <span style={{ display: 'inline-block', transform: loadingLogs ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s' }}>↻</span>
                  {loadingLogs ? 'جارٍ التحميل…' : 'تحديث'}
                </button>
              </div>

              {/* log list */}
              <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4 opacity-15">📋</div>
                    <p className="text-zinc-700 text-sm">لم يتم تسجيل أي نشاط بعد.</p>
                  </div>
                ) : (
                  <div>
                    {logs.map((log, idx) => {
                      const meta = getMeta(log.action);
                      return (
                        <div
                          key={log._id || idx}
                          className="group flex items-start gap-4 px-7 py-5 transition-all"
                          style={{
                            borderBottom: idx < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Icon bubble */}
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm mt-0.5"
                            style={{ background: meta.bg, border: `1px solid ${meta.color}25` }}
                          >
                            {meta.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span style={{ fontWeight: 600, fontSize: '13px', color: '#e4e4e7' }}>
                                {log.adminName || 'غير معروف'}
                              </span>
                              <span
                                className="sm text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ color: meta.color, background: meta.bg }}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <p className="sm text-xs truncate" style={{ color: '#52525b', letterSpacing: '0.01em' }}>
                              {log.target}
                            </p>
                            {log.details && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: '#3f3f46', fontWeight: 400 }}>
                                {log.details}
                              </p>
                            )}
                          </div>

                          {/* Time */}
                          <span
                            className="sm text-[10px] flex-shrink-0 mt-1 group-hover:opacity-80 transition-opacity"
                            style={{ color: '#3f3f46', letterSpacing: '0.05em' }}
                          >
                            {relativeTime(log.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SECURITY TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div className="fade-up" style={{ animationDelay: '0.1s' }}>
              <div
                className="rounded-3xl p-12 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-5xl mb-5 opacity-30">🔐</div>
                <h3 style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                  Advanced Security
                </h3>
                <p className="text-zinc-600 text-sm max-w-xs mx-auto" style={{ fontWeight: 400 }}>
                  Two-factor auth, IP whitelisting, session management & role audit logs — arriving soon.
                </p>
                <div
                  className="sm mt-8 inline-block px-5 py-2 rounded-full text-[10px] tracking-[0.3em] uppercase"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  Locked
                </div>
              </div>
            </div>
          )}

       
        </div>
      </div>
    </>
  );
}
