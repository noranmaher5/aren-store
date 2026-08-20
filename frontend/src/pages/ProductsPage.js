import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { AREN_CATALOG, AREN_CATALOG_BY_ID, getArenCatalogCategory } from '../config/arenCatalog';

// ─────────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────────
const CATEGORIES = [
  { value: '',           label: 'كل التصنيفات' },
  ...AREN_CATALOG.map(category => ({ value: category.id, label: category.name })),
];

const CATEGORY_LABELS = {
  '':           'كل المنتجات',
  ...Object.fromEntries(AREN_CATALOG.map(category => [category.id, category.name])),
};

const CATEGORY_COLORS = {
  '':           '#B98CFF',
  ...Object.fromEntries(AREN_CATALOG.map(category => [category.id, '#B98CFF'])),
};

const SORT_OPTIONS = [
  { value: 'newest',     label: 'الأحدث أولًا' },
  { value: 'popular',    label: 'الأكثر شعبية' },
  { value: 'price-asc',  label: 'السعر: من الأقل للأعلى' },
  { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating',     label: 'Top Rated' },
];

// ─────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────
const IconAll = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const IconMinecraft = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="M8 8h2v2H8zM14 8h2v2h-2zM8 14h2v2H8zM14 14h2v2h-2z" fill={color} stroke="none" />
  </svg>
);
const IconSteam = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8a4 4 0 014 4" />
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
    <path d="M6 14l2 3M9 17l2 1" />
  </svg>
);
const IconDiscord = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
  </svg>
);
const IconAI = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V10a3 3 0 013-3h1V6a4 4 0 014-4z" />
    <circle cx="9" cy="13" r="1" fill={color} stroke="none" />
    <circle cx="15" cy="13" r="1" fill={color} stroke="none" />
  </svg>
);
const IconStreaming = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2" />
    <path d="M17 2l-5 5-5-5" />
    <polygon points="10,11 10,18 17,14.5" fill={color} stroke="none" />
  </svg>
);
const IconGiftCard = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="8" width="20" height="14" rx="2" />
    <path d="M12 8V22M2 13h20" />
    <path d="M9 8C9 8 9 5 12 5s3 3 3 3" />
    <path d="M9 8C9 8 7 5 8.5 3.5S12 5 12 8" />
  </svg>
);
const IconBook = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const IconGame = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="3" />
    <path d="M6 13h4M8 11v4M15 13h2M14 16h4" />
  </svg>
);
const IconSearch = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconFilter = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" />
  </svg>
);
const IconChevronLeft = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const IconChevronRight = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const IconX = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconSort = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M7 12h10M11 18h2" />
  </svg>
);
const IconTag = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <circle cx="7" cy="7" r="1.5" fill={color} stroke="none" />
  </svg>
);

const CATEGORY_ICONS = {
  '':           IconAll,
  'movies-entertainment': IconStreaming,
  'social-daily-apps': IconDiscord,
  'design-productivity-ai': IconAI,
  'music-audio': IconBook,
  games: IconGame,
};

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700;800&display=swap');

  :root {
    --bg-base:     #030405;
    --bg-surface:  #0E1011;
    --bg-card:     #0E1011;
    --bg-input:    #111315;
    --border:      rgba(185,140,255,0.18);
    --border-hover:rgba(185,140,255,0.42);
    --accent:      #B98CFF;
    --accent-dim:  rgba(185,140,255,0.15);
    --text-primary:#F5F4EF;
    --text-muted:  #929592;
    --radius-sm:   10px;
    --radius-md:   14px;
    --radius-lg:   20px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pp-root {
    background: var(--bg-base);
    min-height: 100vh;
    padding-top: 74px;
    padding-bottom: 64px;
    font-family: 'Outfit', sans-serif;
    color: var(--text-primary);
  }

  .pp-search-input {
    background: var(--bg-input);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: 0 16px;
    height: 46px;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .pp-search-input::placeholder { color: var(--text-muted); }
  .pp-search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(185,140,255,0.14);
  }

  .pp-select {
    background: var(--bg-input);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: 0 14px;
    height: 46px;
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B98CFF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
  }
  .pp-select:focus { border-color: var(--accent); }
  .pp-select option { background: #0e1011; }

  .pp-cat-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 13.5px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    text-align: left;
  }
  .pp-cat-btn:hover {
    background: var(--accent-dim);
    color: var(--text-primary);
    border-color: var(--border);
  }
  .pp-cat-btn.active {
    background: var(--accent-dim);
    color: var(--accent);
    border-color: rgba(185,140,255,0.3);
    font-weight: 600;
  }

  .pp-price-input {
    background: var(--bg-input);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    padding: 0 12px;
    height: 40px;
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    outline: none;
    width: 100%;
    transition: border-color 0.2s;
  }
  .pp-price-input::placeholder { color: var(--text-muted); }
  .pp-price-input:focus { border-color: var(--accent); }
  .pp-price-input::-webkit-inner-spin-button,
  .pp-price-input::-webkit-outer-spin-button { -webkit-appearance: none; }

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .pp-skeleton {
    background: linear-gradient(90deg, #101214 25%, #1a1722 50%, #101214 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }

  .pp-page-btn {
    width: 38px; height: 38px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
    display: flex; align-items: center; justify-content: center;
  }
  .pp-page-btn:hover:not(:disabled) {
    background: var(--accent-dim);
    color: var(--accent);
    border-color: rgba(185,140,255,0.38);
  }
  .pp-page-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    font-weight: 700;
  }
  .pp-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-base); }
  ::-webkit-scrollbar-thumb { background: rgba(185,140,255,0.3); border-radius: 3px; }

  .pp-root > div { max-width: 1160px !important; }
  .pp-page-header { padding: 42px 0 28px !important; border-bottom: 1px solid rgba(255,255,255,.08); }
  .pp-page-header h1 { letter-spacing: -.035em; }
  .pp-topbar { padding: 14px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: rgba(14,16,17,.76); }
  .pp-desktop-sidebar { box-shadow: 0 18px 45px rgba(0,0,0,.18); }
  .pp-grid { align-items: stretch; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .pp-desktop-sidebar { display: none !important; }
    .pp-mobile-filter-btn { display: flex !important; }
  }
  @media (max-width: 768px) {
    .pp-root { padding-top: 64px; padding-bottom: 48px; }
    .pp-root > div { padding-left: 14px !important; padding-right: 14px !important; }
    .pp-page-header { padding-top: 28px !important; }
    .pp-page-title { font-size: 26px !important; }
    .pp-topbar { flex-direction: column; align-items: stretch !important; }
    .pp-topbar form { min-width: 0 !important; }
    .pp-topbar .pp-sort-wrap { width: 100%; }
    .pp-topbar .pp-select { width: 100% !important; min-width: 0 !important; }
  }
  @media (max-width: 640px) {
    .pp-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
  }
  @media (max-width: 360px) {
    .pp-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="pp-skeleton" style={{ height: 160 }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="pp-skeleton" style={{ height: 11, borderRadius: 4, width: '45%' }} />
        <div className="pp-skeleton" style={{ height: 14, borderRadius: 4, width: '90%' }} />
        <div className="pp-skeleton" style={{ height: 14, borderRadius: 4, width: '65%' }} />
        <div className="pp-skeleton" style={{ height: 22, borderRadius: 6, width: '40%', marginTop: 6 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ filters, setFilter, clearFilters, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>Filters</span>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center',
          }}>
            <IconX size={16} />
          </button>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      <div>
        <p style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12,
        }}>Category</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat.value];
            const isActive = filters.category === cat.value;
            const catColor = CATEGORY_COLORS[cat.value] || 'var(--accent)';
            return (
              <button
                key={cat.value}
                onClick={() => { setFilter('category', cat.value); onClose && onClose(); }}
                className={`pp-cat-btn${isActive ? ' active' : ''}`}
                style={isActive ? { color: catColor, borderColor: `${catColor}33`, background: `${catColor}12` } : {}}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <Icon size={15} color={isActive ? catColor : 'var(--text-muted)'} />
                </span>
                <span>{cat.label}</span>
                {isActive && (
                  <span style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%', background: catColor, flexShrink: 0,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      <div>
        <p style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12,
        }}>نطاق السعر</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number" placeholder="Min $"
            value={filters.minPrice}
            onChange={e => setFilter('minPrice', e.target.value)}
            className="pp-price-input"
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>—</span>
          <input
            type="number" placeholder="Max $"
            value={filters.maxPrice}
            onChange={e => setFilter('maxPrice', e.target.value)}
            className="pp-price-input"
          />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      <button
        onClick={clearFilters}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 10,
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Outfit, sans-serif',
          fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
          e.currentTarget.style.color = '#f87171';
          e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <IconX size={13} />
        Clear Filters
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ACTIVE FILTER BADGE
// ─────────────────────────────────────────────
function ActiveFilterBadge({ label, color, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20,
      background: `${color}15`, border: `1px solid ${color}35`,
      color: color, fontSize: 12, fontWeight: 600,
      fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
    }}>
      <IconTag size={11} color={color} />
      {label}
      <button onClick={onRemove} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: color, padding: 0, display: 'flex', alignItems: 'center', opacity: 0.7,
      }}>
        <IconX size={11} color={color} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('catalog') || searchParams.get('category') || '',
    sort:     searchParams.get('sort')     || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page:     Number(searchParams.get('page')) || 1,
  }));

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const debounceRef = useRef(null);

 
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 400);
  };

  
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  
  const prevCategory = useRef(filters.category);
  useEffect(() => {
    const catFromUrl    = searchParams.get('catalog') || searchParams.get('category') || '';
    const searchFromUrl = searchParams.get('search')   || '';
    if (catFromUrl !== prevCategory.current) {
      prevCategory.current = catFromUrl;
      setFilters(prev => ({ ...prev, category: catFromUrl, search: searchFromUrl, page: 1 }));
      setSearchInput(searchFromUrl);
    }
  }, [searchParams]);

  // ── Fetch products ──
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = AREN_CATALOG_BY_ID[filters.category];
      const params = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        ),
        isActive: true,
        limit: 12,
      };
      if (catalog) params.category = catalog.apiCategory;
      const res = await productAPI.getAll(params);
      const sourceProducts = res.data.products || [];
      const visibleProducts = catalog
        ? sourceProducts.filter(product => getArenCatalogCategory(product)?.id === catalog.id)
        : sourceProducts;
      setProducts(visibleProducts);
      setTotal(catalog ? visibleProducts.length : (res.data.total || 0));
      setPages(catalog ? 1 : (res.data.pages || 1));

      
      const urlParams = Object.fromEntries(
        Object.entries(filters).filter(([k, v]) => {
          if (v === '' || v === null || v === undefined) return false;
          if (k === 'page' && v === 1) return false;
          return true;
        })
      );
      if (catalog) {
        urlParams.catalog = filters.category;
        delete urlParams.category;
      }
      setSearchParams(urlParams, { replace: true });
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  
  const setFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  
  const setPage = (newPage) =>
    setFilters(prev => ({ ...prev, page: newPage }));

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const clearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilters({ search: '', category: '', sort: 'newest', minPrice: '', maxPrice: '', page: 1 });
    setSearchInput('');
  };

  // Derived
  const accentColor   = CATEGORY_COLORS[filters.category] || '#B98CFF';
  const categoryLabel = CATEGORY_LABELS[filters.category] || 'All Products';
  const CategoryIcon  = CATEGORY_ICONS[filters.category]  || IconAll;
  const hasActiveFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice;

  // ── Pagination numbers builder ──
  const buildPageNums = () => {
    const SHOW = 5;
    let start = Math.max(1, filters.page - Math.floor(SHOW / 2));
    let end   = Math.min(pages, start + SHOW - 1);
    if (end - start < SHOW - 1) start = Math.max(1, end - SHOW + 1);

    const nums = [];

    if (start > 1) {
      nums.push(
        <button key={1} onClick={() => setPage(1)}
          className={`pp-page-btn${filters.page === 1 ? ' active' : ''}`}
          style={filters.page === 1 ? { background: accentColor, borderColor: accentColor } : {}}
        >1</button>
      );
      if (start > 2) nums.push(
        <span key="e1" style={{ color: 'var(--text-muted)', fontSize: 12, padding: '0 4px' }}>···</span>
      );
    }

    for (let i = start; i <= end; i++) {
      nums.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`pp-page-btn${filters.page === i ? ' active' : ''}`}
          style={filters.page === i ? { background: accentColor, borderColor: accentColor } : {}}
        >{i}</button>
      );
    }

    if (end < pages) {
      if (end < pages - 1) nums.push(
        <span key="e2" style={{ color: 'var(--text-muted)', fontSize: 12, padding: '0 4px' }}>···</span>
      );
      nums.push(
        <button key={pages} onClick={() => setPage(pages)}
          className={`pp-page-btn${filters.page === pages ? ' active' : ''}`}
          style={filters.page === pages ? { background: accentColor, borderColor: accentColor } : {}}
        >{pages}</button>
      );
    }

    return nums;
  };

  return (
    <div className="pp-root">
      <style>{GLOBAL_STYLES}</style>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px' }}>

        {/* ── PAGE HEADER ── */}
        <div className="pp-page-header" style={{ padding: '36px 0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${accentColor}18`, border: `1px solid ${accentColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s, border-color 0.3s',
            }}>
              <CategoryIcon size={22} color={accentColor} />
            </div>
            <div>
              <h1 className="pp-page-title" style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: 34, fontWeight: 900,
                color: '#f0fdf4', lineHeight: 1,
              }}>
                {categoryLabel}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
                {loading ? 'جارٍ التحميل...' : `${total.toLocaleString()} منتج متاح`}
              </p>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {filters.category && (
                <ActiveFilterBadge label={CATEGORY_LABELS[filters.category]} color={accentColor} onRemove={() => setFilter('category', '')} />
              )}
              {filters.search && (
                <ActiveFilterBadge label={`"${filters.search}"`} color="#94a3b8"
                  onRemove={() => { if (debounceRef.current) clearTimeout(debounceRef.current); setFilter('search', ''); setSearchInput(''); }}
                />
              )}
              {filters.minPrice && (
                <ActiveFilterBadge label={`Min $${filters.minPrice}`} color="#64748b" onRemove={() => setFilter('minPrice', '')} />
              )}
              {filters.maxPrice && (
                <ActiveFilterBadge label={`Max $${filters.maxPrice}`} color="#64748b" onRemove={() => setFilter('maxPrice', '')} />
              )}
              <button onClick={clearFilters} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Outfit, sans-serif',
                textDecoration: 'underline', padding: '4px 6px',
              }}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── SEARCH + SORT BAR ── */}
        <div className="pp-topbar" style={{
          display: 'flex', gap: 12, marginBottom: 32,
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Search */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 240, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: 'var(--text-muted)',
              }}>
              
                {loading && searchInput
                  ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                      </path>
                    </svg>
                  : <IconSearch size={15} />
                }
              </span>
              <input
                value={searchInput}
                onChange={handleSearchChange}
                  placeholder="ابحث عن المنتجات..."
                className="pp-search-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </form>

          {/* Sort */}
          <div className="pp-sort-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <IconSort size={15} />
            </span>
            <select
              value={filters.sort}
              onChange={e => setFilter('sort', e.target.value)}
              className="pp-select"
              style={{ minWidth: 190 }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              display: 'none',
              height: 46, padding: '0 18px',
              background: 'var(--bg-card)',
              border: `1px solid ${sidebarOpen ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 12,
              color: sidebarOpen ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer', gap: 8, alignItems: 'center',
            }}
            className="pp-mobile-filter-btn"
          >
            <IconFilter size={14} />
            Filters
          </button>
        </div>

        {/* ── LAYOUT ── */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* Desktop Sidebar */}
          <aside className="pp-desktop-sidebar" style={{
            width: 230, flexShrink: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '24px 18px',
            position: 'sticky', top: 100,
          }}>
            <Sidebar filters={filters} setFilter={setFilter} clearFilters={clearFilters} onClose={null} />
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
                onClick={() => setSidebarOpen(false)}
              />
              <div style={{
                position: 'relative', width: 280,
                background: '#0e1011', borderRight: '1px solid var(--border)',
                padding: '28px 20px', overflowY: 'auto',
              }}>
                <Sidebar filters={filters} setFilter={setFilter} clearFilters={clearFilters} onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="pp-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 20,
              }}>
                {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                }}>
                  <IconSearch size={28} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                  لم يتم العثور على منتجات
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 300 }}>
                  Try adjusting your filters or search query to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  style={{
                    marginTop: 8, padding: '11px 28px', borderRadius: 12,
                    background: 'var(--accent)', border: 'none', color: '#fff',
                    fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="pp-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 20,
                }}>
                  {products.map(p => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>

                {/* ── PAGINATION ── */}
                {pages > 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, marginTop: 48, flexWrap: 'wrap',
                  }}>
                    <button
                      onClick={() => setPage(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="pp-page-btn"
                      style={{ width: 'auto', padding: '0 14px', gap: 6, display: 'flex', alignItems: 'center' }}
                    >
                      <IconChevronLeft size={14} />
                      Prev
                    </button>

                    {buildPageNums()}

                    <button
                      onClick={() => setPage(filters.page + 1)}
                      disabled={filters.page === pages}
                      className="pp-page-btn"
                      style={{ width: 'auto', padding: '0 14px', gap: 6, display: 'flex', alignItems: 'center' }}
                    >
                      Next
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                )}

                <p style={{
                  textAlign: 'center', marginTop: 16,
                  fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif',
                }}>
                  Page {filters.page} of {pages} · {total.toLocaleString()} total products
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
