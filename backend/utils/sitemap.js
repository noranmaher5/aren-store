const Product = require('../models/Product');

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toIsoDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

exports.getSitemap = async (req, res, next) => {
  try {
    const site = (process.env.FRONTEND_URL || 'https://zertexkey-2orq.vercel.app').replace(/\/$/, '');
    const staticPages = [
      { loc: `${site}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${site}/products`, changefreq: 'daily', priority: '0.9' },
      { loc: `${site}/offers`, changefreq: 'daily', priority: '0.8' },
      { loc: `${site}/terms`, changefreq: 'yearly', priority: '0.3' },
      { loc: `${site}/privacy`, changefreq: 'yearly', priority: '0.3' },
    ];

    const products = await Product.find({ isActive: true })
      .select('_id updatedAt')
      .lean();

    const urls = [
      ...staticPages.map((page) => `
  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`),
      ...products.map((product) => `
  <url>
    <loc>${escapeXml(`${site}/products/${product._id}`)}</loc>
    <lastmod>${toIsoDate(product.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ].join('');

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`);
  } catch (err) {
    next(err);
  }
};
