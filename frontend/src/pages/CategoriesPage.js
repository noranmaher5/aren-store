import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { AREN_CATALOG } from '../config/arenCatalog';

export default function CategoriesPage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    productAPI.getCategoryStats()
      .then(res => {
        const stats = res.data?.categories || res.data?.stats || {};
        setCounts(Array.isArray(stats)
          ? Object.fromEntries(stats.map(item => [item._id, item]))
          : stats);
      })
      .catch(() => setCounts({}))
      .finally(() => setLoading(false));
  }, []);

  const icons = { 'movies-entertainment': '▤', 'social-daily-apps': '◌', 'design-productivity-ai': '◉', 'music-audio': '♫' };
  const categoryCountKeys = {
    'movies-entertainment': ['movies'],
    'social-daily-apps': ['discord', 'social-daily-apps'],
    'design-productivity-ai': ['chatgpt', 'design-productivity-ai'],
    'music-audio': ['music-audio']
  };

  return (
    <div className="aren-page aren-info-page aren-categories-page">
      <div className="aren-page-intro aren-categories-intro">
        <span className="aren-eyebrow">Browse the store</span>
        <h1>استكشف التصنيفات</h1>
        <p>Find the right digital product for every need, from entertainment and AI tools to gaming, design, productivity, and gift cards.</p>
      </div>
      <div className="aren-category-grid">
        {AREN_CATALOG.map((category, index) => {
          const count = (categoryCountKeys[category.id] || [category.apiCategory])
            .reduce((sum, key) => sum + Number(counts[key]?.count ?? counts[key] ?? 0), 0);
          return (
            <Link className="aren-category-tile" to={`/products?catalog=${category.id}`} key={category.id} style={{ '--category-order': index }}>
              <span className="aren-category-icon" aria-hidden="true">{icons[category.id] || '✦'}</span>
              <strong>{category.name}</strong>
              <small>{loading ? 'جارٍ تحميل المنتجات…' : category.id === 'music-audio' ? 'استكشف المنتجات المتاحة' : `${count ?? 'استكشف'} منتجات`}</small>
              <p>{category.description}</p>
              <span className="aren-arrow" aria-hidden="true">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
