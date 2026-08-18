// Customer-facing catalog taxonomy. Backend category values remain unchanged
// until a backward-compatible data migration is explicitly approved.
export const AREN_CATALOG = [
  {
    id: 'movies-entertainment',
    name: 'اشتراكات الأفلام والترفيه الرقمي',
    shortName: 'الأفلام والترفيه',
    description: 'اشتراكات مميزة للبث والترفيه الرقمي.',
    apiCategory: 'movies',
    products: ['Netflix Premium', 'Shahid VIP', 'Disney+ Premium', 'Amazon Prime Video', 'OSN+ Subscription', 'TOD Subscription', 'Apple TV+', 'Hulu Premium'],
  },
  {
    id: 'social-daily-apps',
    name: 'اشتراكات التواصل والتطبيقات اليومية',
    shortName: 'التواصل والتطبيقات',
    description: 'اشتراكات لمنصات التواصل والتطبيقات اليومية.',
    apiCategory: 'discord',
    products: ['Snapchat Plus Code', 'YouTube Premium', 'Discord Nitro', 'Telegram Premium', 'X Premium', 'Coins'],
  },
  {
    id: 'design-productivity-ai',
    name: 'Design, Productivity & AI Subscriptions',
    shortName: 'Design, Productivity & AI',
    description: 'Tools for creative work, productivity, storage, and AI.',
    apiCategory: 'chatgpt',
    products: ['Canva Pro', 'ChatGPT Plus', 'Microsoft 365 Personal', 'Google One Storage', 'iCloud+ Storage', 'Adobe Creative Cloud'],
  },
  {
    id: 'music-audio',
    name: 'Music & Audio Subscriptions',
    shortName: 'Music & Audio',
    description: 'Music, podcasts, audiobooks, and premium audio access.',
    apiCategory: 'music-audio',
    products: ['Spotify Premium', 'Apple Music', 'Anghami Plus', 'Audible Premium'],
  },
];

export const AREN_CATALOG_BY_ID = Object.fromEntries(AREN_CATALOG.map(category => [category.id, category]));
const AREN_CATEGORY_ID_BY_PRODUCT_CATEGORY = {
  movies: 'movies-entertainment',
  discord: 'social-daily-apps',
  'social-daily-apps': 'social-daily-apps',
  chatgpt: 'design-productivity-ai',
  'design-productivity-ai': 'design-productivity-ai',
  'music-audio': 'music-audio'
};

const normalized = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function getArenCatalogCategory(product) {
  const storedCategoryId = AREN_CATEGORY_ID_BY_PRODUCT_CATEGORY[product?.category];
  if (storedCategoryId) return AREN_CATALOG_BY_ID[storedCategoryId];

  const haystack = normalized([product?.name, product?.platform, ...(product?.tags || [])].join(' '));
  const matched = AREN_CATALOG.find(category => category.products.some(name => {
    const terms = normalized(name).split(' ').filter(term => term.length > 2);
    return terms.length > 0 && terms.every(term => haystack.includes(term));
  }));
  if (matched) return matched;

  // Safe legacy-category fallback for existing records whose product name is
  // close to a requested catalog item but not an exact client product name.
  return ({
    movies: AREN_CATALOG_BY_ID['movies-entertainment'],
    discord: AREN_CATALOG_BY_ID['social-daily-apps'],
    chatgpt: AREN_CATALOG_BY_ID['design-productivity-ai'],
  })[product?.category] || null;
}
