import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { FaUsers, FaBox, FaBolt, FaRocket, FaFilm, FaShoppingBasket, FaClock, FaCheckCircle, FaTags } from 'react-icons/fa';
import { SiSpotify, SiFigma, SiDiscord } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { authAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import promoBanner from '../assets/promo-banner.png';
import arenBanner from '../assets/aren-banner.jpg';
import arenHeroReference from '../assets/aren-hero-purple.png';
import { AREN_CATALOG } from '../config/arenCatalog';
import { useCurrency } from '../context/CurrencyContext';

// ─────────────────────────────────────────────
// SLIDER DATA
// ─────────────────────────────────────────────
const SLIDES = [
  {
    heroExact: true,
    tag: 'Official Launch', tagColor: '#C9A96A',
    title: 'Your Favorite\nSubscriptions, Simplified.', subtitle: 'All your digital subscriptions in one place.\nPremium accounts • Instant delivery • Best prices',
    desc: '', price: '', oldPrice: null, discount: '', discountBg: '#C9A96A',
    cta: 'تسوق الآن', ctaLink: '/products', secondaryCta: 'كيف نعمل؟', secondaryCtaLink: '/about',
    features: ['توصيل فوري', 'دفع آمن', 'دعم على مدار الساعة'],
    accentColor: '#C9A96A',
    bg: '#030405',
    bgText: 'AREN',
    image: arenHeroReference,
    imgPlaceholder: { label: 'AREN BANNER', color1: '#111214', color2: '#28231A' },
  },
  {
    tag: 'New Release', tagColor: '#B99661',
    title: 'Verdant Siege', subtitle: 'Strategy Epic · Season 4',
    desc: 'Build, conquer, dominate.\nSeason 4 is live now with instant key activation.',
    price: '$14.99', oldPrice: '$49.99', discount: '70% OFF', discountBg: '#0284C7',
    cta: 'استكشف التطبيقات', ctaLink: '/products?catalog=social-daily-apps',
    accentColor: '#B99661',
    bg: 'linear-gradient(135deg, #111214 0%, #24201A 60%, #0D0E10 100%)',
    bgText: 'VS',
    image: promoBanner,
    imgPlaceholder: { label: 'GAME SCREENSHOT', color1: '#071520', color2: '#0C2233' },
  },
  {
    tag: 'Exclusive Codes', tagColor: '#C9A96A',
    title: 'Digital Game Keys', subtitle: 'Up to 50% OFF Top Titles',
    desc: 'Steam, Epic Games, Xbox & PlayStation keys delivered to your inbox.',
    price: 'From $4.99', oldPrice: null, discount: '50% OFF', discountBg: '#C2410C',
    cta: 'استكشف الأدوات', ctaLink: '/products?catalog=design-productivity-ai',
    accentColor: '#C9A96A',
    bg: 'linear-gradient(135deg, #111214 0%, #30251A 60%, #0D0E10 100%)',
    bgText: 'KEYS',
    image: arenBanner,
    imgPlaceholder: { label: 'GAME COLLECTION', color1: '#1E0E04', color2: '#2D1606' },
  },
  {
    tag: 'Best Sellers', tagColor: '#D8B873',
    title: 'Subscriptions', subtitle: 'Instant Digital Access',
    desc: 'Netflix, Spotify, Discord Nitro, ChatGPT Plus & more — ready to activate.',
    price: 'From $2.99', oldPrice: null, discount: '40% OFF', discountBg: '#7E22CE',
    cta: 'استكشف الترفيه', ctaLink: '/products?catalog=movies-entertainment',
    accentColor: '#D8B873',
    bg: 'linear-gradient(135deg, #111214 0%, #29231A 60%, #0D0E10 100%)',
    bgText: 'PASS',
    image: promoBanner,
    imgPlaceholder: { label: 'STREAMING PLATFORMS', color1: '#140626', color2: '#240B42' },
  },
];

const SIDE_BANNERS = [
  {
    tag: 'Flash Sale', tagColor: '#C9A96A',
    title: 'Music & Audio', subtitle: 'Premium listening',
    desc: '1,000+ digital titles available',
    cta: 'استكشف الصوتيات', ctaLink: '/products?catalog=music-audio',
    accentColor: '#C9A96A',
    bg: 'linear-gradient(135deg, #17181B 0%, #2A241A 100%)',
    borderColor: '#C9A96A',
    imgPlaceholder: { label: 'EBOOKS', color1: '#2A1A05', color2: '#3D2608' },
  },
  {
    tag: 'Instant', tagColor: '#B99661',
    title: 'Social & Daily Apps', subtitle: 'Everyday premium access',
    desc: 'All major brands & platforms',
    cta: 'استكشف التطبيقات', ctaLink: '/products?catalog=social-daily-apps',
    accentColor: '#B99661',
    bg: 'linear-gradient(135deg, #17181B 0%, #24211B 100%)',
    borderColor: '#B99661',
    imgPlaceholder: { label: 'VOUCHERS', color1: '#071A28', color2: '#0C2840' },
  },
];

const SLIDE_DURATION = 4500;

// ─────────────────────────────────────────────
// GLOBAL STYLES – injected once via <head>
// ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg-base: #0D0E10;
    --bg-surface: #17181B;
    --bg-card: #17181B;
    --border: rgba(201,169,106,0.18);
    --text-primary: #F5F0E7;
    --text-muted: #A7A19A;
    --accent: #C9A96A;
    --radius-md: 18px;
    --radius-lg: 20px;
  }
  body { background: var(--bg-base); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-primary); }


  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes statFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes statCountUp {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes statBarFill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  /* ── Progress bar CSS animation (no JS rerenders) ── */
  @keyframes progressBarRun {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .progress-bar-anim {
    animation: progressBarRun var(--slide-dur, 4.5s) linear forwards;
  }

  .cat-section { width:100%;display:flex;align-items:stretch;margin-bottom:32px;border-radius:18px;overflow:hidden;height:auto;min-height:auto; }
  @media(max-width:768px){ .cat-section{flex-direction:column;border-radius:14px;margin-bottom:20px;} }

  .brand-panel { width:320px;min-width:320px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 28px;text-align:center;flex-shrink:0;position:relative;overflow:hidden; }
  @media(max-width:1024px){ .brand-panel{width:260px;min-width:260px;padding:36px 20px;} }
  @media(max-width:768px){ .brand-panel{width:100%;min-width:unset;padding:28px 20px;min-height:180px;} }
  .brand-panel .logo-svg{width:110px;height:110px;margin-bottom:22px;z-index:2;}
  @media(max-width:768px){ .brand-panel .logo-svg{width:70px;height:70px;margin-bottom:14px;} }
  .brand-panel h2{font-size:30px;font-weight:900;color:#fff;line-height:1.05;margin-bottom:12px;z-index:2;}
  @media(max-width:1024px){ .brand-panel h2{font-size:24px;} }
  @media(max-width:768px){ .brand-panel h2{font-size:20px;margin-bottom:6px;} }
  .brand-panel p{font-size:14.5px;color:rgba(255,255,255,0.88);line-height:1.5;z-index:2;}
  @media(max-width:768px){ .brand-panel p{font-size:12.5px;} }

  .products-area{flex:1;display:flex;align-items:stretch;position:relative;overflow:hidden;padding:0 16px;min-width:0;height:auto;}
  @media(max-width:768px){ .products-area{padding:0 10px;} }

  .products-slider{display:flex;gap:16px;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scrollbar-width:none;align-items:stretch;padding:16px 4px;flex:1;height:100%;}
  .products-slider::-webkit-scrollbar{display:none;}
  @media(max-width:768px){ .products-slider{gap:12px;padding:12px 4px;} }

  .scroll-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;background:rgba(15,20,10,0.82);border:1px solid rgba(255,255,255,0.14);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(0,0,0,0.45);z-index:10;color:#fff;font-size:18px;transition:all 0.22s ease;backdrop-filter:blur(8px);}
  .scroll-arrow:hover{transform:translateY(-50%) scale(1.1);background:rgba(30,50,20,0.95);border-color:rgba(74,222,128,0.4);}
  .scroll-arrow.left{left:10px;}
  .scroll-arrow.right{right:10px;}
  .scroll-arrow.hidden{opacity:0;pointer-events:none;}
  @media(max-width:480px){ .scroll-arrow{width:34px;height:34px;font-size:15px;} }

  .hero-grid{display:block;min-height:370px;}
  @media(max-width:768px){ .hero-grid{min-height:unset;} }

  .side-banners{display:flex;flex-direction:column;gap:12px;}
  @media(max-width:768px){ .side-banners{flex-direction:row;} }
  @media(max-width:480px){ .side-banners{flex-direction:column;} }

  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);}
  @media(max-width:768px){ .stats-grid{grid-template-columns:repeat(2,1fr);} }

  .featured-scroll{display:flex;gap:18px;overflow-x:auto;scrollbar-width:none;padding-bottom:10px;}
  .featured-scroll::-webkit-scrollbar{display:none;}

  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding:0 20px;gap:12px;flex-wrap:wrap;}
  @media(max-width:480px){ .section-header{padding:0 14px;margin-bottom:16px;} }
  .section-title-row{display:flex;align-items:center;gap:14px;}
  .section-accent-bar{width:4px;min-height:44px;border-radius:3px;flex-shrink:0;}
  @media(max-width:480px){ .section-accent-bar{min-height:36px;} }

  .cat-view-all{margin-top:22px;background:rgba(255,255,255,0.18);color:#fff;padding:11px 26px;border-radius:30px;font-size:13.5px;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,0.38);transition:all 0.22s;z-index:2;display:inline-block;}
  @media(max-width:768px){ .cat-view-all{padding:8px 20px;font-size:12px;margin-top:14px;} }
  .cat-view-all:hover{background:rgba(255,255,255,0.3);}

  .hp-wrapper{background:radial-gradient(circle at 50% -20%,#28231A 0%,var(--bg-base) 42%);min-height:100vh;padding-top:80px;font-family:'DM Sans',sans-serif;}
  @media(max-width:768px){ .hp-wrapper{padding-top:64px;} }

  .hp-section{width:100%;max-width:none;margin:0;padding:0;}
  @media(max-width:768px){ .hp-section{padding:0;} }

  .featured-section{padding:60px 0 56px;max-width:1280px;margin:0 auto;}
  @media(max-width:768px){ .featured-section{padding:36px 0 32px;} }

  .cat-section-wrapper{max-width:1280px;margin:0 auto 32px;padding:0 20px;}
  @media(max-width:768px){ .cat-section-wrapper{padding:0 14px;margin-bottom:20px;} }

  .dv-section-label{display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;color:rgba(255,255,255,0.38);}
  .dv-section-label::before,.dv-section-label::after{content:'';display:block;height:1px;width:28px;background:rgba(255,255,255,0.15);}

  .stat-card{position:relative;padding:24px 16px 20px;text-align:center;cursor:default;overflow:hidden;transition:transform 0.3s ease,background 0.3s ease;}
  .stat-card:hover{transform:translateY(-4px);background:rgba(255,255,255,0.03);}
  .stat-card.visible{animation:statFadeUp 0.6s ease both;}
  .stat-value{font-family:'Rajdhani',sans-serif;font-size:clamp(26px,3.5vw,36px);font-weight:900;letter-spacing:-0.02em;line-height:1;margin-bottom:6px;}
  .stat-value.animate{animation:statCountUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both;}
  .stat-label{font-family:'Outfit',sans-serif;font-size:clamp(11px,1.3vw,12.5px);color:rgba(255,255,255,0.55);letter-spacing:0.03em;}
  .stat-bar{position:absolute;bottom:0;left:0;height:2px;border-radius:2px;width:0%;}
  .stat-bar.animate{animation:statBarFill 1.2s cubic-bezier(0.22,1,0.36,1) both;}
  .stat-dot{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;transition:transform 0.3s ease;}
    .stat-card:hover .stat-dot{transform:scale(1.18) rotate(-6deg);}
    .stat-card.visible .stat-dot{animation:iconPulse 0.5s cubic-bezier(0.34,1.56,0.64,1);}

    @keyframes productRise {
      from { opacity: 0; transform: translateY(18px) scale(.96); filter: blur(2px); }
      to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes productGlow {
      0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.24); }
      50% { box-shadow: 0 16px 34px rgba(34,197,94,0.14); }
    }
    .hp-product-card {
      animation: productRise 0.62s cubic-bezier(.22,.68,0,1.2) both;
      transform-origin: center bottom;
      will-change: transform, opacity, filter;
    }

    .hp-wrapper{background:radial-gradient(circle at 50% -12%,rgba(201,169,106,.16),transparent 30%),#030405;}
    .hero-grid{min-height:370px;}
    .featured-section{padding-top:42px;}
    .popular-section{padding:34px 0 30px;}
    .popular-section .section-header{margin-bottom:18px;padding:0 4px 16px;}
    .popular-section .featured-scroll{gap:18px;padding:0 4px 14px;}
    .popular-slider-shell{position:relative;}
    .popular-slider-arrow{position:absolute;top:50%;z-index:3;width:40px;height:40px;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;border:1px solid rgba(190,145,255,.45);border-radius:50%;background:rgba(12,9,19,.92);color:#d9b8ff;font-size:24px;line-height:1;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.35);transition:.2s;}
    .popular-slider-arrow:hover{background:#29163d;border-color:#caa5ff;transform:translateY(-50%) scale(1.08);}
    .popular-slider-arrow.left{left:-18px;}.popular-slider-arrow.right{right:-18px;}
    @media(max-width:900px){.popular-slider-arrow.left{left:2px;}.popular-slider-arrow.right{right:2px;}}
    .popular-card{background:linear-gradient(145deg,#12101a,#08080d)!important;border:1px solid rgba(190,145,255,.24)!important;border-radius:15px!important;width:270px!important;min-width:270px!important;height:292px!important;box-shadow:0 8px 24px rgba(0,0,0,.28)!important;}
    .popular-card:hover{border-color:rgba(205,166,255,.62)!important;box-shadow:0 14px 30px rgba(88,45,140,.24)!important;}
    .popular-card > a:first-child{height:140px!important;background:linear-gradient(135deg,#181421,#0b0a10)!important;}
    .popular-card > a:first-child img{height:100%!important;object-fit:cover!important;}
    .popular-card .popular-featured-badge{display:none!important;}
    .popular-card .popular-card-badge{top:111px!important;right:12px!important;background:rgba(91,42,145,.58)!important;color:#d9b8ff!important;border:1px solid rgba(205,166,255,.25);font-size:11px!important;padding:4px 9px!important;}
    .popular-card-body{padding:13px 15px 15px!important;gap:5px!important;}
    .popular-card .popular-card-platform{display:none!important;}
    .popular-card-title{font-size:15px!important;line-height:1.28!important;color:#f7f3ff!important;}
    .popular-card-duration{font:11px/1.25 'Outfit',sans-serif;color:rgba(232,221,248,.52);}
    .popular-card-rating{display:flex;align-items:center;gap:6px;margin-top:2px;font:11px 'Outfit',sans-serif;color:rgba(232,221,248,.55);}
    .popular-card-rating span{color:#f4c84e;letter-spacing:1px;font-size:11px;}
    .popular-card-footer{padding-top:7px!important;gap:7px!important;}
    .popular-card-price{font-size:20px!important;color:#f7f3ff!important;}
    .popular-card-old-price{font-size:11px!important;color:rgba(232,221,248,.4)!important;}
    .popular-card-add{padding:6px 10px!important;border-radius:7px!important;font-size:11px!important;}
    .popular-card-add{background:linear-gradient(135deg,#a66cff,#7440b5)!important;border-color:#caa5ff!important;color:#fff!important;box-shadow:0 5px 14px rgba(116,64,181,.28);}
    .popular-card-add:hover:not(:disabled){background:linear-gradient(135deg,#caa5ff,#925bd6)!important;color:#160d22!important;transform:translateY(-1px);}
    .popular-card-heart{position:absolute;top:12px;right:12px;z-index:2;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(220,196,255,.4);border-radius:50%;background:rgba(10,7,15,.72);color:#eee4ff;font-size:21px;line-height:1;cursor:pointer;transition:.2s;}
    .popular-card-heart:hover,.popular-card-heart.selected{background:rgba(166,108,255,.28);border-color:#caa5ff;color:#d6adff;transform:scale(1.08);}
    .popular-card-heart:disabled{opacity:.65;cursor:wait;}
    @media(max-width:520px){.popular-card{width:250px!important;min-width:250px!important;height:280px!important;}.popular-card > a:first-child{height:132px!important;}.popular-card .popular-card-badge{top:103px!important;}}
    .popular-fire{font-size:20px;line-height:1;}
    .aren-offers-empty{margin:0 4px;padding:34px 20px;border:1px dashed rgba(190,145,255,.25);border-radius:14px;background:rgba(166,108,255,.035);color:rgba(232,221,248,.58);font:13px 'Outfit',sans-serif;text-align:center;}
    .home-offers-section{position:relative;overflow:hidden;padding:26px 28px 24px;border:1px solid rgba(171,137,255,.28);border-radius:18px;background:radial-gradient(circle at 84% 8%,rgba(255,50,104,.2),transparent 30%),radial-gradient(circle at 16% 100%,rgba(112,63,255,.18),transparent 36%),linear-gradient(145deg,#090916,#0e0b20 55%,#090910);box-shadow:0 18px 45px rgba(0,0,0,.4),inset 0 1px rgba(220,190,255,.12);}
    .home-offers-section::before{content:'';position:absolute;inset:0;opacity:.55;background:linear-gradient(125deg,transparent 35%,rgba(203,104,255,.13) 52%,transparent 70%);pointer-events:none;}
    .home-offers-section .section-header{position:relative;z-index:1;}
    .home-offer-banners{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;padding:0 2px;}
    .home-offer-banner{position:relative;min-height:245px;overflow:hidden;border:1px solid rgba(171,137,255,.36);border-radius:14px;background:#0b0b14;text-decoration:none;color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.38);transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease;}
    .home-offer-banner:hover{transform:translateY(-5px);border-color:rgba(255,106,154,.75);box-shadow:0 18px 38px rgba(0,0,0,.5),0 0 28px rgba(184,92,255,.15);}
    .home-offer-banner::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,3,10,.05) 0%,rgba(5,4,14,.18) 36%,rgba(5,4,12,.96) 78%);pointer-events:none;}
    .home-offer-banner.product-offer{background-size:cover;background-position:center top;}
    .home-offer-banner.product-offer .home-offer-copy{position:absolute;inset:auto 0 0;z-index:1;padding:14px 14px 13px;}
    .home-offer-copy h3{font:700 15px/1.15 'Rajdhani',sans-serif;margin:0 0 5px;color:#fff;}
    .home-offer-copy p{font:11px/1.4 'Outfit',sans-serif;color:rgba(255,255,255,.65);margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .home-offer-price{display:flex;align-items:baseline;gap:8px;font:800 16px 'Outfit',sans-serif;}.home-offer-price del{font-size:9px;color:rgba(255,255,255,.4);font-weight:500;}
    .home-offer-badge{display:inline-flex;margin-bottom:10px;padding:5px 9px;border-radius:12px;background:rgba(242,63,112,.16);border:1px solid rgba(255,113,160,.42);color:#ffabc6;font:700 9px 'Outfit',sans-serif;}
    .home-offer-action{display:inline-flex;align-items:center;justify-content:center;margin:9px 0 0;width:38px;height:34px;border:1px solid rgba(199,155,255,.55);border-radius:8px;color:#d8bcff;font-size:14px;background:rgba(132,76,255,.14);transition:all .2s;}
    .home-offer-action:hover{color:#fff;background:#9858ed;border-color:#d8bcff;transform:translateY(-2px);}
    .home-offer-trust{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);margin:16px 2px 0;border:1px solid rgba(171,137,255,.2);border-radius:12px;background:rgba(5,4,17,.66);box-shadow:inset 0 1px rgba(255,255,255,.06);overflow:hidden;}
    .home-offer-trust-item{display:flex;align-items:center;gap:9px;min-height:56px;padding:9px 13px;color:#f2ecff;font:600 10px/1.35 'Outfit',sans-serif;border-right:1px solid rgba(171,137,255,.12);}
    .home-offer-trust-item:last-child{border-right:0;}
    .home-offer-trust-item svg{width:32px;height:32px;padding:8px;border-radius:9px;color:#c7a7ff;background:rgba(143,87,255,.14);border:1px solid rgba(199,167,255,.24);font-size:14px;flex-shrink:0;}
    @media(max-width:1050px){.home-offers-section{padding:28px 24px;}.home-offer-banners{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media(max-width:560px){.home-offers-section{padding:24px 14px;}.home-offer-banners{grid-template-columns:1fr;}.home-offer-banner{min-height:250px;}.home-offer-trust{grid-template-columns:1fr;}.home-offer-trust-item{border-right:0;border-bottom:1px solid rgba(255,255,255,.06);}.home-offer-trust-item:last-child{border-bottom:0;}}
    .section-header{border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:18px;}
    .cat-section{border:1px solid rgba(201,169,106,.18);box-shadow:0 14px 42px rgba(0,0,0,.22);}
    .cat-view-all{color:#17130b;background:#c9a96a;border-color:#c9a96a;}
    .cat-view-all:hover{background:#e2c27e;}
    .scroll-arrow:hover{background:#17130b;border-color:#c9a96a;}
    .hero-secondary-cta{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 18px;border:1px solid rgba(255,255,255,.28);border-radius:8px;color:#f5f0e7;text-decoration:none;font:600 12px 'Outfit',sans-serif;transition:border-color .2s,background .2s;}
    .hero-secondary-cta:hover{border-color:#c9a96a;background:rgba(201,169,106,.08);}
    .hero-secondary-cta span{color:#efba42;font-size:16px;}
    .hero-features{display:flex;align-items:center;gap:0;margin-top:25px;padding:10px 12px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:rgba(5,6,7,.68);width:fit-content;color:#ddd9cf;font:11px 'Outfit',sans-serif;}
    .hero-features span{display:inline-flex;align-items:center;gap:6px;padding:0 13px;border-right:1px solid rgba(255,255,255,.18);}
    .hero-features span:first-child{padding-left:0;}.hero-features span:last-child{padding-right:0;border-right:0;}.hero-features b{color:#efba42;font-size:14px;}
    .aren-static-hero{position:relative;width:100%;min-height:560px;overflow:hidden;border:0;border-radius:0;background-color:#030405;background-position:center center;background-repeat:no-repeat;background-size:cover;}
    .aren-static-hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.62) 40%,rgba(0,0,0,.16) 75%,rgba(0,0,0,.06) 100%);}
    .aren-static-hero-content{position:absolute;z-index:1;left:0;right:auto;top:0;bottom:0;width:min(680px,58%);display:flex;align-items:flex-start;min-height:560px;flex-direction:column;justify-content:center;padding:40px clamp(24px,5vw,72px);box-sizing:border-box;text-align:left;direction:ltr;}
    .aren-static-hero-content h2{margin:0 0 12px;color:#fff;font:800 clamp(32px,4.8vw,52px)/1.02 'Rajdhani',sans-serif;letter-spacing:-.02em;}
    .aren-static-hero-content h2 em{color:#efba42;font-style:normal;}
    .aren-static-hero-content p{margin:0;color:#e3e0d8;font:500 clamp(13px,1.5vw,17px)/1.55 'Outfit',sans-serif;}
    .aren-static-hero-content p[dir="rtl"]{width:100%;max-width:500px;direction:rtl;text-align:left;unicode-bidi:plaintext;}
    .aren-static-hero-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:24px;}
    .aren-static-primary,.aren-static-secondary{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:42px;padding:0 20px;border-radius:7px;text-decoration:none;font:700 12px 'Outfit',sans-serif;transition:.2s;}
    .aren-static-primary{color:#111;background:#efba42;box-shadow:0 7px 24px rgba(239,186,66,.22);}.aren-static-primary:hover{background:#ffd36b;transform:translateY(-2px);}.aren-static-primary span{font-size:18px;}
    .aren-static-secondary{color:#f4f2eb;border:1px solid rgba(255,255,255,.3);}.aren-static-secondary:hover{border-color:#efba42;background:rgba(239,186,66,.08);}.aren-static-secondary span{color:#efba42;font-size:16px;}
    .aren-static-features{display:flex;align-items:center;width:max-content;max-width:100%;margin-top:27px;padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:rgba(5,6,7,.72);color:#ddd9cf;font:10px 'Outfit',sans-serif;}
    .aren-static-features span{display:inline-flex;align-items:center;gap:7px;padding:0 12px;border-right:1px solid rgba(255,255,255,.18);white-space:nowrap;}.aren-static-features span:first-child{padding-left:0;}.aren-static-features span:last-child{padding-right:0;border-right:0;}.aren-static-features svg{width:16px;height:16px;fill:none;stroke:#efba42;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none;}
    @media(max-width:768px){.aren-static-hero,.aren-static-hero-content{min-height:500px;}.aren-static-hero{background-position:center center;}.aren-static-hero-content{position:absolute;left:0;right:0;width:100%;padding:28px 24px;justify-content:flex-end;padding-bottom:34px;}.aren-static-hero-overlay{background:linear-gradient(180deg,rgba(0,0,0,.12) 0%,rgba(0,0,0,.48) 42%,rgba(0,0,0,.94) 100%);}.aren-static-features{width:100%;justify-content:space-between;padding:9px 7px;}.aren-static-features span{padding:0 6px;font-size:9px;}}
    @media(max-width:420px){.aren-static-hero,.aren-static-hero-content{min-height:520px;}.aren-static-hero-content{padding-left:18px;padding-right:18px;}.aren-static-hero-content h2{font-size:34px;}.aren-static-features span{font-size:8px;gap:3px;padding:0 4px;}}
    .home-category-rail{max-width:1280px;margin:0 auto;padding:0 20px 18px;}
    .home-category-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
    .home-category-heading h2{font-family:'Rajdhani',sans-serif;font-size:clamp(20px,3vw,28px);color:#f5f0e7;}
    .home-category-heading p{display:none;}
    .home-category-heading a{color:#caa5ff;text-decoration:none;font:700 12px 'Outfit',sans-serif;}
    .home-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}
    @keyframes categoryGlow{0%,100%{opacity:.35;transform:scale(.92)}50%{opacity:.8;transform:scale(1.08)}}
    @keyframes categoryRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .home-category-tile{position:relative;isolation:isolate;overflow:hidden;display:flex;min-height:112px;flex-direction:column;justify-content:center;align-items:center;gap:11px;padding:14px 9px;border:1px solid rgba(190,145,255,.18);border-radius:13px;background:linear-gradient(145deg,#15151a,#0b0b0f);color:#f3effa;text-decoration:none;text-align:center;transition:transform .25s,border-color .25s,background .25s,box-shadow .25s;animation:categoryRise .55s ease both;}
    .home-category-tile:nth-child(2){animation-delay:.08s}.home-category-tile:nth-child(3){animation-delay:.16s}.home-category-tile:nth-child(4){animation-delay:.24s}
    .home-category-tile::before{content:'';position:absolute;z-index:-1;top:-34px;left:50%;width:90px;height:90px;border-radius:50%;background:#a66cff;filter:blur(28px);animation:categoryGlow 3s ease-in-out infinite;}
    .home-category-tile:nth-child(2)::before{background:#5b8cff;animation-delay:.5s}.home-category-tile:nth-child(3)::before{background:#e18cff;animation-delay:1s}.home-category-tile:nth-child(4)::before{background:#caa5ff;animation-delay:1.5s}
    .home-category-tile:hover{transform:translateY(-6px) scale(1.025);border-color:rgba(202,165,255,.8);background:linear-gradient(145deg,#251534,#100c16);box-shadow:0 14px 30px rgba(112,62,164,.32);}
    .home-category-tile strong{font:700 13px 'Outfit',sans-serif;line-height:1.2;}
    .home-category-tile span.home-category-icon{display:flex;width:52px;height:52px;align-items:center;justify-content:center;border-radius:14px;color:#dfc9ff;font-size:25px;transition:transform .25s,color .25s,box-shadow .25s;background:linear-gradient(145deg, color-mix(in srgb, var(--icon-color,#a66cff) 24%, #15151a), color-mix(in srgb, var(--icon-color,#a66cff) 6%, #0b0b0f));border:1px solid color-mix(in srgb, var(--icon-color, #a66cff) 45%, transparent);box-shadow:0 0 18px color-mix(in srgb, var(--icon-color, #a66cff) 28%, transparent),inset 0 0 14px color-mix(in srgb, var(--icon-color, #a66cff) 14%, transparent);}
    .home-category-tile span.home-category-icon svg{width:26px;height:26px;transition:transform .25s;color:var(--icon-color,#dfc9ff);}
    .home-category-tile:hover span.home-category-icon{transform:rotate(-6deg) scale(1.14);box-shadow:0 0 26px color-mix(in srgb, var(--icon-color, #a66cff) 55%, transparent),inset 0 0 16px color-mix(in srgb, var(--icon-color, #a66cff) 22%, transparent);}
    .home-category-tile:hover span.home-category-icon svg{transform:rotate(6deg);}
    @media(max-width:768px){.hero-grid{min-height:unset;}.home-category-rail{padding:0 14px 12px;}.home-category-grid{gap:9px;}.home-category-tile{min-height:94px;padding:10px 6px;}.home-category-tile strong{font-size:10px;}.home-category-tile span.home-category-icon{width:44px;height:44px;}.home-category-tile span.home-category-icon svg{width:22px;height:22px;}}
    @media(max-width:480px){.home-category-grid{display:flex;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;}.home-category-grid::-webkit-scrollbar{display:none;}.home-category-tile{min-width:145px;}.hero-features{width:100%;justify-content:space-between;padding:9px 7px;}.hero-features span{padding:0 7px;font-size:9px;}.hero-secondary-cta{padding:0 13px;}}
   
  `;

// inject styles ONCE into <head>
let stylesInjected = false;
function injectGlobalStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'hp-global-styles';
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ─────────────────────────────────────────────
// CUSTOM HOOK: Intersection Observer (lazy load)
// ─────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '200px', ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

// ─────────────────────────────────────────────
// PLACEHOLDER SVG
// ─────────────────────────────────────────────
const PlaceholderImage = memo(function PlaceholderImage({ placeholder, style }) {
  const id = placeholder.label.replace(/ /g, '');
  const words = placeholder.label.split(' ');
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, mid).join(' ');
  const l2 = words.slice(mid).join(' ');
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }}
      viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`pg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={placeholder.color1} />
          <stop offset="100%" stopColor={placeholder.color2} />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill={`url(#pg-${id})`} />
      {[80, 160, 240].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
      {[200, 400, 600].map(x => <line key={x} x1={x} y1="0" x2={x} y2="320" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
      <rect x="530" y="122" width="140" height="64" rx="6" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4,3" />
      <text x="600" y="148" fontFamily="Rajdhani,sans-serif" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.17)" textAnchor="middle" letterSpacing="3">{l1}</text>
      {l2 && <text x="600" y="168" fontFamily="Rajdhani,sans-serif" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.17)" textAnchor="middle" letterSpacing="3">{l2}</text>}
    </svg>
  );
});

const SidePlaceholder = memo(function SidePlaceholder({ placeholder }) {
  const id = placeholder.label.replace(/ /g, '');
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
      viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={placeholder.color1} />
          <stop offset="100%" stopColor={placeholder.color2} />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill={`url(#sp-${id})`} />
      <text x="100" y="80" fontFamily="Rajdhani,sans-serif" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.35)" textAnchor="middle" letterSpacing="2">{placeholder.label}</text>
      <rect x="60" y="62" width="80" height="30" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,2" />
    </svg>
  );
});

// ─────────────────────────────────────────────
// PROMO SLIDER — progress bar via CSS only (no rerenders)
// ─────────────────────────────────────────────
function PromoSlider() {
  return (
    <div className="aren-static-hero" role="img" aria-label="Aren Store subscriptions" style={{ backgroundImage: `url(${arenHeroReference})` }}>
      <div className="aren-static-hero-overlay" />
      <div className="aren-static-hero-content">
        <h2>Your Favorite<br />Subscriptions, <em>Simplified.</em></h2>
        <p dir="rtl">كل اشتراكاتك الرقمية في مكان واحد.<br />حسابات مميزة • توصيل خلال 24 ساعة • أفضل الأسعار</p>
        <div className="aren-static-hero-actions">
          <Link to="/products" className="aren-static-primary">Shop Now <span>→</span></Link>
        </div>
        <div className="aren-static-features">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>توصيل فوري</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>دفع آمن</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><path d="M4 15h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 1 1-1v-4ZM12 20v1" /></svg>دعم 24/7</span>
        </div>
      </div>
    </div>
  );
}

function LegacyPromoSlider() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [progressKey, setProgressKey] = useState(0); // only used to restart CSS animation

  const goTo = useCallback((idx) => {
    setCurrent(prev => {
      if (idx === prev || fading) return prev;
      setFading(true);
      setProgressKey(k => k + 1);
      setTimeout(() => { setCurrent(idx); setFading(false); }, 300);
      return prev;
    });
  }, [fading]);

  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);
  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    const t = setInterval(next, SLIDE_DURATION);
    return () => clearInterval(t);
  }, [next]);

  const s = SLIDES[current];

  const NavBtn = useCallback(({ dir, action }) => (
    <button
      onClick={action}
      style={{
        position: 'absolute',
        [dir === 'left' ? 'left' : 'right']: 14,
        top: '50%', transform: 'translateY(-50%)',
        zIndex: 10, width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(0,0,0,0.42)', border: '1px solid rgba(255,255,255,0.13)',
        color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s', backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.72)'; e.currentTarget.style.borderColor = `${s.accentColor}80`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.42)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; }}
    >
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  ), [s.accentColor]);

  return (
    <div style={{
      position: 'relative', flex: 1, minWidth: 0,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      background: s.bg, transition: 'background 0.5s ease',
      minHeight: 300,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      {s.image ? (
        <img
          src={s.image}
          alt={s.title}
          loading="eager"
          decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.heroExact ? 'center center' : 'center', opacity: 1 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <PlaceholderImage placeholder={s.imgPlaceholder} style={{ opacity: 0.4 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: s.heroExact ? 'linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.52) 42%, rgba(0,0,0,.08) 74%, transparent 100%)' : (s.image ? 'linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.22) 55%, transparent 100%)' : 'linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 55%, transparent 100%)') }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.4, pointerEvents: 'none' }} />
      <div style={{
        position: 'absolute', right: -10, bottom: -20,
        fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(80px, 12vw, 160px)', fontWeight: 800,
        color: 'rgba(255,255,255,.025)', pointerEvents: 'none',
        zIndex: 1, lineHeight: 1, userSelect: 'none', letterSpacing: '-.04em',
      }}>{s.bgText}</div>

      <div style={{
        position: 'relative', zIndex: 2,
        padding: s.heroExact ? 'clamp(24px, 4vw, 40px) clamp(24px, 5vw, 48px)' : 'clamp(24px, 4vw, 40px) clamp(24px, 5vw, 48px)',
        height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateX(-14px)' : 'translateX(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}>
        {!s.heroExact && <span style={{
          display: 'inline-block', marginBottom: 14, width: 'fit-content',
          fontFamily: 'Rajdhani, sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: '.08em',
          color: s.tagColor, background: `${s.tagColor}18`,
          border: `1px solid ${s.tagColor}45`, padding: '4px 13px', borderRadius: 20,
        }}>{s.tag}</span>}

        <h2 style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 800,
          color: '#fff', margin: '0 0 10px', lineHeight: 1.0, letterSpacing: '-.01em', whiteSpace: 'pre-line', maxWidth: s.heroExact ? 520 : undefined,
        }}>{s.heroExact ? <>اشتراكاتك المفضلة<br />بكل <em style={{ color: '#efba42', fontStyle: 'normal' }}>سهولة.</em></> : s.title}</h2>

        <p style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(15px, 2.2vw, 22px)', fontWeight: 600,
          color: s.heroExact ? '#e7e4dc' : s.accentColor, margin: '0 0 10px', whiteSpace: 'pre-line', maxWidth: s.heroExact ? 440 : undefined,
        }}>{s.subtitle}</p>

        {!s.heroExact && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#fff' }}>{s.price}</span>
          {s.oldPrice && <span style={{ fontSize: 14, color: '#4b5563', textDecoration: 'line-through', fontWeight: 500 }}>{s.oldPrice}</span>}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, letterSpacing: '.06em',
            background: `${s.discountBg}25`, color: s.accentColor, border: `1px solid ${s.discountBg}45`,
          }}>{s.discount}</span>
        </div>}

        {!s.heroExact && <p style={{
          fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#6b7280', marginBottom: 24, lineHeight: 1.6,
          fontFamily: 'Outfit, sans-serif', whiteSpace: 'pre-line',
        }}>{s.desc}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: s.heroExact ? 8 : 0 }}>
          <Link
            to={s.ctaLink}
            style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: s.accentColor, color: '#fff',
            padding: 'clamp(10px,1.5vw,13px) clamp(18px,2.5vw,28px)',
            borderRadius: 10, width: 'fit-content',
            fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(12px,1.4vw,14px)', fontWeight: 700,
            textDecoration: 'none',
            boxShadow: `0 6px 28px ${s.accentColor}40`,
            transition: 'opacity .2s, transform .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {s.cta}
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
          {s.secondaryCta && <Link to={s.secondaryCtaLink} className="hero-secondary-cta"><span aria-hidden="true">▷</span>{s.secondaryCta}</Link>}
        </div>
        {s.features && <div className="hero-features">{s.features.map(feature => <span key={feature}><b>✦</b>{feature}</span>)}</div>}
      </div>

      <NavBtn dir="left" action={prev} />
      <NavBtn dir="right" action={next} />

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7, zIndex: 10 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i} onClick={() => goTo(i)}
            style={{
              width: i === current ? 24 : 7, height: 7, borderRadius: 4,
              border: 'none', padding: 0, cursor: 'pointer',
              background: i === current ? s.accentColor : 'rgba(255,255,255,0.2)',
              transition: 'width .35s ease, background .35s ease',
            }}
          />
        ))}
      </div>

      {/* ✅ CSS-only progress bar — zero JS rerenders */}
      <div
        key={progressKey}
        className="progress-bar-anim"
        style={{
          position: 'absolute', bottom: 0, left: 0, height: 2, zIndex: 10,
          background: s.accentColor,
          boxShadow: `0 0 8px ${s.accentColor}`,
          '--slide-dur': `${SLIDE_DURATION}ms`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDE BANNER — memoized
// ─────────────────────────────────────────────
const BookIcon = memo(({ color }) => (<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>));
const VoucherIcon = memo(({ color }) => (<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>));
const SIDE_ICONS = [BookIcon, VoucherIcon];

const SideBanner = memo(function SideBanner({ banner, index }) {
  const [hov, setHov] = useState(false);
  const Icon = SIDE_ICONS[index] || VoucherIcon;
  return (
    <Link
      to={banner.ctaLink}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '20px 22px', borderRadius: 'var(--radius-md)', overflow: 'hidden',
        background: banner.bg,
        border: `1px solid ${hov ? banner.borderColor + '55' : banner.borderColor + '22'}`,
        textDecoration: 'none', position: 'relative',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'border-color .22s, transform .22s ease, box-shadow .22s',
        boxShadow: hov ? `0 8px 28px ${banner.accentColor}18` : 'none',
        minHeight: 130,
      }}
    >
      <SidePlaceholder placeholder={banner.imgPlaceholder} />
      <div style={{ position: 'absolute', right: -12, bottom: -12, width: 110, height: 110, borderRadius: '50%', background: banner.accentColor, opacity: 0.07, filter: 'blur(38px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <span style={{
          display: 'inline-block', marginBottom: 10,
          fontFamily: 'Rajdhani, sans-serif', fontSize: 9, fontWeight: 700,
          letterSpacing: '.08em',
          color: banner.tagColor, background: `${banner.tagColor}1a`,
          border: `1px solid ${banner.tagColor}40`, padding: '3px 10px', borderRadius: 20,
        }}>{banner.tag}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${banner.accentColor}15`, marginBottom: 8, border: `1px solid ${banner.accentColor}20` }}>
          <Icon color={banner.accentColor} />
        </div>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f0e0', lineHeight: 1.1, margin: '0 0 2px' }}>{banner.title}</p>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 600, color: banner.accentColor, margin: '0 0 5px' }}>{banner.subtitle}</p>
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', marginBottom: 12, lineHeight: 1.4, fontFamily: 'Outfit, sans-serif' }}>{banner.desc}</p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: banner.accentColor, fontFamily: 'Outfit, sans-serif' }}>
          {banner.cta}
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </span>
      </div>
    </Link>
  );
});

// ─────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────
const SkeletonCard = memo(function SkeletonCard({ size = 'md' }) {
  const sizeMap = { md: { width: 168, imageHeight: 130 }, lg: { width: 220, imageHeight: 155 } };
  const cardSize = sizeMap[size] || sizeMap.md;
  return (
    <div style={{ width: cardSize.width, flexShrink: 0, borderRadius: 14, overflow: 'hidden', background: '#1e2a1e', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ height: cardSize.imageHeight, background: 'linear-gradient(90deg, #161c10 25%, #1e2817 50%, #161c10 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[52, 90, 68, 40].map((w, i) => (
          <div key={i} style={{ height: i === 3 ? 18 : (i === 0 ? 10 : 12), borderRadius: 4, background: 'rgba(255,255,255,0.06)', width: `${w}%`, marginTop: i === 3 ? 6 : 0 }} />
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// CATEGORY META
// ─────────────────────────────────────────────
const CATEGORY_META = {
  minecraft: {
    label: 'Minecraft', color: '#5a9e38',
    desc: 'Java, Bedrock & Wallet top-ups.',
    image: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=640&q=75&fm=webp&auto=format',
    panelBg: '#1a2e12',
    productBg: 'linear-gradient(135deg, #111a0d 0%, #162211 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#5a9e38" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg>,
  },
  steam: {
    label: 'Steam', color: '#66c0f4',
    desc: 'Worldwide Steam cards & wallet top-ups.',
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=640&q=75&fm=webp&auto=format',
    panelBg: '#0c1a26',
    productBg: 'linear-gradient(135deg, #091320 0%, #0f1e30 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#66c0f4" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>,
  },
  discord: {
    label: 'Discord Nitro', color: '#7289da',
    desc: 'Instant Nitro & Nitro Basic top-ups.',
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=640&q=75&fm=webp&auto=format',
    panelBg: '#161b35',
    productBg: 'linear-gradient(135deg, #10152a 0%, #181e3a 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#7289da" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
  chatgpt: {
    label: 'ChatGPT & AI', color: '#10a37f',
    desc: 'OpenAI subscriptions & AI tools.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=75&fm=webp&auto=format',
    panelBg: '#0a1e16',
    productBg: 'linear-gradient(135deg, #071510 0%, #0c1e18 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#10a37f" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
  movies: {
    label: 'Streaming', color: '#e50914',
    desc: 'Netflix, Disney+, Spotify & more.',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=640&q=75&fm=webp&auto=format',
    panelBg: '#250808',
    productBg: 'linear-gradient(135deg, #1c0606 0%, #260808 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#e50914" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  'gift-cards': {
    label: 'Gift Cards', color: '#f5c518',
    desc: 'Apple, Steam, PSN, Xbox and more.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=640&q=75&fm=webp&auto=format',
    panelBg: '#261f08',
    productBg: 'linear-gradient(135deg, #1d1706 0%, #261f08 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#f5c518" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  },
  ebooks: {
    label: 'Digital Books', color: '#ff9800',
    desc: 'eBooks, Audiobooks & Digital PDFs.',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=640&q=75&fm=webp&auto=format',
    panelBg: '#251400',
    productBg: 'linear-gradient(135deg, #1c0f00 0%, #271500 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  games: {
    label: 'Games', color: '#b44fff',
    desc: 'Multi-platform game keys & titles.',
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=640&q=75&fm=webp&auto=format',
    panelBg: '#190a28',
    productBg: 'linear-gradient(135deg, #12071e 0%, #1a0a2c 100%)',
    icon: <svg width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="#b44fff" strokeWidth="1.5" style={{ zIndex: 2, marginBottom: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  },
};

const CATEGORY_ORDER = AREN_CATALOG.map(category => category.id);

// ─────────────────────────────────────────────
// CATEGORY BANNER — memoized
// ─────────────────────────────────────────────
const CategoryBanner = memo(function CategoryBanner({ meta, categoryId }) {
  return (
    <div
      className="brand-panel"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.58)), url(${meta.image}) center/cover no-repeat`,
        backgroundColor: meta.panelBg,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: '50%', background: meta.color, opacity: 0.12, filter: 'blur(55px)', pointerEvents: 'none' }} />
      {meta.icon}
      <h2 style={{ position: 'relative', zIndex: 2 }}>{meta.label}</h2>
      <p style={{ position: 'relative', zIndex: 2 }}>{meta.desc}</p>
      <Link to={`/products?category=${categoryId}`} className="cat-view-all">View All</Link>
    </div>
  );
});

// ─────────────────────────────────────────────
// CATEGORY SECTION — lazy loaded via IntersectionObserver
// ─────────────────────────────────────────────
function CategorySection({ categoryId, fetchFn, sectionIndex = 0 }) {
  const meta = CATEGORY_META[categoryId];
  const sliderRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionRef, inView] = useInView();
  const fetched = useRef(false);

  // Fetch only when section enters viewport
  useEffect(() => {
    if (!inView || fetched.current) return;
    fetched.current = true;
    fetchFn(categoryId)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [inView, categoryId, fetchFn]);

  const updateArrows = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [products, updateArrows]);

  const slide = useCallback((dir) => {
    sliderRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  }, []);

  return (
    <div className="cat-section-wrapper" ref={sectionRef}>
      <div className="cat-section" style={{ background: meta.productBg }}>
        <CategoryBanner meta={meta} categoryId={categoryId} />
        <div className="products-area">
          <button
            className={`scroll-arrow left${canLeft ? '' : ' hidden'}`}
            onClick={() => slide(-1)}
            aria-label="Scroll left"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="products-slider" ref={sliderRef}>
            {loading
              ? [1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} size="lg" />)
              : products.length > 0
                  ? products.map((p, index) => (
                    <div
                      key={p._id}
                      className="hp-product-card"
                      style={{
                        width: 220,
                        minWidth: 220,
                        flexShrink: 0,
                        animationDelay: `${(sectionIndex * 6 + index) * 70}ms`
                      }}
                    >
                      <ProductCard product={p} size="lg" />
                    </div>
                  ))
                : (
                  <div style={{
                    padding: '80px 50px', color: 'rgba(255,255,255,0.3)', fontSize: '15px',
                    textAlign: 'center', fontFamily: 'Outfit, sans-serif',
                    width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  }}>
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke={meta.color} strokeWidth="1.2" opacity="0.4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
                    </svg>
                    لا توجد منتجات متاحة حاليًا.<br />قريبًا...
                  </div>
                )
            }
          </div>

          <button
            className={`scroll-arrow right${canRight ? '' : ' hidden'}`}
            onClick={() => slide(1)}
            aria-label="Scroll right"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
const AnimatedCounter = memo(function AnimatedCounter({ end, duration = 2000, display }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let raf;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      if (typeof end === 'number') setCount(Math.floor(end * progress));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  if (display.includes('K')) return <>{(count / 1000).toFixed(0)}K+</>;
  if (display.includes('%')) return <>{(count / 1000).toFixed(1)}%</>;
  if (display.includes('min')) return <>{'< 1min'}</>;
  return <>{count}</>;
});

const STATS = [
  { value: 50000, display: '50K+', label: 'Happy Customers', icon: FaUsers, color: '#6366F1' },
  { value: 10000, display: '10K+', label: 'منتج متاح', icon: FaBox, color: '#3b82f6' },
  { value: 99900, display: '99.9%', label: 'Uptime', icon: FaBolt, color: '#a855f7' },
  { value: 1, display: '< دقيقة', label: 'متوسط وقت التوصيل', icon: FaRocket, color: '#f97316' },
];

// ─────────────────────────────────────────────
// STATS STRIP
// ─────────────────────────────────────────────
const StatsStrip = memo(function StatsStrip() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        padding: '0 20px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="stats-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className={`stat-card${visible ? ' visible' : ''}`}
              style={{
                animationDelay: `${i * 0.12}s`,
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div style={{
                position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                width: 110, height: 110, borderRadius: '50%',
                background: s.color, opacity: visible ? 0.07 : 0,
                filter: 'blur(32px)', transition: `opacity 0.8s ease ${i * 0.12}s`,
                pointerEvents: 'none',
              }} />
              <div className="stat-dot" style={{ background: s.color + '18', border: `1px solid ${s.color}30` }}>
                {Icon && <Icon size={18} color={s.color} />}
              </div>
              <div className={`stat-value${visible ? ' animate' : ''}`} style={{ color: s.color, animationDelay: `${i * 0.12 + 0.2}s` }}>
                {visible ? <AnimatedCounter end={s.value} duration={2000} display={s.display} /> : '0'}
              </div>
              <div className="stat-label">{s.label}</div>
              <div
                className={`stat-bar${visible ? ' animate' : ''}`}
                style={{
                  background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
                  animationDelay: `${i * 0.12 + 0.3}s`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});


// ─────────────────────────────────────────────
// REAL BRAND ICONS FOR EXPLORE CATEGORIES
// كل أيقونة لون واحد نضيف (currentColor) عشان تتلوّن ديناميك حسب لون البراند
// من متغير CSS --icon-color، بدل الألوان الثابتة اليدوية القديمة.
// ─────────────────────────────────────────────
const CATEGORY_ICON_MAP = {
  'movies-entertainment': FaFilm,   // مستورد بالفعل من react-icons/fa
  'social-daily-apps': SiDiscord,   // Discord الحقيقي
  'design-productivity-ai': SiFigma, // Figma الحقيقي
  'music-audio': SiSpotify,         // Spotify الحقيقي
};

const CATEGORY_BRAND_COLOR = {
  'movies-entertainment': '#ff5a5a',
  'social-daily-apps': '#5865f2',
  'design-productivity-ai': '#a259ff',
  'music-audio': '#1ed760',
};

// FEATURED PRODUCT CARD
// ─────────────────────────────────────────────
function HomeCategoryRail() {
  return (
    <section className="home-category-rail" aria-labelledby="home-categories-title">
      <div className="home-category-heading">
        <div><h2 id="home-categories-title">استكشف التصنيفات</h2><p>تصفح المنتجات الرقمية المميزة حسب احتياجك.</p></div>
        <Link to="/categories">View all →</Link>
      </div>
      <div className="home-category-grid">
        {CATEGORY_ORDER.map((categoryId) => {
          const category = AREN_CATALOG.find(item => item.id === categoryId);
          const Icon = CATEGORY_ICON_MAP[category.id] || FaFilm;
          const color = CATEGORY_BRAND_COLOR[category.id] || '#c9a96a';
          return (
            <Link
              className="home-category-tile"
              to={`/products?catalog=${category.id}`}
              key={category.id}
              style={{ '--icon-color': color }}
            >
              <span className="home-category-icon" aria-hidden="true"><Icon /></span>
              <strong>{category.shortName}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedCard({ product }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const wishlisted = !!user?.wishlist?.some?.(item => item?._id === product._id || item === product._id);
const isOutOfStock = !product.isUnlimited && (
  Number(product.availableStock ?? product.stock ?? 0) <= 0 || product.isOutOfStock

  
);
  const discount = product.discountPercentage ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const imgSrc = product.image
    ? (product.image.startsWith('http') ? product.image : `${process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000'}/${product.image}`)
    : null;

  return (
    <div
      className="popular-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111f12',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${hovered ? 'rgba(34,197,94,0.45)' : 'rgba(34,197,94,0.2)'}`,
        display: 'flex',
        flexDirection: 'column',
        width: 200,
        minWidth: 200,
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.25)',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        style={{ display: 'block', position: 'relative', height: 180, flexShrink: 0, overflow: 'hidden', background: '#0d1f0e' }}
      >
        <img
          src={imgSrc || `https://placehold.co/400x300/0d1f0e/22c55e?text=${encodeURIComponent(product.name?.[0] || '?')}`}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          onError={e => { e.target.src = `https://placehold.co/400x300/0d1f0e/22c55e?text=${encodeURIComponent(product.name?.[0] || '?')}`; }}
        />
        <button
          className={`popular-card-heart${wishlisted ? ' selected' : ''}`}
          type="button"
          disabled={wishlistBusy}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={async e => {
            e.preventDefault(); e.stopPropagation();
            if (!isAuthenticated) return toast.error('سجّل الدخول لاستخدام المفضلة');
            setWishlistBusy(true);
            try {
              const res = await authAPI.toggleWishlist(product._id);
              updateUser({ wishlist: res.data.wishlist });
              toast.success(res.data.inWishlist ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
            } catch (err) {
              toast.error(err.response?.data?.message || 'تعذر تحديث المفضلة');
            } finally { setWishlistBusy(false); }
          }}
        >{wishlisted ? '♥' : '♡'}</button>
        {/*  Featured badge */}
        <div className="popular-featured-badge" style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(10,21,11,0.78)', color: '#f59e0b',
          fontSize: 11, fontWeight: 700,
          padding: '3px 9px', borderRadius: 6,
          border: '1px solid rgba(245,158,11,0.35)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>⭐ Featured</div>

        {discount > 0 && (
          <div className="popular-card-badge" style={{
            position: 'absolute', top: 10, right: 10,
            background: '#ef4444', color: '#fff',
            fontSize: 11, fontWeight: 800,
            padding: '3px 9px', borderRadius: 6,
          }}>-{discount}%</div>
        )}
      </Link>

      {/* Content */}
      <div className="popular-card-body" style={{ padding: '13px 15px 15px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(product.platform || product.category) && (
          <span className="popular-card-platform" style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            color: '#6366F1', background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(34,197,94,0.25)',
            padding: '2px 9px', borderRadius: 5, alignSelf: 'flex-start',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {product.platform || product.category}
          </span>
        )}

        <h3 className="popular-card-title" style={{
          fontSize: 13.5, fontWeight: 700, color: '#f0fdf4',
          lineHeight: 1.4, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          fontFamily: 'Outfit, sans-serif',
        }}>{product.name}</h3>

        <div className="popular-card-duration">{product.duration || product.term || product.shortDescription || 'منتج رقمي'}</div>
        <div className="popular-card-rating"><span>★★★★★</span><small>{Number(product.rating?.average || 4.8).toFixed(1)}{product.rating?.count ? ` (${product.rating.count})` : ''}</small></div>

        <div className="popular-card-footer" style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div className="popular-card-price" style={{ fontSize: 18, fontWeight: 800, color: '#6366F1', fontFamily: 'Outfit, sans-serif' }}>
              {format(product.price)}
            </div>
            {product.originalPrice > product.price && (
              <div className="popular-card-old-price" style={{ fontSize: 11, color: '#4a5e4a', textDecoration: 'line-through' }}>
                {format(product.originalPrice)}
              </div>
            )}
          </div>
          <button
            className="popular-card-add"
            onClick={e => { e.preventDefault(); e.stopPropagation(); addItem(product); }}
            disabled={isOutOfStock}
            style={{
              padding: '8px 16px', borderRadius: 10,
              background: hovered ? '#6366F1' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${hovered ? '#6366F1' : 'rgba(99,102,241,0.3)'}`,
              color: hovered ? '#0B0E17' : '#6366F1',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              opacity: isOutOfStock ? 0.4 : 1,
            }}
          >
            {isOutOfStock ? 'نفد' : 'أضف +'}
          </button>
        </div>
      </div>
    </div>
  );


}

function OfferCard({ product }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const discount = Number(product.discountPercentage || 0);
  const image = product.image ? (product.image.startsWith('http') ? product.image : `${process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000'}/${product.image}`) : '';
  return <Link className="home-offer-banner product-offer" to={`/products/${product._id}`} style={{ backgroundImage: image ? `url("${image}")` : undefined }}>
    <div className="home-offer-copy"><span className="home-offer-badge">{product.promotion?.name || 'عرض خاص'}</span><h3>{product.name}</h3><p>{product.shortDescription || 'عرض لفترة محدودة على هذا المنتج.'}</p><div className="home-offer-price">{format(product.price || 0)} {product.originalPrice > product.price && <del>{format(product.originalPrice)}</del>}</div><button type="button" className="home-offer-action" aria-label={`إضافة ${product.name} إلى السلة`} onClick={e => { e.preventDefault(); e.stopPropagation(); addItem(product); }}><FaShoppingBasket /></button>{discount > 0 && <span className="home-offer-badge" style={{ marginLeft: 6 }}>-{discount}%</span>}</div>
  </Link>;
}

// ─────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────
export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [featLoading, setFeatLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const popularSliderRef = useRef(null);

  const scrollPopular = (direction) => {
    popularSliderRef.current?.scrollBy({ left: direction * 288, behavior: 'smooth' });
  };

  // Inject global styles once on mount
  useEffect(() => { injectGlobalStyles(); }, []);

  // Fetch featured products
  useEffect(() => {
    productAPI.getAll({ featured: true, limit: 10 })
      .then(res => setFeatured(res.data?.products || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeatLoading(false));
  }, []);

  useEffect(() => {
    productAPI.getAll({ onSale: true, limit: 12, sort: 'popular' })
      .then(res => setOffers(res.data?.products || []))
      .catch(() => setOffers([]));
  }, []);

  return (
    <div className="hp-wrapper page-enter">

      {/* ── Hero / Promo Slider ── */}
      <section className="hp-section">
        <div className="hero-grid">
          <PromoSlider />
        </div>
      </section>

      

      {/* ── Most Popular: shown only when the admin has selected products ── */}
      {(featLoading || featured.length > 0) && <section className="featured-section popular-section">
        <div className="section-header">
          <div className="section-title-row">
            <div className="section-accent-bar" style={{ background: 'linear-gradient(180deg, #caa5ff, #7440b5)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: 'rgba(146,91,214,.12)', border: '1px solid rgba(190,145,255,.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                flexShrink: 0,
              }}>⭐</div>
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#e8f0e0' }}>الأكثر شعبية</div>
                <div style={{ fontSize: 'clamp(11px,1.5vw,13.5px)', color: '#caa5ff', fontFamily: 'Outfit, sans-serif', marginTop: 2 }}>اختيارات العملاء</div>
              </div>
            </div>
          </div>
          <Link
            to="/products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: '#f97316', textDecoration: 'none', fontFamily: 'Outfit, sans-serif', border: '1px solid #f9731630', padding: '9px 18px', borderRadius: 10, background: '#f9731608', transition: 'all .25s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9731620'; e.currentTarget.style.borderColor = '#f9731660'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f9731608'; e.currentTarget.style.borderColor = '#f9731630'; }}
          >
            عرض الكل
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="popular-slider-shell" style={{ padding: '0 20px' }}>
          <button className="popular-slider-arrow left" type="button" aria-label="Previous popular products" onClick={() => scrollPopular(-1)}>‹</button>
          <div className="featured-scroll" ref={popularSliderRef}>
            {featLoading
              ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              : featured.map((p, index) => (
                  <div
                    key={p._id}
                    className="hp-product-card"
                    style={{ flexShrink: 0, animationDelay: `${index * 80}ms` }}
                  >
                    <FeaturedCard product={p} />
                  </div>
                ))
            }
          </div>
          <button className="popular-slider-arrow right" type="button" aria-label="Next popular products" onClick={() => scrollPopular(1)}>›</button>
        </div>
      </section>}

      <HomeCategoryRail />

      {offers.length > 0 && <section className="featured-section popular-section home-offers-section">
        <div className="section-header"><div className="section-title-row"><div className="section-accent-bar" style={{ background: 'linear-gradient(180deg,#ff6b6b,#b91c1c)' }} /><div><div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff1f1' }}>عروض خاصة</div><div style={{ fontSize: 12, color: '#ff9b9b', marginTop: 2 }}>عروض لفترة محدودة</div></div></div><Link to="/offers" style={{ color: '#ff9b9b', textDecoration: 'none', fontWeight: 700 }}>عرض الكل ←</Link></div>
        {offers.length ? <><div className="home-offer-banners">{offers.slice(0, 4).map(product => <OfferCard product={product} key={product._id} />)}</div><div className="home-offer-trust"><div className="home-offer-trust-item"><FaClock /> Delivery within 24 hours</div><div className="home-offer-trust-item"><FaCheckCircle /> Verified &amp; safe offers</div><div className="home-offer-trust-item"><FaTags /> Best prices on selected products</div></div></> : <div className="aren-offers-empty">No active special offers right now. Check back soon for new promotions.</div>}
      </section>}
    </div>
  );
}
