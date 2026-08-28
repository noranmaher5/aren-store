import { useEffect } from 'react';

export const SITE_NAME = 'Aren Store';
export const DEFAULT_DESCRIPTION =
  'متجر Aren — سوق رقمي للبطاقات والألعاب والاشتراكات مع توصيل فوري.';

export function getSiteUrl() {
  const fromEnv = process.env.REACT_APP_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://zertexkey-2orq.vercel.app';
}

function upsertMeta(attr, key, content) {
  if (content == null || content === '') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', String(content));
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  noindex = false,
  type = 'website',
  jsonLd,
}) {
  const jsonLdSerialized = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const site = getSiteUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${site}${normalizedPath}`;
    const fullTitle = title?.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const ogImage = image || `${site}/og-image.png`;

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    );
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:locale', 'ar_AR');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);
    upsertLink('canonical', noindex ? '' : url);
    upsertJsonLd('seo-jsonld', jsonLdSerialized ? JSON.parse(jsonLdSerialized) : null);

    return () => {
      upsertJsonLd('seo-jsonld', null);
    };
  }, [title, description, path, image, noindex, type, jsonLdSerialized]);

  return null;
}
