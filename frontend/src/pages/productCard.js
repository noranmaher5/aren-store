import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_BACKEND_ORIGIN ||
  process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('blob')) return img;
  return `${API_ORIGIN}${img}`;
};

const CATEGORY_COLORS = {
  minecraft:    { color: '#5a9e38', bg: '#5a9e38' },

  steam:        { color: '#66c0f4', bg: '#0e1a2b' },
  discord:      { color: '#7289da', bg: '#10122a' },
  chatgpt:      { color: '#10a37f', bg: '#081a16' },
  movies:       { color: '#e50914', bg: '#e50914' },
  'gift-cards': { color: '#f5c518', bg: '#1f1900' },
  ebooks:       { color: '#ff9800', bg: '#1f1100' },
  games:        { color: '#b44fff', bg: '#170d24' },
  general:      { color: '#94a3b8', bg: '#111418' },
};

const CAT_EMOJI = {
  minecraft: '🧱', steam: '🎮', discord: '💬', chatgpt: '🤖',
  movies: '🎬', 'gift-cards': '🎁', ebooks: '📚', games: '🕹️', general: '📦',
};

function StarIcon({ filled }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24"
      fill={filled ? '#f5c518' : 'none'}
      stroke={filled ? '#f5c518' : '#374151'} strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    _id, name, slug, image, category,
    platform, price, originalPrice,
    discountPercentage, rating = {}, stock, isFeatured, isUnlimited
  } = product;

  const cat = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  const hasDiscount = discountPercentage > 0;
  const outOfStock = stock === 0 && !isUnlimited;
  const link = `/products/${slug || _id}`;

  return (
    <Link
      to={link}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#1f2a1a !important',           // اللون الداكن الجديد
        border: `1px solid ${hovered ? cat.color + '66' : '#2a3524'}`,
        boxShadow: hovered 
          ? '0 12px 32px rgba(0,0,0,0.55)' 
          : '0 4px 12px rgba(0,0,0,0.35)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all .25s cubic-bezier(0.34, 1.3, 0.64, 1)',
        position: 'relative',
        cursor: 'pointer',
        height: '100%',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '66%',
        overflow: 'hidden',
        background: cat.bg,
        flexShrink: 0,
      }}>
        {image && !imgError ? (
          <img 
            src={getImageUrl(image)} 
            alt={name} 
            onError={() => setImgError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform .4s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(145deg, ${cat.bg}, #0d1008)`,
          }}>
            <span style={{ fontSize: 48, opacity: 0.6 }}>
              {CAT_EMOJI[category] || '📦'}
            </span>
          </div>
        )}

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
        }} />

        {/* Discount */}
        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#16a34a', color: '#fff',
            fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
            padding: '3px 9px', borderRadius: 6, zIndex: 2,
          }}>
            -{discountPercentage}%
          </div>
        )}

        {/* Featured */}
        {isFeatured && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: `${cat.color}22`, border: `1px solid ${cat.color}60`,
            color: cat.color, fontSize: 9, fontWeight: 700,
            fontFamily: 'Rajdhani, sans-serif', padding: '3px 9px',
            borderRadius: 6, zIndex: 2,
          }}>
            Featured
          </div>
        )}

        {/* Out of Stock */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 800,
              color: '#9ca3af', letterSpacing: '.12em', textTransform: 'uppercase',
              border: '1px solid #4b5563', padding: '6px 18px', borderRadius: 8,
              background: 'rgba(0,0,0,0.6)',
            }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Platform */}
        {platform && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, zIndex: 2,
            fontSize: 9.5, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
            color: '#e2e8f0', background: 'rgba(0,0,0,0.65)',
            padding: '2px 8px', borderRadius: 5,
          }}>
            {platform}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '14px 15px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontSize: 9.5, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '.12em', textTransform: 'uppercase', color: cat.color,
        }}>
          {category?.replace('-', ' ') || 'General'}
        </div>

        <div style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 14.5, fontWeight: 700,
          color: hovered ? '#f1f5e9' : '#d4e0c8', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: 42,
        }}>
          {name}
        </div>

        {rating.count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(rating.average || 0)} />)}
            <span style={{ fontSize: 10.5, color: '#6b7280', marginLeft: 4 }}>
              ({rating.count})
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 19, fontWeight: 800,
              color: outOfStock ? '#6b7280' : '#6366F1',
            }}>
              ${price?.toFixed(2)}
            </span>
            {hasDiscount && originalPrice > price && (
              <span style={{ fontSize: 12, color: '#6b7280', textDecoration: 'line-through' }}>
                ${originalPrice?.toFixed(2)}
              </span>
            )}
          </div>

          {!outOfStock && (
            <button
              onClick={(e) => e.preventDefault()}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: hovered ? cat.color : `${cat.color}22`,
                border: `1px solid ${cat.color}55`,
                color: hovered ? '#fff' : cat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all .2s ease',
              }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hover Line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: hovered ? '100%' : '0%',
        height: 3,
        background: `linear-gradient(to right, ${cat.color}, transparent)`,
        transition: 'width .35s ease',
      }} />
    </Link>
  );
}