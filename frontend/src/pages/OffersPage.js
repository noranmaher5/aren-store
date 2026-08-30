import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBolt, FaFire, FaClock, FaTags, FaCheckCircle } from 'react-icons/fa';
import { productAPI, settingsAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import offersHero from '../assets/offers-hero-purple.png';

// ─────────────────────────────────────────────
// SELF-CONTAINED STYLES (injected once, no external CSS dependency)
// ─────────────────────────────────────────────
const OFFERS_CSS = `
  .aren-offers-page{background:radial-gradient(circle at 50% -12%,rgba(239,72,72,.14),transparent 32%),#030405;min-height:100vh;padding:72px 0 64px;font-family:'Plus Jakarta Sans',sans-serif;color:#F5F0E7;}

  @keyframes offersFloat{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-10px) rotate(3deg);}}
  @keyframes offersPulseRing{0%{box-shadow:0 0 0 0 rgba(239,72,72,.45);}70%{box-shadow:0 0 0 14px rgba(239,72,72,0);}100%{box-shadow:0 0 0 0 rgba(239,72,72,0);}}
  @keyframes offersRise{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes offersShimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}

  .offers-hero{position:relative;overflow:hidden;max-width:1280px;min-height:330px;margin:24px auto 0;padding:clamp(38px,5vw,64px) clamp(24px,5vw,70px);border-radius:24px;background-color:#080622;background-size:cover;background-position:center;border:1px solid rgba(151,103,255,.38);box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 35px rgba(107,48,255,.12),inset 0 1px rgba(220,190,255,.14);}
  .offers-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,3,20,.96) 0%,rgba(7,5,30,.82) 35%,rgba(7,5,30,.12) 73%,rgba(4,3,18,.38) 100%);pointer-events:none;}
  .offers-hero::after{content:'';position:absolute;inset:auto 0 0;height:38%;background:linear-gradient(transparent,rgba(28,5,92,.32));pointer-events:none;}
  .offers-hero-inner{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:clamp(28px,7vw,100px);}
  .offers-hero-copy{max-width:650px;}
  .offers-eyebrow{display:inline-flex;align-items:center;gap:8px;font:700 11px/1 'Rajdhani',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#d9c5ff;background:rgba(116,54,255,.18);border:1px solid rgba(173,127,255,.45);padding:8px 14px;border-radius:20px;margin-bottom:20px;box-shadow:0 0 22px rgba(132,70,255,.2);}
  .offers-hero h1{font-family:'Rajdhani',sans-serif;font-weight:800;font-size:clamp(38px,5.5vw,64px);line-height:.98;letter-spacing:-.025em;color:#fff;margin:0 0 18px;}
  .offers-hero h1 em{font-style:normal;background:linear-gradient(90deg,#ff5dbd,#a990ff 75%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:none;}
  .offers-hero p{max-width:550px;font-size:clamp(13.5px,1.6vw,16px);color:rgba(245,240,231,.68);line-height:1.7;margin:0 0 26px;}
  .offers-hero-pills{display:flex;gap:10px;flex-wrap:wrap;}
  .offers-hero-pills span{display:inline-flex;align-items:center;gap:8px;font:600 11.5px/1 'Outfit',sans-serif;color:#eee9ff;background:rgba(17,11,48,.64);border:1px solid rgba(171,137,255,.22);padding:10px 13px;border-radius:10px;box-shadow:inset 0 1px rgba(255,255,255,.06);}
  .offers-hero-pills svg{color:#b68cff;font-size:12px;}

  .offers-countdown{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:16px;min-width:290px;padding:22px 18px;border:1px solid rgba(171,137,255,.3);border-radius:18px;background:rgba(5,4,26,.62);box-shadow:0 14px 35px rgba(0,0,0,.35),inset 0 1px rgba(210,185,255,.1);backdrop-filter:blur(12px);}
  .offers-countdown-label{display:flex;align-items:center;gap:8px;font:700 12px/1 'Rajdhani',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#e3d8ff;}
  .offers-countdown-grid{display:flex;gap:8px;}
  .offers-countdown-box{width:58px;background:rgba(105,57,225,.13);border:1px solid rgba(171,137,255,.28);border-radius:12px;padding:13px 0;text-align:center;}
  .offers-countdown-box b{display:block;font:800 30px/1 'Rajdhani',sans-serif;color:#fff;}
  .offers-countdown-box span{display:block;margin-top:3px;font:600 9px/1 'Outfit',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.45);}
  .offers-live-dot{width:8px;height:8px;border-radius:50%;background:#ef4848;animation:offersPulseRing 1.8s infinite;}

  @media(max-width:768px){.aren-offers-page{padding-top:62px;}.offers-hero{padding:34px 22px;border-radius:16px;margin:18px 14px 0;}.offers-hero-inner{grid-template-columns:1fr;gap:26px;}.offers-countdown{align-items:center;width:100%;min-width:0;}.offers-countdown-grid{width:100%;justify-content:space-between;}.offers-countdown-box{width:31%;}}

  .offers-strip{max-width:1280px;margin:18px auto 0;padding:0 clamp(24px,5vw,64px);}
  @media(max-width:768px){.offers-strip{padding:0 14px;}}
  .offers-strip-inner{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:15px 22px;border-radius:14px;background:linear-gradient(90deg,rgba(169,112,255,.1),rgba(113,67,190,.05));border:1px solid rgba(169,112,255,.2);}
  .offers-strip-icon{width:38px;height:38px;border-radius:10px;background:rgba(239,72,72,.16);border:1px solid rgba(239,72,72,.35);display:flex;align-items:center;justify-content:center;color:#ff5a5a;flex-shrink:0;}
  .offers-strip-text strong{display:block;font:700 14px/1.3 'Outfit',sans-serif;color:#fff;}
  .offers-strip-text span{font:500 12px/1.4 'Outfit',sans-serif;color:rgba(245,240,231,.55);}

  .offers-section-heading{max-width:1280px;margin:40px auto 22px;padding:0 clamp(24px,5vw,64px);display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:20px;}
  @media(max-width:768px){.offers-section-heading{padding:0 14px 16px;margin-top:28px;}}
  .offers-section-heading h2{font-family:'Rajdhani',sans-serif;font-weight:800;font-size:clamp(22px,3vw,30px);color:#f5f0e7;}
  .offers-section-heading .offers-eyebrow2{display:block;font:700 11px 'Rajdhani',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#c7a7ff;margin-bottom:6px;}
  .offers-view-all{color:#c7a7ff;text-decoration:none;font:700 13px 'Outfit',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:gap .2s;}
  .offers-view-all:hover{gap:9px;}

  .offers-sort-row{max-width:1280px;margin:0 auto 24px;padding:0 clamp(24px,5vw,64px);display:flex;gap:9px;flex-wrap:wrap;}
  @media(max-width:768px){.offers-sort-row{padding:0 14px;}}
  .offers-sort-chip{font:600 12.5px/1 'Outfit',sans-serif;color:rgba(245,240,231,.65);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);padding:9px 16px;border-radius:24px;cursor:pointer;transition:all .2s;}
  .offers-sort-chip:hover{border-color:rgba(201,169,106,.4);color:#f5f0e7;}
  .offers-sort-chip.active{background:#a970ff;border-color:#c7a7ff;color:#10091f;box-shadow:0 0 18px rgba(169,112,255,.22);}

  .offers-grid{max-width:1280px;margin:0 auto;padding:0 clamp(24px,5vw,64px);display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px;}
  @media(max-width:768px){.offers-grid{padding:0 14px;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}}
  .offers-grid > *{animation:offersRise .5s ease both;}
  .offers-product-card{position:relative;min-width:0;}
  .offers-product-card::before{content:'';position:absolute;inset:-1px;border-radius:18px;background:linear-gradient(145deg,rgba(239,72,72,.7),rgba(239,72,72,0) 42%,rgba(201,169,106,.35));opacity:.45;z-index:0;pointer-events:none;}
  .offers-product-card > .aren-product-card{position:relative;z-index:1;}
  .offers-product-ribbon{position:absolute;top:10px;left:10px;z-index:3;display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:8px;background:rgba(85,12,15,.92);border:1px solid rgba(255,112,112,.45);box-shadow:0 6px 18px rgba(0,0,0,.35);color:#ffd0d0;font:700 10px/1 'Outfit',sans-serif;letter-spacing:.02em;pointer-events:none;}
  .offers-product-ribbon svg{color:#ff6868;font-size:10px;}

  .offers-skel{border-radius:14px;overflow:hidden;background:#141517;border:1px solid rgba(255,255,255,.05);}
  .offers-skel-img{height:150px;background:linear-gradient(90deg,#17181b 25%,#201f18 50%,#17181b 75%);background-size:200% 100%;animation:offersShimmer 1.5s infinite;}
  .offers-skel-body{padding:14px;display:flex;flex-direction:column;gap:8px;}
  .offers-skel-line{height:11px;border-radius:4px;background:rgba(255,255,255,.06);}

  .offers-empty{max-width:640px;margin:60px auto;padding:56px 32px;text-align:center;border-radius:20px;background:linear-gradient(145deg,#141216,#0c0b0e);border:1px solid rgba(201,169,106,.18);}
  .offers-empty-icon{width:74px;height:74px;margin:0 auto 22px;border-radius:20px;background:rgba(169,112,255,.1);border:1px solid rgba(199,167,255,.3);display:flex;align-items:center;justify-content:center;color:#c7a7ff;font-size:30px;}
  .offers-empty h2{font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:800;color:#f5f0e7;margin-bottom:10px;}
  .offers-empty p{color:rgba(245,240,231,.55);font-size:14px;margin-bottom:24px;}
  .offers-gold-button{display:inline-flex;align-items:center;gap:8px;background:#a970ff;color:#10091f;font:700 13.5px 'Outfit',sans-serif;padding:12px 26px;border-radius:10px;text-decoration:none;transition:all .2s;box-shadow:0 8px 22px rgba(169,112,255,.2);}
  .offers-gold-button:hover{background:#c7a7ff;transform:translateY(-2px);}
`;

let offersStylesInjected = false;
function injectOffersStyles() {
  if (offersStylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'offers-page-styles';
  el.textContent = OFFERS_CSS;
  document.head.appendChild(el);
  offersStylesInjected = true;
}

// ─────────────────────────────────────────────
// COUNTDOWN — only uses the end date configured by an administrator
// ─────────────────────────────────────────────
function useCountdown(targetDate) {
  const target = targetDate ? new Date(targetDate).getTime() : null;
  const [left, setLeft] = useState(target ? Math.max(0, target - Date.now()) : 0);

  useEffect(() => {
    if (!target) return undefined;
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);

  const totalSec = Math.floor(left / 1000);
  return {
    d: String(Math.floor(totalSec / 86400)).padStart(2, '0'),
    h: String(Math.floor((totalSec % 86400) / 3600)).padStart(2, '0'),
    m: String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0'),
    s: String(totalSec % 60).padStart(2, '0'),
  };
}

const SORTS = [
  { key: 'popular', label: 'الأكثر شعبية' },
  { key: 'discount', label: 'أكبر خصم' },
  { key: 'price_low', label: 'السعر: من الأقل للأعلى' },
  { key: 'newest', label: 'الأحدث' },
];

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
function OfferSkeleton() {
  return (
    <div className="offers-skel">
      <div className="offers-skel-img" />
      <div className="offers-skel-body">
        <div className="offers-skel-line" style={{ width: '55%' }} />
        <div className="offers-skel-line" style={{ width: '85%' }} />
        <div className="offers-skel-line" style={{ width: '40%', marginTop: 4 }} />
      </div>
    </div>
  );
}

export default function OffersPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('popular');
  const [campaign, setCampaign] = useState(null);
  const countdown = useCountdown(campaign?.showCountdown ? campaign.countdownEndsAt : null);

  useEffect(() => { injectOffersStyles(); }, []);

  useEffect(() => {
    settingsAPI.getPromotionCampaign()
      .then(res => {
        const next = res.data?.promotionCampaign || null;
        if (next?.description === 'Discover real promotions on selected Aren Store subscriptions and digital products.') {
          next.description = 'اكتشفي عروضًا حقيقية على اشتراكات ومنتجات رقمية مختارة من متجر Aren.';
        }
        setCampaign(next);
      })
      .catch(() => setCampaign(null));
  }, []);

  useEffect(() => {
    setLoading(true);
    const apiSort = sort === 'price_low' ? 'price-asc' : sort === 'discount' ? 'newest' : sort;
    productAPI.getAll({ onSale: true, limit: 48, sort: apiSort })
      .then(res => setProducts(res.data?.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [sort]);

  const hasProducts = products.length > 0;
  const visibleProducts = useMemo(() => {
    if (sort !== 'discount') return products;
    const discountValue = product => {
      if (Number(product.discountPercentage) > 0) return Number(product.discountPercentage);
      if (product.originalPrice > product.price) {
        return ((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100;
      }
      if (product.promotion?.type === 'percentage') return Number(product.promotion.value || 0);
      return 0;
    };
    return [...products].sort((a, b) => discountValue(b) - discountValue(a));
  }, [products, sort]);

  return (
    <div className="aren-offers-page">
      {/* ── HERO ── */}
      <div className="offers-hero" style={{ backgroundImage: `url("${offersHero}")` }}>
        <div className="offers-hero-inner">
          <div className="offers-hero-copy">
            <span className="offers-eyebrow"><FaFire /> {campaign?.eyebrow && campaign.eyebrow !== 'Limited time offers' ? campaign.eyebrow : 'عروض لفترة محدودة'}</span>
            <h1>{campaign?.titleLine1 && campaign.titleLine1 !== 'Big deals.' ? campaign.titleLine1 : 'عروض كبيرة.'}<br /><em>{campaign?.titleLine2 && campaign.titleLine2 !== 'Small prices.' ? campaign.titleLine2 : 'بأسعار مميزة.'}</em></h1>
            <p>{campaign?.description || 'اكتشفي عروضًا حقيقية على مجموعة مختارة من الاشتراكات والمنتجات الرقمية — موثوقة وفورية ولا تفوّت.'}</p>
            <div className="offers-hero-pills">
              <span><FaCheckCircle /> عروض موثوقة</span>
              <span><FaBolt /> توصيل فوري</span>
              <span><FaClock /> لفترة محدودة</span>
            </div>
          </div>

          {campaign?.enabled !== false && campaign?.showCountdown && campaign?.countdownEndsAt && (
          <div className="offers-countdown">
            <span className="offers-countdown-label"><span className="offers-live-dot" /> ينتهي العرض خلال</span>
            <div className="offers-countdown-grid">
              <div className="offers-countdown-box"><b>{countdown.d}</b><span>يوم</span></div>
              <div className="offers-countdown-box"><b>{countdown.h}</b><span>ساعة</span></div>
              <div className="offers-countdown-box"><b>{countdown.m}</b><span>دقيقة</span></div>
              <div className="offers-countdown-box"><b>{countdown.s}</b><span>ثانية</span></div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* ── URGENCY STRIP ── */}
      {false && hasProducts && campaign?.enabled !== false && (
        <div className="offers-strip">
          <div className="offers-strip-inner">
            <div className="offers-strip-icon"><FaTags /></div>
            <div className="offers-strip-text">
              <strong>{campaign?.stripTitle || 'Special prices are live right now'}</strong>
              <span>{campaign?.stripText || 'Grab your favorites before the promotion ends — stock is limited on some titles.'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION HEADING ── */}
      {hasProducts && (
        <div className="offers-section-heading">
          <div>
            <span className="offers-eyebrow2">وفّري أكثر اليوم</span>
            <h2>العروض الحالية</h2>
          </div>
          <Link to="/products" className="offers-view-all">عرض كل المنتجات ←</Link>
        </div>
      )}

      {/* ── SORT CHIPS ── */}
      {hasProducts && (
        <div className="offers-sort-row">
          {SORTS.map(s => (
            <button
              key={s.key}
              type="button"
              className={`offers-sort-chip${sort === s.key ? ' active' : ''}`}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── GRID / LOADING / EMPTY ── */}
      {loading ? (
        <div className="offers-grid">
          {Array.from({ length: 12 }).map((_, i) => <OfferSkeleton key={i} />)}
        </div>
      ) : hasProducts ? (
        <div className="offers-grid">
          {visibleProducts.map((product, i) => (
            <div className="offers-product-card" key={product._id} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="offers-product-ribbon"><FaFire /> {product.promotion?.name || (product.discountPercentage ? `خصم ${product.discountPercentage}%` : 'عرض خاص')}</div>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="offers-empty">
          <div className="offers-empty-icon"><FaTags /></div>
          <h2>لا توجد عروض نشطة حاليًا</h2>
          <p>ستظهر العروض الجديدة هنا عند توفرها. تحققي مرة أخرى قريبًا أو تصفحي الكتالوج الكامل.</p>
          <Link className="offers-gold-button" to="/products">تصفح المنتجات ←</Link>
        </div>
      )}
    </div>
  );
}
