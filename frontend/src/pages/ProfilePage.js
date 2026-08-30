import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, orderAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import userDefaultAvatar from '../assets/user.png';

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --bg-base:       #030405;
      --bg-card:       #0e1011;
      --bg-sidebar:    #0a0c0d;
      --bg-surface:    #111315;
      --bg-row:        #101214;
      --border-soft:   rgba(185,140,255,.16);
      --border-dim:    rgba(255,255,255,.07);
      --accent-orange: #b98cff;
      --accent-green:  #6366F1;
      --accent-lime:   #e9ddff;
      --text-primary:  #f5f4ef;
      --text-secondary:#9b94a8;
      --text-dim:      #686174;
      --text-muted:    #443c50;
    }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    @keyframes glow     { 0%,100%{box-shadow:0 0 10px var(--accent-orange)30} 50%{box-shadow:0 0 20px var(--accent-orange)60} }

    .fu  { animation: fadeUp .42s cubic-bezier(.22,.68,0,1.2) both }
    .fu1 { animation: fadeUp .42s .05s cubic-bezier(.22,.68,0,1.2) both }
    .fu2 { animation: fadeUp .42s .10s cubic-bezier(.22,.68,0,1.2) both }
    .fu3 { animation: fadeUp .42s .15s cubic-bezier(.22,.68,0,1.2) both }
    .fu4 { animation: fadeUp .42s .20s cubic-bezier(.22,.68,0,1.2) both }
    .spin-icon { animation: spin .75s linear infinite }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 4px }
    ::-webkit-scrollbar-track { background: transparent }
    ::-webkit-scrollbar-thumb { background: var(--border-soft); border-radius: 4px }

    /* ── Inputs ── */
    .profile-input {
      width: 100%;
      background: var(--bg-row);
      border: 1px solid var(--border-soft);
      border-radius: 10px;
      padding: 12px 16px;
      color: var(--text-primary);
      font-size: 13.5px;
      font-family: 'Manrope', sans-serif;
      outline: none;
      transition: border-color .2s, box-shadow .2s, background .2s;
      box-sizing: border-box;
      letter-spacing: .01em;
    }
    .profile-input::placeholder { color: var(--text-dim) }
    .profile-input:focus {
      border-color: var(--accent-orange);
      box-shadow: 0 0 0 3px rgba(249,115,22,.1);
      background: #13170f;
    }
    .profile-input:disabled { opacity: .3; cursor: not-allowed }

    /* ── Save Button ── */
    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #4F46E5, #4338CA);
      color: #fff;
      border: 1px solid rgba(86,114,69,.4);
      border-radius: 10px;
      padding: 11px 24px;
      font-family: 'Manrope', sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s;
      letter-spacing: .02em;
    }
    .btn-save:hover:not(:disabled) {
      background: linear-gradient(135deg, #6366F1, #4F46E5);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(86,114,69,.25);
    }
    .btn-save:active:not(:disabled) { transform: translateY(0) }
    .btn-save:disabled { opacity: .4; cursor: not-allowed }

    /* ── Nav Buttons ── */
    .nav-btn {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: none;
      background: transparent;
      font-family: 'Manrope', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      white-space: nowrap;
      transition: all .18s;
      position: relative;
      letter-spacing: .01em;
    }
    .nav-btn.active {
      background: rgba(249,115,22,.08);
      color: var(--accent-lime);
      border: 1px solid rgba(249,115,22,.12);
    }
    .nav-btn.inactive { color: var(--text-secondary) }
    .nav-btn.inactive:hover {
      color: var(--text-primary);
      background: rgba(255,255,255,.03);
    }
    .nav-btn.disabled { color: var(--text-dim); cursor: not-allowed; opacity: .5 }
    .nav-btn.active .nav-indicator {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent-orange);
      margin-left: auto;
      flex-shrink: 0;
    }

    /* ── Mobile Tab Bar ── */
    .mobile-nav-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      flex: 1;
      padding: 9px 4px;
      border: none;
      background: transparent;
      font-family: 'Manrope', sans-serif;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-secondary);
      transition: color .18s;
      position: relative;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .mobile-nav-btn.active { color: var(--text-primary) }
    .mobile-nav-btn.disabled { color: var(--text-dim); cursor: not-allowed; opacity: .5 }
    .mobile-nav-btn.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 2px;
      border-radius: 0 0 3px 3px;
      background: var(--accent-orange);
    }

    /* ── Order Cards ── */
    .order-card {
      border-radius: 14px;
      border: 1px solid var(--border-soft);
      background: var(--bg-row);
      padding: 0;
      overflow: hidden;
      transition: border-color .2s, transform .15s, box-shadow .2s;
      cursor: default;
    }
    .order-card:hover {
      border-color: rgba(249,115,22,.2);
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(0,0,0,.3);
    }

    .wishlist-card {
      border-radius: 14px;
      border: 1px solid var(--border-soft);
      background: var(--bg-row);
      overflow: hidden;
      transition: border-color .2s, transform .15s, box-shadow .2s;
    }
    .wishlist-card:hover {
      border-color: rgba(249,115,22,.2);
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(0,0,0,.3);
    }
    .order-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      gap: 12px;
    }
    .order-card-bottom {
      border-top: 1px solid var(--border-dim);
      padding: 11px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0,0,0,.15);
    }
    .order-number {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      font-weight: 500;
      color: var(--accent-lime);
      letter-spacing: .04em;
    }
    .order-amount {
      font-family: 'Manrope', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -.01em;
    }
    .order-amount-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: .08em;
      font-family: 'Manrope', sans-serif;
    }
    .order-date {
      font-size: 11.5px;
      color: var(--text-secondary);
      font-family: 'Manrope', sans-serif;
    }

    /* ── Avatar Upload ── */
    .avatar-upload-btn {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-orange);
      border: 2px solid var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background .2s, transform .15s;
      z-index: 10;
    }
    .avatar-upload-btn:hover {
      background: #ea6c0a;
      transform: scale(1.1);
    }

    /* ── Section Header ── */
    .section-eyebrow {
      font-family: 'Manrope', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -.01em;
      margin: 0;
    }

    /* ── Field Label ── */
    .field-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 8px;
      font-family: 'Manrope', sans-serif;
      text-transform: uppercase;
      letter-spacing: .1em;
    }

    /* ── Divider ── */
    .divider-accent {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-soft), transparent);
      margin: 24px 0;
    }

    /* ── Empty State ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      text-align: center;
      gap: 12px;
    }
    .empty-icon-box {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    /* ── Stats Row ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: var(--bg-row);
      border: 1px solid var(--border-soft);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .stat-value {
      font-family: 'Manrope', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .stat-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: .1em;
      margin-top: 2px;
      font-family: 'Manrope', sans-serif;
    }

    /* ── Orders Grid ── */
    .orders-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    /* ── Layout ── */
    .profile-layout { display: flex; min-height: 560px }
    .profile-sidebar { width: 236px; flex-shrink: 0; display: flex; flex-direction: column }
    .profile-content { flex: 1; padding: 36px 40px; min-width: 0 }
    .mobile-tab-bar { display: none }

    /* ── Password Strength ── */
    .strength-bar {
      height: 3px;
      border-radius: 2px;
      background: var(--border-soft);
      overflow: hidden;
      margin-top: 8px;
    }
    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: width .3s, background .3s;
    }

    @media (max-width: 820px) {
      .orders-grid { grid-template-columns: 1fr }
      .profile-content { padding: 28px 24px }
    }

    @media (max-width: 768px) {
      .profile-layout { flex-direction: column; min-height: unset }
      .profile-sidebar { width: 100%; border-right: none !important; border-bottom: 1px solid var(--border-soft) }
      .sidebar-nav-desktop { display: none !important }
      .mobile-tab-bar { display: flex; background: var(--bg-sidebar); border-top: 1px solid var(--border-soft); padding: 4px 8px }
      .profile-content { padding: 24px 20px }
      .sidebar-bottom-accent { display: none }
      .sidebar-user-info { flex-direction: row !important; align-items: center !important; gap: 14px; padding: 16px 20px !important }
      .sidebar-user-text { margin-top: 0 !important }
      .stats-row { grid-template-columns: repeat(3, 1fr) }
    }

    @media (max-width: 540px) {
      .profile-wrapper { padding: 16px 12px 0 !important }
      .profile-card { border-radius: 16px !important }
      .profile-content { padding: 20px 16px !important }
      .sidebar-user-info { padding: 14px 16px !important }
      .avatar-preview-box { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important }
      .btn-save { width: 100%; justify-content: center }
      .stats-row { grid-template-columns: 1fr 1fr }
      .stat-card:last-child { grid-column: 1 / -1 }
      .order-card-top { flex-wrap: wrap }
    }

    @media (max-width: 360px) {
      .mobile-nav-btn span { display: none }
      .mobile-nav-btn { padding: 12px 4px }
    }

    /* Final Aren purple theme overrides for legacy inline styles */
    .profile-page-shell { background: #030405 !important; color: #f5f4ef !important; }
    .profile-wrapper { max-width: 1080px !important; }
    .profile-card { background: linear-gradient(145deg,#111315,#0a0b0c) !important; border-color: rgba(185,140,255,.18) !important; }
    .profile-sidebar { background: #0a0c0d !important; border-color: rgba(185,140,255,.14) !important; }
    .profile-content { background: transparent !important; }
    .avatar-preview-box { background: #0e1011 !important; border-color: rgba(185,140,255,.14) !important; }
    .profile-input { background: #101214 !important; border-color: rgba(255,255,255,.1) !important; }
    .profile-input:focus { border-color: #b98cff !important; box-shadow: 0 0 0 3px rgba(185,140,255,.13) !important; }
    .btn-save { background: linear-gradient(135deg,#6366F1,#4F46E5) !important; border-color: rgba(185,140,255,.35) !important; }
    .btn-save:hover:not(:disabled) { background: linear-gradient(135deg,#818CF8,#6366F1) !important; box-shadow: 0 8px 24px rgba(99,102,241,.25) !important; }
    .nav-btn.active { background: rgba(185,140,255,.1) !important; border-color: rgba(185,140,255,.22) !important; color: #e9ddff !important; }
    .nav-btn.active .nav-indicator, .mobile-nav-btn.active::before { background: #b98cff !important; }
    .mobile-tab-bar { background: #0a0c0d !important; border-color: rgba(185,140,255,.14) !important; }
    .order-card, .wishlist-card, .stat-card { background: #101214 !important; border-color: rgba(255,255,255,.09) !important; }
    .profile-content { padding: 40px 44px !important; }
    .order-card:hover, .wishlist-card:hover { border-color: rgba(185,140,255,.38) !important; box-shadow: 0 12px 30px rgba(0,0,0,.35) !important; }
    .empty-icon-box { background: #111315 !important; border-color: rgba(185,140,255,.16) !important; }
    .profile-page-shell [style*="#f97316"], .profile-page-shell [style*="rgba(249,115,22"], .profile-page-shell [style*="#ea6c0a"] { color: #b98cff !important; background-color: rgba(185,140,255,.1) !important; border-color: rgba(185,140,255,.3) !important; }
    .profile-page-shell [style*="#3a4a2a"], .profile-page-shell [style*="#4a5a3a"], .profile-page-shell [style*="#6b7c5a"], .profile-page-shell [style*="#2a3420"] { color: #83798f !important; }
    .profile-page-shell [style*="rgba(34,197,94"], .profile-page-shell [style*="#22c55e"] { color: #b98cff !important; background-color: rgba(185,140,255,.1) !important; border-color: rgba(185,140,255,.3) !important; }
    @media (max-width: 768px) { .profile-content { padding: 24px 20px !important; } }
    @media (max-width: 540px) { .profile-content { padding: 20px 16px !important; } }
  `}</style>
);

// ── Role Config ──────────────────────────────────────────────────────────────
const ROLE_LEVEL = { user:0, editor:1, admin:2, manager:3, 'co-owner':4, owner:5 , hidden:6 };

const ROLE_CONFIG = {
  user:       { color:'#8892A4', bg:'rgba(136,146,164,0.1)',  border:'rgba(136,146,164,0.2)',  label:'مستخدم',     icon:'👤' },
  editor:     { color:'#60a5fa', bg:'rgba(96,165,250,0.1)',   border:'rgba(96,165,250,0.2)',   label:'محرر',   icon:'✏️' },
  admin:      { color:'#c084fc', bg:'rgba(192,132,252,0.1)',  border:'rgba(192,132,252,0.2)',  label:'مسؤول',    icon:'⚙️' },
  manager:    { color:'#fbbf24', bg:'rgba(251,191,36,0.1)',   border:'rgba(251,191,36,0.2)',   label:'مدير',  icon:'🛡️' },
  'co-owner': { color:'#f472b6', bg:'rgba(244,114,182,0.1)',  border:'rgba(244,114,182,0.2)',  label:'شريك مالك', icon:'👑' },
  owner:      { color:'#b98cff', bg:'rgba(185,140,255,0.12)',  border:'rgba(185,140,255,0.25)',  label:'مالك',    icon:'⚡' },
  hidden:     { color:'#6b7280', bg:'rgba(107,114,128,0.1)', border:'rgba(107,114,128,0.2)', label:'مخفي',   icon:'🌟' },
};

// ── Status Config ─────────────────────────────────────────────────────────────
// ── useWindowSize ────────────────────────────────────────────────────────────
const useWindowSize = () => {
  const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1200 });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
};

// ── Avatar Component ─────────────────────────────────────────────────────────
const Avatar = ({ user, size = 64, canEdit = false, onUpload }) => {
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.user;
  const isHighRole = (ROLE_LEVEL[user?.role] || 0) >= 2;

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      {isHighRole && (
        <div style={{
          position:'absolute', inset:-3, borderRadius:'50%',
          border:`2px solid ${cfg.color}`,
          boxShadow:`0 0 18px ${cfg.color}35`,
          zIndex:1, pointerEvents:'none',
        }} />
      )}
      <div className="aren-profile-shell" style={{
        width:size, height:size, borderRadius:'50%', overflow:'hidden', position:'relative',
        border:`2px solid ${isHighRole ? cfg.color + '50' : '#2a3420'}`,
      }}>
        <img src={user?.avatar || userDefaultAvatar} alt="avatar"
          style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        {isHighRole && !user?.avatar && (
          <div style={{
            position:'absolute', inset:0,
            background:`linear-gradient(135deg, ${cfg.color}20, transparent)`,
            display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:4,
          }}>
            <span style={{ fontSize:size * 0.22, lineHeight:1 }}>{cfg.icon}</span>
          </div>
        )}
      </div>
      {canEdit && (
        <label className="avatar-upload-btn" title="Change avatar">
          <input type="file" accept="image/*" style={{display:'none'}} onChange={onUpload} />
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </label>
      )}
    </div>
  );
};

// ── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const isHighRole = (ROLE_LEVEL[role] || 0) >= 2;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      fontSize:10, fontWeight:700, padding:'3px 10px',
      borderRadius:6, fontFamily:'Manrope,sans-serif',
      letterSpacing:'.1em', textTransform:'uppercase',
      color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`,
      boxShadow:isHighRole ? `0 0 10px ${cfg.color}20` : 'none',
    }}>
      {isHighRole && <span style={{fontSize:10}}>{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
};

// ── Status Badge (upgraded) ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'account',  label:'حسابي', mobileLabel:'الحساب'  },
  { id:'orders',   label:'طلباتي',     mobileLabel:'الطلبات'   },
  { id:'wishlist', label:'المفضلة',   mobileLabel:'المفضلة' },
  { id:'security', label:'الأمان',   mobileLabel:'الأمان' },
  { id:'rewards',  label:'المكافآت',    mobileLabel:'المكافآت', soon:true },
];

const NAV_ICONS = {
  account:  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  orders:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  wishlist: <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 10-6.364-6.364L12 6.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
  security: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
  rewards:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom:30 }}>
    <h2 className="section-eyebrow">{title}</h2>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
      <div style={{ width:24, height:2, borderRadius:2, background:'#f97316', flexShrink:0 }} />
      <span style={{ fontSize:11.5, color:'#3a4a2a', fontFamily:'Manrope,sans-serif', letterSpacing:'.03em' }}>{sub}</span>
    </div>
  </div>
);

const Label = ({ children }) => (
  <label className="field-label">{children}</label>
);

// ── Account Tab ──────────────────────────────────────────────────────────────
const AccountTab = ({ user, updateUser, onAvatarChange }) => {
  const [name, setName]     = useState(user?.name || '');
  const [phone, setPhone]   = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const canEditAvatar = (ROLE_LEVEL[user?.role] || 0) >= 1;

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be less than 2MB');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      onAvatarChange?.(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, phone };
      if (canEditAvatar) payload.avatar = avatar;
      const res = await authAPI.updateProfile(payload);
      updateUser({ name:res.data.user.name, phone:res.data.user.phone, avatar:res.data.user.avatar });
      onAvatarChange?.(res.data.user.avatar);
      toast.success('تم تحديث الحساب بنجاح');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث الحساب');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fu">
      <SectionTitle title="حسابي" sub="إدارة بياناتك الشخصية" />

      {/* Avatar Box */}
      <div className="avatar-preview-box" style={{
        display:'flex', alignItems:'center', gap:20, marginBottom:32,
        padding:'20px 24px', background:'#0c0f08', borderRadius:16,
        border:'1px solid #1e2517', position:'relative', overflow:'hidden'
      }}>
        {/* decorative corner */}
        <div style={{
          position:'absolute', top:0, right:0, width:100, height:100,
          background:'radial-gradient(circle at top right, rgba(249,115,22,0.06), transparent 70%)',
          pointerEvents:'none'
        }} />
        <Avatar user={{...user, avatar}} size={76} canEdit={canEditAvatar} onUpload={handleAvatarUpload} />
        <div style={{minWidth:0}}>
          <p style={{
            fontFamily:'Manrope,sans-serif', fontSize:18, fontWeight:700, color:'#e8f0e0',
            margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
          }}>{user?.name}</p>
          <p style={{ fontSize:12, color:'#3a4a2a', marginTop:3, fontFamily:'Manrope,sans-serif' }}>{user?.email}</p>
          <div style={{marginTop:8, display:'flex', alignItems:'center', gap:8}}>
            <RoleBadge role={user?.role} />
            {!canEditAvatar ? (
              <span style={{fontSize:10.5, color:'#3a4a2a'}}>Avatar locked for regular users</span>
            ) : (
              <span style={{fontSize:10.5, color:'#4F46E5'}}>📷 Click camera icon to update</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:20}}>
        <div>
          <Label>Full Name</Label>
          <input type="text" required className="profile-input" value={name}
            onChange={e => setName(e.target.value)} placeholder="اكتب اسمك الكامل" />
        </div>
        <div>
          <Label>Phone Number</Label>
          <input type="tel" className="profile-input" value={phone}
            onChange={e => setPhone(e.target.value)} placeholder="+20 1xx xxx xxxx" />
        </div>
        <div>
          <Label>Email Address</Label>
          <input type="email" disabled className="profile-input" value={user?.email} />
          <p style={{fontSize:11, color:'#3a4a2a', marginTop:6, fontFamily:'Manrope,sans-serif'}}>
            ⚠ لا يمكن تغيير البريد الإلكتروني
          </p>
        </div>
        <div style={{paddingTop:4}}>
          <button type="submit" disabled={saving} className="btn-save">
            {saving ? (
              <>
                <svg className="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" style={{opacity:.25}}/>
                  <path fill="white" d="M4 12a8 8 0 018-8v8H4z" style={{opacity:.8}}/>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Orders Tab ────────────────────────────────────────────────────────────────
const OrdersTab = ({ user }) => {
  const [openOrderId, setOpenOrderId] = useState(null);
  const orders = [...(user?.orders || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const completed = orders.filter(o =>
    ['completed', 'paid', 'fulfilled'].includes(o.status)
  ).length;
  const totalSpent = orders.reduce(
    (acc, o) => acc + (Number(o.totalAmount) || 0), 0
  );

  const formatMoney = v => `$${Number(v || 0).toFixed(2)}`;
  const formatDate = v =>
    v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const formatTime = v =>
    v ? new Date(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';

  const statusMeta = status => {
    const v = (status || 'pending').toLowerCase();
    if (['completed', 'paid', 'fulfilled'].includes(v))
      return { label: 'مكتمل', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.18)' };
    if (['processing', 'paid_unconfirmed'].includes(v))
      return { label: 'قيد المعالجة', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.18)' };
    if (['cancelled', 'canceled', 'failed'].includes(v))
      return { label: 'ملغى', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.18)' };
    return { label: 'قيد الانتظار', color: '#8892A4', bg: 'rgba(136,146,164,0.08)', border: 'rgba(136,146,164,0.18)' };
  };

  const paymentLabel = () => 'تحويل بنكي';

  if (!orders.length) return (
    <div className="fu">
      <SectionTitle title="طلباتي" sub="سجل مشترياتك" />
      <div className="empty-state">
        <div className="empty-icon-box">
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#3a4a2a" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p style={{ fontSize: 14, color: '#4a5a3a', margin: 0, fontFamily: 'Manrope,sans-serif', fontWeight: 600 }}>
          لا توجد طلبات حتى الآن
        </p>
        <p style={{ fontSize: 12, color: '#3a4a2a', margin: 0, fontFamily: 'Manrope,sans-serif' }}>
          ستظهر مشترياتك هنا
        </p>
      </div>
    </div>
  );

  return (
    <div className="fu">
      <SectionTitle title="طلباتي" sub={`إجمالي الطلبات: ${orders.length}`} />

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الطلبات', value: orders.length },
          { label: 'المكتملة', value: completed },
          { label: 'إجمالي الإنفاق', value: formatMoney(totalSpent) },
        ].map((s, i) => (
          <div key={s.label} className={`fu${i + 1}`} style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: '#111408',
            border: '1px solid #1e2517',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5a3a', textTransform: 'uppercase', letterSpacing: '.12em', fontFamily: 'Manrope,sans-serif' }}>
              {s.label}
            </div>
            <div style={{ marginTop: 8, fontFamily: 'Manrope,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f0e0' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Orders List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.map((order, i) => {
          const meta = statusMeta(order.status);
          const isOpen = openOrderId === order._id;

          return (
            <div
              key={order._id}
              className={`order-card fu${Math.min(i + 1, 4)}`}
              style={{ background: '#111408' }}
            >
              {/* ── Card Header ── */}
              <button
                type="button"
                onClick={() => setOpenOrderId(prev => prev === order._id ? null : order._id)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '16px 20px',
                  textAlign: 'left',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
                aria-expanded={isOpen}
              >
                {/* Left: order number + date + item count */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#c4d6a1',
                    letterSpacing: '.04em',
                  }}>
                    #{order.orderNumber || 'N/A'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: '#6b7c5a', fontFamily: 'Manrope,sans-serif' }}>
                    {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Status pill */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', borderRadius: 999,
                      background: meta.bg, border: `1px solid ${meta.border}`,
                      color: meta.color, fontSize: 10, fontWeight: 700,
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      fontFamily: 'Manrope,sans-serif',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
                      {meta.label}
                    </span>
                    {/* Item count */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(86,114,69,0.1)', border: '1px solid rgba(86,114,69,0.2)',
                      color: '#8892A4', fontSize: 10, fontWeight: 700,
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      fontFamily: 'Manrope,sans-serif',
                    }}>
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Right: total + chevron */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5a3a', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'Manrope,sans-serif' }}>
                    Total
                  </div>
                  <div style={{ marginTop: 4, fontFamily: 'Manrope,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f0e0' }}>
                    {formatMoney(order.totalAmount)}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#3a4a2a', fontFamily: 'Manrope,sans-serif', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {isOpen ? 'Hide details' : 'View details'}
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* ── Expanded Details ── */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #1e2517', padding: '16px 20px 20px', background: 'rgba(0,0,0,0.12)' }}>
                  {/* Meta row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'طريقة الدفع', value: paymentLabel() },
                      { label: 'رقم الطلب', value: order.orderNumber || '—' },
                    ].map(item => (
                      <div key={item.label} style={{
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2517',
                      }}>
                        <div style={{ fontSize: 10, color: '#4a5a3a', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, fontFamily: 'Manrope,sans-serif' }}>
                          {item.label}
                        </div>
                        <div style={{ marginTop: 5, color: '#e8f0e0', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope,sans-serif' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Items list */}
                  {!!order.items?.length && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5a3a', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4, fontFamily: 'Manrope,sans-serif' }}>
                        Items
                      </div>
                      {order.items.map((item, idx) => (
                        <div key={`${order._id}-${idx}`} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          gap: 10, padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2517',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              color: '#e8f0e0', fontSize: 13, fontWeight: 600,
                              fontFamily: 'Manrope,sans-serif',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.name || item.product?.name || 'Item'}
                            </div>
                            <div style={{ color: '#6b7c5a', fontSize: 11, marginTop: 2, fontFamily: 'Manrope,sans-serif' }}>
                              Qty {item.quantity || 1}
                              {item.codes?.length ? ` · ${item.codes.length} codes` : ''}
                            </div>
                          </div>
                          <div style={{ color: '#c4d6a1', fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: 'Manrope,sans-serif' }}>
                            {formatMoney((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                          </div>
                        </div>
                      ))}

                      {/* Total row */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', marginTop: 4, borderRadius: 10,
                        background: 'rgba(86,114,69,0.06)', border: '1px solid rgba(86,114,69,0.15)',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'Manrope,sans-serif' }}>
                          Order Total
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#c4d6a1', fontFamily: 'Manrope,sans-serif' }}>
                          {formatMoney(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WishlistTab = ({ user, updateUser, addItem }) => {
  const wishlist = user?.wishlist || [];

  const removeFromWishlist = async (productId) => {
    try {
      const res = await authAPI.toggleWishlist(productId);
      updateUser({ wishlist: res.data.wishlist });
      toast.success('تمت الإزالة من المفضلة');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث المفضلة');
    }
  };

  const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

  if (!wishlist.length) {
    return (
      <div className="fu">
        <SectionTitle title="المفضلة" sub="المنتجات المحفوظة" />
        <div className="empty-state">
          <div className="empty-icon-box">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#3a4a2a" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 10-6.364-6.364L12 6.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p style={{fontSize:14, color:'#4a5a3a', margin:0, fontFamily:'Manrope,sans-serif', fontWeight:600}}>لا توجد منتجات محفوظة</p>
          <p style={{fontSize:12, color:'#3a4a2a', margin:0, fontFamily:'Manrope,sans-serif'}}>اضغط على القلب لحفظ المنتج هنا</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fu">
      <SectionTitle title="المفضلة" sub={`عدد المنتجات المحفوظة: ${wishlist.length}`} />
      <div className="orders-grid">
        {wishlist.map((item, i) => (
          <div key={item._id} className={`wishlist-card fu${Math.min(i + 1, 4)}`}>
            <div style={{ position: 'relative', height: 160, background: '#0d1f0e' }}>
              <img
                src={item.image || `https://placehold.co/400x300/0d1f0e/22c55e?text=${encodeURIComponent(item.name?.[0] || '?')}`}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = `https://placehold.co/400x300/0d1f0e/22c55e?text=${encodeURIComponent(item.name?.[0] || '?')}`; }}
              />
              <button
                onClick={() => removeFromWishlist(item._id)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  border: 'none',
                  background: 'rgba(0,0,0,0.45)',
                  color: '#f87171',
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontSize: 18
                }}
                title="إزالة"
              >
                ♥
              </button>
            </div>

            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4a5a3a', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>
                  {item.category || 'منتج'}
                </div>
                <h3 style={{ margin: '6px 0 0', color: '#e8f0e0', fontSize: 14, lineHeight: 1.4 }}>
                  {item.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ color: '#6366F1', fontSize: 18, fontWeight: 800 }}>
                  {formatMoney(item.price)}
                </div>
                <button
                  onClick={() => { addItem(item); toast.success('تمت الإضافة إلى السلة'); }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(34,197,94,0.25)',
                    background: 'rgba(34,197,94,0.1)',
                    color: '#6366F1',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  أضف إلى السلة
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Security Tab ─────────────────────────────────────────────────────────────
const SecurityTab = ({ logout }) => {
  const [form, setForm]     = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving] = useState(false);

  const getStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = getStrength(form.newPassword);
  const strengthColor = ['#3a4a2a','#f87171','#fbbf24','#fbbf24','#4ade80','#4ade80'][strength];
  const strengthLabel = ['','Weak','Fair','Fair','Strong','Very Strong'][strength];

  const handleChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('كلمتا المرور غير متطابقتين');
    if (form.newPassword.length < 8) return toast.error('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل');
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword:form.currentPassword, newPassword:form.newPassword });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fu">
      <SectionTitle title="الأمان" sub="إدارة كلمة المرور والجلسات" />

      <form onSubmit={handleChange} style={{display:'flex', flexDirection:'column', gap:20}}>
        {[
          { field:'currentPassword', label:'كلمة المرور الحالية', ph:'أدخل كلمة المرور الحالية' },
          { field:'newPassword',     label:'كلمة المرور الجديدة',     ph:'8 أحرف على الأقل', showStrength:true },
          { field:'confirm',         label:'تأكيد كلمة المرور', ph:'أعد كتابة كلمة المرور' },
        ].map(({field, label, ph, showStrength}) => (
          <div key={field}>
            <Label>{label}</Label>
            <input type="password" required className="profile-input"
              value={form[field]}
              onChange={e => setForm(f => ({...f, [field]:e.target.value}))}
              placeholder={ph} />
            {showStrength && form.newPassword && (
              <div style={{marginTop:8}}>
                <div className="strength-bar">
                  <div className="strength-fill" style={{
                    width:`${(strength / 5) * 100}%`,
                    background:strengthColor,
                  }} />
                </div>
                <p style={{fontSize:10.5, color:strengthColor, marginTop:4, fontFamily:'Manrope,sans-serif', fontWeight:600}}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>
        ))}
        <div>
          <button type="submit" disabled={saving} className="btn-save">
            {saving ? 'Updating…' : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                تغيير كلمة المرور
              </>
            )}
          </button>
        </div>
      </form>

      <div style={{marginTop:36, paddingTop:28, borderTop:'1px solid #1e2517'}}>
        <p style={{fontSize:11, fontWeight:700, color:'#8892A4', marginBottom:14,
          fontFamily:'Manrope,sans-serif', textTransform:'uppercase', letterSpacing:'.1em'}}>
          Danger Zone
        </p>
        <button onClick={logout} style={{
          fontSize:13, padding:'10px 20px', borderRadius:10,
          background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)',
          color:'#f87171', cursor:'pointer', fontFamily:'Manrope,sans-serif',
          fontWeight:600, transition:'all .18s', width:'100%', maxWidth:260,
          display:'flex', alignItems:'center', gap:8, letterSpacing:'.02em',
        }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.13)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.15)' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          تسجيل الخروج من جميع الجلسات
        </button>
      </div>
    </div>
  );
};

// ── Rewards Tab ───────────────────────────────────────────────────────────────
const RewardsTab = () => (
  <div className="fu">
    <SectionTitle title="Reward Points" sub="Earn with every purchase" />
    <div className="empty-state">
      <div className="profile-page-shell" style={{
        width:70, height:70, borderRadius:20,
        background:'rgba(249,115,22,0.07)',
        border:'1px solid rgba(249,115,22,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:8,
      }}>
        <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="rgba(249,115,22,0.5)" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span style={{
        fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase',
        color:'#f97316', background:'rgba(249,115,22,0.08)',
        border:'1px solid rgba(249,115,22,0.16)', padding:'3px 12px',
        borderRadius:6, display:'inline-block',
        fontFamily:'Manrope,sans-serif',
      }}>قريباً</span>
        <p style={{fontSize:13, color:'#4a5a3a', margin:0, fontFamily:'Manrope,sans-serif'}}>Earn points with every purchase</p>
      <p style={{fontSize:11.5, color:'#3a4a2a', margin:0, fontFamily:'Manrope,sans-serif'}}>Redeem for discounts & exclusive perks</p>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { addItem } = useCart();
  const [activeTab, setActiveTab]         = useState('account');
  const [mounted, setMounted]             = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || '');
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'orders') {
      try {
        const res = await orderAPI.getMyOrders();
        updateUser({ orders: res.data.orders });
      } catch {}
    }
  };

  const cfg        = ROLE_CONFIG[user?.role] || ROLE_CONFIG.user;
  const isHighRole = (ROLE_LEVEL[user?.role] || 0) >= 2;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setPreviewAvatar(user?.avatar || '');
  }, [user?.avatar]);

  const renderContent = () => {
    switch (activeTab) {
      case 'account':  return <AccountTab user={user} updateUser={updateUser} onAvatarChange={setPreviewAvatar} />;
      case 'orders':   return <OrdersTab user={user} />;
      case 'wishlist': return <WishlistTab user={user} updateUser={updateUser} addItem={addItem} />;
      case 'security': return <SecurityTab logout={logout} />;
      case 'rewards':  return <RewardsTab />;
      default:         return null;
    }
  };

  return (
    <>
      <FontLoader />
      <div style={{
        minHeight:'100vh',
        paddingTop:isMobile ? 60 : 80,
        paddingBottom:isMobile ? 0 : 72,
        background:'#030405',
        fontFamily:'Manrope,sans-serif',
      }}>
        {/* Subtle top glow */}
        <div style={{
          position:'fixed', top:0, left:'50%', transform:'translateX(-50%)',
          width:600, height:300,
          background:'radial-gradient(ellipse at top, rgba(185,140,255,0.09), transparent 70%)',
          pointerEvents:'none', zIndex:0,
        }} />

        <div
          className="profile-wrapper"
          style={{ maxWidth:880, margin:'0 auto', padding:isMobile ? '16px 12px 0' : '32px 16px', position:'relative', zIndex:1 }}
        >
          {/* Breadcrumb */}
          <div className="fu" style={{ marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:3, height:18, borderRadius:2, background:'#f97316' }} />
            <span style={{
              fontFamily:'Manrope,sans-serif', fontSize:11.5, fontWeight:700,
              color:'#4a5a3a', letterSpacing:'.12em', textTransform:'uppercase'
            }}>إعدادات الحساب</span>
          </div>

          {/* Card */}
          <div
            className="profile-card"
            style={{
              background:'#0f1209',
              border:`1px solid ${isHighRole ? cfg.color + '28' : '#1e2517'}`,
              borderRadius:20,
              overflow:'hidden',
              boxShadow:isHighRole
                ? `0 24px 80px rgba(0,0,0,.6), 0 0 40px ${cfg.color}0d`
                : '0 24px 80px rgba(0,0,0,.6)',
              opacity:   mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              transition:'opacity .45s ease, transform .45s ease',
              borderBottomLeftRadius:  isMobile ? 0 : 20,
              borderBottomRightRadius: isMobile ? 0 : 20,
            }}
          >
            <div className="profile-layout">

              {/* ── Sidebar ── */}
              <div
                className="profile-sidebar"
                style={{
                  background:'#0c0f08',
                  borderRight:isMobile ? 'none' : `1px solid ${isHighRole ? cfg.color + '18' : '#1e2517'}`,
                  borderBottom:isMobile ? `1px solid ${isHighRole ? cfg.color + '15' : '#1e2517'}` : 'none',
                }}
              >
                {/* User Info */}
                <div
                  className="sidebar-user-info"
                  style={{
                    padding:'26px 20px 22px',
                    borderBottom:`1px solid ${isHighRole ? cfg.color + '12' : '#1e2517'}`,
                    display:'flex',
                    flexDirection:isMobile ? 'row' : 'column',
                    alignItems:isMobile ? 'center' : 'flex-start',
                    gap:isMobile ? 14 : 0,
                    position:'relative', overflow:'hidden',
                  }}
                >
                  {isHighRole && (
                    <div style={{
                      position:'absolute', top:-20, right:-20,
                      width:100, height:100,
                      background:`radial-gradient(circle, ${cfg.color}12, transparent 70%)`,
                      pointerEvents:'none',
                    }} />
                  )}
                  <Avatar
                    user={{...user, avatar:previewAvatar}}
                    size={isMobile ? 46 : 64}
                    canEdit={false}
                  />
                  <div className="sidebar-user-text" style={{marginTop:isMobile ? 0 : 16, minWidth:0}}>
                    <p style={{
                      fontFamily:'Manrope,sans-serif',
                      fontSize:isMobile ? 15 : 15.5,
                      fontWeight:700,
                      color:'#e8f0e0', margin:0, lineHeight:1.2,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>{user?.name}</p>
                    <p style={{
                      fontSize:11, color:'#3a4a2a', marginTop:4,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      fontFamily:'Manrope,sans-serif',
                    }}>{user?.email}</p>
                    <div style={{marginTop:8}}><RoleBadge role={user?.role} /></div>
                  </div>
                </div>

                {/* Desktop Nav */}
                <nav className="sidebar-nav-desktop"
                  style={{padding:'12px 10px', display:'flex', flexDirection:'column', gap:3, flex:1}}>
                  {NAV_ITEMS.map((item, i) => {
                    const isActive = activeTab === item.id;
                    const cls = item.soon ? 'disabled' : isActive ? 'active' : 'inactive';
                    return (
                      <button key={item.id}
                        onClick={() => !item.soon && handleTabChange(item.id)}
                        className={`nav-btn ${cls} fu${i+1}`}>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.8}
                          style={{flexShrink:0}}>
                          {NAV_ICONS[item.id]}
                        </svg>
                        <span>{item.label}</span>
                        {item.soon && (
                          <span style={{
                            marginLeft:'auto', fontSize:9, fontWeight:700,
                            letterSpacing:'.1em', color:'#4F46E5',
                            background:'rgba(86,114,69,0.1)',
                            border:'1px solid rgba(86,114,69,0.2)',
                            padding:'2px 7px', borderRadius:5,
                            fontFamily:'Manrope,sans-serif',
                          }}>SOON</span>
                        )}
                        {isActive && <span className="nav-indicator" />}
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile Tab Bar */}
                <div className="mobile-tab-bar">
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const cls = item.soon ? 'disabled' : isActive ? 'active' : '';
                    return (
                      <button key={item.id}
                        onClick={() => !item.soon && handleTabChange(item.id)}
                        className={`mobile-nav-btn ${cls}`}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.6}
                          style={{flexShrink:0}}>
                          {NAV_ICONS[item.id]}
                        </svg>
                        <span>{item.mobileLabel}</span>
                        {item.soon && (
                          <span style={{
                            position:'absolute', top:4, right:'50%', transform:'translateX(10px)',
                            fontSize:7, fontWeight:700, color:'#4F46E5',
                            background:'rgba(86,114,69,0.15)',
                            border:'1px solid rgba(86,114,69,0.2)',
                            padding:'1px 4px', borderRadius:3,
                            fontFamily:'Manrope,sans-serif', letterSpacing:'.08em',
                          }}>NEW</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom accent (desktop) */}
                <div className="sidebar-bottom-accent" style={{padding:'0 20px 20px'}}>
                  <div style={{
                    height:1, borderRadius:1,
                    background:isHighRole
                      ? `linear-gradient(90deg,transparent,${cfg.color}50,transparent)`
                      : 'linear-gradient(90deg,transparent,rgba(249,115,22,0.25),transparent)'
                  }} />
                </div>
              </div>

              {/* ── Content ── */}
              <div className="profile-content">
                {renderContent()}
              </div>

            </div>
          </div>

          {isMobile && <div style={{height:28, background:'#0a0d07'}} />}
        </div>
      </div>
    </>
  );
}
