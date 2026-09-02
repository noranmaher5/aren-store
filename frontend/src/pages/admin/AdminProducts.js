import React, { useState, useEffect } from 'react';
import { productAPI, supplierAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import { AREN_CATALOG, getArenCatalogCategory } from '../../config/arenCatalog';

const CATEGORIES = AREN_CATALOG.map(category => ({ value: category.apiCategory, label: category.name }));
const ADMIN_CATEGORY_LABELS = {
  'movies-entertainment': 'اشتراكات الأفلام والترفيه الرقمي',
  'social-daily-apps': 'اشتراكات السوشيال ميديا والتطبيقات اليومية',
  'design-productivity-ai': 'اشتراكات التصميم، الإنتاجية والذكاء الاصطناعي',
  'music-audio': 'اشتراكات الموسيقى والصوتيات'
};
const ADMIN_CATEGORY_BY_VALUE = {
  movies: 'movies-entertainment',
  discord: 'social-daily-apps',
  'social-daily-apps': 'social-daily-apps',
  chatgpt: 'design-productivity-ai',
  'design-productivity-ai': 'design-productivity-ai',
  'music-audio': 'music-audio'
};
const FAZERCARDS_CATALOG_TYPES = [
  { value: 'giftcards', label: 'Gift Cards' },
  { value: 'gamekeys', label: 'Game Keys' },
  { value: 'topups', label: 'Top-ups' },
  { value: 'manual', label: 'Manual Services' }
];

const getAdminCategoryLabel = (product) => {
  const storedCategoryId = ADMIN_CATEGORY_BY_VALUE[product.category];
  const category = getArenCatalogCategory(product);
  const categoryId = storedCategoryId || category?.id;
  return ADMIN_CATEGORY_LABELS[categoryId] || category?.name || product.category;
};

const getSupplierLabel = (supplier) => ({
  foxreload: 'FoxReload',
  fazercards: 'FazerCards'
}[supplier] || supplier || '—');

const getSupplierQuantity = (product) => {
  const value = product?.supplierAvailability?.quantity;
  if (value === null || value === undefined || value === '') return null;
  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : null;
};

const getCatalogAvailability = (item) => {
  const quantity = item?.stock;
  if (quantity === null || quantity === undefined || quantity === '') return 'UNKNOWN';
  const value = Number(quantity);
  if (!Number.isFinite(value)) return 'UNKNOWN';
  return value > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
};

const EMPTY_FORM = { 
  name: '', 
  description: '', 
  shortDescription: '', 
  category: 'general', 
  platform: '', 
  region: 'Global', 
  price: '', 
  originalPrice: '', 
  optionsText: '',
  promotion: { active: false, name: '', type: 'percentage', value: '', startsAt: '', endsAt: '' },
  stock: 0,
  image: null, 
  tags: '', 
  isFeatured: false, 
  isUnlimited: false, 
  isQuoteOnly: false,
  availabilityType: 'in_stock',
  deliveryType: 'instant',
  manualRequest: { enabled: false, expectedDeliveryNote: '', leadTimeDays: 0 },
  isActive: true,
  reviews: []
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [importedFilter, setImportedFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); 
  const [supplierName, setSupplierName] = useState('foxreload');
  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [supplierSearching, setSupplierSearching] = useState(false);
  const [catalogType, setCatalogType] = useState('giftcards');
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogCategoryId, setCatalogCategoryId] = useState('');
  const [catalogNextCursor, setCatalogNextCursor] = useState('');
  const [catalogOffersNextCursor, setCatalogOffersNextCursor] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { 
    loadProducts(); 
  }, [page, activeTab]);

  useEffect(() => {
    if (supplierName !== 'fazercards') {
      setCatalogCategories([]);
      setCatalogCategoryId('');
      setSupplierResults([]);
      setCatalogOffersNextCursor('');
      return;
    }
    loadCatalogCategories(true);
  }, [supplierName, catalogType]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAdminAll({ 
        page, 
        limit: 10, 
        activeTab: activeTab 
      });

      const safeProductsResponse = {
        ...res.data,
        products: res.data?.products?.map(({ supplierCost, supplierMetadata, ...product }) => product)
      };
      console.log('[AdminProducts] PRODUCTS RESPONSE', safeProductsResponse);
      console.log('[AdminProducts] PRODUCT COUNT', res.data?.products?.length);
      
      if (res.data && res.data.products) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[AdminProducts] supplier availability response', res.data.products
            .filter(product => product.supplier)
            .map(product => ({
              name: product.name,
              supplier: product.supplier,
              supplierAvailability: product.supplierAvailability,
              supplierAvailabilityQuantity: product.supplierAvailabilityQuantity
            })));
        }
        // Keep the admin-only supplier cost for the inventory display, while
        // excluding private supplier metadata from the React state.
        setProducts(res.data.products.map(({ supplierMetadata, ...product }) => product));
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Admin products request failed', {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        url: err.config?.url
      });
      toast.error('تعذر تحميل المنتجات'); 
    } finally { 
      setLoading(false); 
    }
  };

  const openCreate = () => { 
    setForm(EMPTY_FORM); 
    setEditing(null); 
    setModal(true); 
  };
  
  const openEdit = (p) => {
    setForm({ 
      ...p, 
      tags: p.tags?.join(', ') || '', 
      price: p.price.toString(), 
      originalPrice: (p.originalPrice || '').toString(),
      optionsText: (p.options || []).map(option => `${option.name}|${option.price}|${option.description || ''}`).join('\n'),
      promotion: { active: !!p.promotion?.active, name: p.promotion?.name || '', type: p.promotion?.type || 'percentage', value: p.promotion?.value?.toString() || '', startsAt: p.promotion?.startsAt ? p.promotion.startsAt.slice(0, 10) : '', endsAt: p.promotion?.endsAt ? p.promotion.endsAt.slice(0, 10) : '' },
      stock: p.stock || 0,
      isQuoteOnly: p.isQuoteOnly === true,
      availabilityType: p.availabilityType || (p.manualRequest?.enabled ? 'on_demand' : 'in_stock'),
      deliveryType: p.deliveryType || (p.manualRequest?.enabled ? 'manual' : 'instant'),
      manualRequest: p.manualRequest || { enabled: false, expectedDeliveryNote: '', leadTimeDays: 0 },
      image: null,
      reviews: p.reviews || []
    });
    setEditing(p._id);
    setModal(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await productAPI.deleteReview(editing, reviewId);
      toast.success('تم حذف التعليق');
      
      setForm(f => ({
        ...f,
        reviews: f.reviews.filter(r => r._id !== reviewId)
      }));
      
      loadProducts(); 
    } catch (err) {
      toast.error('تعذر حذف التعليق');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        // Supplier-controlled fields are read-only in the product editor.
        // Sending supplierAvailability through FormData can overwrite the
        // nested availability object when an admin only edits the price.
        if (['supplier', 'supplierProductId', 'supplierCost', 'supplierMetadata', 'supplierAvailability', 'options'].includes(key)) return;
        if (key === 'tags') {
          const tagsArray = form.tags && typeof form.tags === 'string' 
            ? form.tags.split(',').map(t => t.trim()).filter(Boolean) 
            : [];
          formData.append('tags', JSON.stringify(tagsArray));
        } else if (key === 'image') {
          if (form.image) formData.append('image', form.image);
        } else if (key === 'promotion') {
          formData.append('promotion', JSON.stringify(form.promotion));
        } else if (key === 'manualRequest') {
          formData.append('manualRequest', JSON.stringify(form.manualRequest));
        } else if (key === 'optionsText') {
          const options = String(form.optionsText || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
            const [name, price, ...description] = line.split('|');
            return { name: name.trim(), price: Number(price), originalPrice: Number(price), description: description.join('|').trim(), isActive: true };
          }).filter(option => option.name && Number.isFinite(option.price));
          formData.append('options', JSON.stringify(options));
        } else if (key === 'reviews') {
          return; 
        } else {
          formData.append(key, form[key]);
        }
      });

      if (editing) {
        await productAPI.update(editing, formData);
        toast.success('تم تحديث المنتج');
      } else {
        await productAPI.create(formData);
        toast.success('تم إنشاء المنتج');
      }
      setModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const id = product._id;
    const currentStatus = product.isActive;
    if (!currentStatus && product.supplier && product.supplier !== 'manual') {
      const quantity = getSupplierQuantity(product);
      if (!(Number(product.price) > 0)) {
        toast.error('حدد سعر بيع أكبر من صفر قبل نشر منتج المورد');
        return;
      }
      if (!(quantity > 0)) {
        toast.error(quantity === null ? 'توفر منتج المورد غير معروف' : 'منتج المورد نفد من المخزون');
        return;
      }
    }
    try {
      await productAPI.update(id, { isActive: !currentStatus });
      toast.success(currentStatus ? 'تم إخفاء المنتج' : 'تم نشر المنتج');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشلت العملية');
    }
  };

  const searchSupplier = async (e) => {
    e.preventDefault();
    if (!supplierQuery.trim()) return;
    setSupplierSearching(true);
    try {
      const res = await supplierAPI.search(supplierName, { query: supplierQuery.trim(), limit: 20 });
      setSupplierResults(res.data?.normalized || []);
    } catch (err) {
      setSupplierResults([]);
      toast.error(err.response?.data?.message || 'فشل البحث لدى المورد');
    } finally { setSupplierSearching(false); }
  };

  const loadCatalogCategories = async (reset = false) => {
    setCatalogLoading(true);
    if (reset) {
      setSupplierResults([]);
      setCatalogCategoryId('');
      setCatalogNextCursor('');
      setCatalogOffersNextCursor('');
    }
    try {
      const params = { limit: 100 };
      if (!reset && catalogNextCursor) params.cursor = catalogNextCursor;
      const res = await supplierAPI.catalogCategories(supplierName, catalogType, params);
      const items = res.data?.data?.items || [];
      setCatalogCategories(current => reset ? items : [...current, ...items]);
      setCatalogNextCursor(res.data?.data?.meta?.next_cursor || '');
    } catch (err) {
      setCatalogCategories([]);
      toast.error(err.response?.data?.message || 'فشل تحميل تصنيفات FazerCards');
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadCatalogOffers = async () => {
    if (!catalogCategoryId) return;
    setCatalogLoading(true);
    try {
      const params = { limit: 100 };
      if (catalogOffersNextCursor) params.cursor = catalogOffersNextCursor;
      const res = await supplierAPI.catalogOffers(supplierName, catalogType, catalogCategoryId, params);
      setSupplierResults(current => catalogOffersNextCursor ? [...current, ...(res.data?.normalized || [])] : (res.data?.normalized || []));
      setCatalogOffersNextCursor(res.data?.data?.meta?.next_cursor || '');
    } catch (err) {
      setSupplierResults([]);
      toast.error(err.response?.data?.message || 'فشل تحميل عروض FazerCards');
    } finally {
      setCatalogLoading(false);
    }
  };

  const importSupplierProduct = async (item) => {
    const category = window.prompt(`Select an Aren category (${AREN_CATALOG.map(c => c.apiCategory).join(', ')})`);
    if (!category) return;
    if (!AREN_CATALOG.some(c => c.apiCategory === category)) {
      toast.error('يرجى اختيار تصنيف صحيح للمتجر');
      return;
    }
    const confirmed = window.confirm([
      `Product: ${item.name || 'Not provided'}`,
      `Supplier: ${getSupplierLabel(supplierName)}`,
      `Supplier Product ID: ${item.supplierProductId || 'Not provided'}`,
      `Supplier Cost: ${item.supplierCost ?? 'Not provided'} ${item.currency || 'USD'}`,
      `Stock: ${item.stock ?? 'Not provided'}`,
      `Product Type: ${item.productType || 'Not provided'}`,
      `Variant: ${item.variant ?? 'Not provided'}`,
      `Aren Category: ${category}`,
      'Selling Price: 0',
      'غير منشور',
      '',
      'Import this offer?'
    ].join('\n'));
    if (!confirmed) return;
    try {
      await supplierAPI.import(supplierName, item.supplierProductId, { price: 0, category, name: item.name, description: item.description, image: item.image, currency: item.currency, supplierMetadata: item.metadata });
      toast.success('تم استيراد منتج المورد');
      loadProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'فشل الاستيراد'); }
  };

  const importSelectedSupplierProducts = async () => {
    const selected = supplierResults.filter(item => selectedSupplierIds.includes(item.supplierProductId));
    if (!selected.length) return;
    const prepared = [];
    for (const item of selected) {
      const category = window.prompt(`Aren category for ${item.name || item.supplierProductId} (${AREN_CATALOG.map(c => c.apiCategory).join(', ')})`);
      if (!category || !AREN_CATALOG.some(c => c.apiCategory === category)) {
        toast.error(`Skipped ${item.name || item.supplierProductId}: valid Aren category required`);
        continue;
      }
      prepared.push({ item, category });
    }
    if (!prepared.length) return;
    const confirmed = window.confirm(`Import ${prepared.length} selected supplier product(s) with selling price 0 and Published = No?\n\n${prepared.map(({ item, category }) => `${item.name} → ${item.supplierProductId} → ${category}`).join('\n')}`);
    if (!confirmed) return;
    const results = [];
    for (const { item, category } of prepared) {
      try {
        const response = await supplierAPI.import(supplierName, item.supplierProductId, { price: 0, category, name: item.name, description: item.description, image: item.image, currency: item.currency, supplierMetadata: item.metadata });
        results.push(response.data?.created ? 'created' : 'updated');
      } catch (err) {
        results.push(`failed: ${err.response?.data?.message || 'validation failed'}`);
      }
    }
    setSelectedSupplierIds([]);
    toast.success(`Import complete: ${results.filter(r => r === 'created').length} created, ${results.filter(r => r === 'updated').length} updated, ${results.filter(r => r.startsWith('failed')).length} failed`);
    loadProducts();
  };

  const handleTogglePopular = async (product) => {
    try {
      await productAPI.update(product._id, { isFeatured: !product.isFeatured });
      toast.success(product.isFeatured ? 'تمت إزالة المنتج من الأكثر شعبية' : 'تمت إضافة المنتج إلى الأكثر شعبية');
      loadProducts();
    } catch {
      toast.error('تعذر تحديث حالة الأكثر شعبية');
    }
  };

  const filtered = products.filter(p => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [p.name, p.supplierProductId, p.region, p.countryCode, p.duration, p.variant]
      .filter(Boolean).some(value => String(value).toLowerCase().includes(query));
    const matchesSupplier = supplierFilter === 'all' || (p.supplier || 'manual') === supplierFilter;
    const quantity = getSupplierQuantity(p);
    const availability = p.supplier && p.supplier !== 'manual'
      ? quantity === null ? 'unknown' : quantity > 0 ? 'available' : 'out_of_stock'
      : p.isUnlimited || Number(p.stock || 0) > 0 ? 'available' : 'out_of_stock';
    const matchesAvailability = availabilityFilter === 'all' || availability === availabilityFilter;
    const matchesImported = importedFilter === 'all' || (importedFilter === 'imported' ? !!p.supplierProductId : !p.supplierProductId);
    const matchesPublished = publishedFilter === 'all' || (publishedFilter === 'live' ? p.isActive : !p.isActive);
    return matchesSearch && matchesSupplier && matchesAvailability && matchesImported && matchesPublished;
  });

  const visibleSupplierResults = supplierResults.filter(item => !supplierQuery.trim() || item.name?.toLowerCase().includes(supplierQuery.trim().toLowerCase()));
  const selectAllVisibleSupplierResults = () => setSelectedSupplierIds(current => [...new Set([...current, ...visibleSupplierResults.map(item => item.supplierProductId)])]);
  const clearSupplierSelection = () => setSelectedSupplierIds([]);
  const selectedProducts = products.filter(product => selectedProductIds.includes(product._id));
  const supplierSelectedProducts = selectedProducts.filter(product => ['foxreload', 'fazercards'].includes(product.supplier));
  const getSupplierManagementState = product => {
    if (product.isActive) return 'منشور';
    const quantity = getSupplierQuantity(product);
    if (quantity === null) return 'التوفر غير معروف';
    if (quantity <= 0) return 'نفد المخزون';
    if (!(Number(product.price) > 0)) return 'السعر غير مضاف';
    if (!product.category || !product.supplierProductId) return 'مسودة';
    return 'جاهز للنشر';
  };

  const handleBulkPrice = async () => {
    if (!supplierSelectedProducts.length) return;
    const priceInput = window.prompt('أدخل سعر البيع الجديد للمنتجات المحددة');
    if (priceInput === null) return;
    const price = Number(priceInput);
    if (!Number.isFinite(price) || price < 0) { toast.error('يجب أن يكون سعر البيع رقمًا صحيحًا أكبر من أو يساوي 0'); return; }
    const confirmed = window.confirm(`${supplierSelectedProducts.length} selected\n\n${supplierSelectedProducts.map(product => `${product.name}: $${product.price} → $${price}`).join('\n')}\n\nApply this selling price?`);
    if (!confirmed) return;
    const results = [];
    for (const product of supplierSelectedProducts) {
      try { await productAPI.update(product._id, { price }); results.push('updated'); }
      catch (err) { results.push(`failed: ${err.response?.data?.message || 'update failed'}`); }
    }
    setSelectedProductIds([]);
    toast.success(`Bulk pricing complete: ${results.filter(result => result === 'updated').length} updated, ${results.filter(result => result.startsWith('failed')).length} failed`);
    loadProducts();
  };

  const handleBulkPublish = async () => {
    if (!supplierSelectedProducts.length) return;
    const ready = supplierSelectedProducts.filter(product => !product.isActive && getSupplierQuantity(product) > 0 && Number(product.price) > 0 && product.category && product.supplierProductId);
    const invalid = supplierSelectedProducts.filter(product => !ready.includes(product));
    if (!ready.length) { toast.error('لا توجد منتجات مورد محددة جاهزة للنشر'); return; }
    const confirmed = window.confirm(`تم تحديد ${supplierSelectedProducts.length}\n${ready.length} جاهز للنشر\n${invalid.length} محظور\n\nنشر المنتجات الصالحة وعددها ${ready.length}؟`);
    if (!confirmed) return;
    const results = [];
    for (const product of ready) {
      try { await productAPI.update(product._id, { isActive: true }); results.push('published'); }
      catch (err) { results.push(`failed: ${err.response?.data?.message || 'publish failed'}`); }
    }
    setSelectedProductIds([]);
    toast.success(`Bulk publishing complete: ${results.filter(result => result === 'published').length} published, ${results.filter(result => result.startsWith('failed')).length} failed, ${invalid.length} blocked before request`);
    loadProducts();
  };

  return (
    <div className="admin-products-page pt-24 pb-16 min-h-screen bg-[#080808] text-zinc-200 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">إدارة المنتجات</h1>
            <p className="text-zinc-500 text-sm mt-1">نظّم مخزون متجرك وإمكانية ظهوره للعملاء</p>
          </div>
          <button onClick={openCreate} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all">
            + إضافة منتج جديد
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-4 mb-8 p-1 bg-zinc-900/50 w-fit max-w-full rounded-2xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('live'); setPage(1); }}
            className={`px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
          المنتجات المنشورة
          </button>
          <button 
            onClick={() => { setActiveTab('hidden'); setPage(1); }}
            className={`px-3 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'hidden' ? 'bg-rose-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            المنتجات المخفية
          </button>
        </div>

        <div className="mb-8 p-6 rounded-[2rem] border border-purple-400/20 bg-purple-500/[0.04]">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div><h2 className="text-lg font-bold text-white">كتالوج الموردين</h2><p className="text-xs text-zinc-500 mt-1">تصفّح تصنيفات الموردين واختر العرض المطلوب بوضوح قبل استيراده.</p></div>
            <div className="flex gap-2 rounded-xl bg-zinc-900/70 border border-white/10 p-1">
              {['foxreload', 'fazercards'].map(supplier => <button key={supplier} type="button" onClick={() => { setSupplierName(supplier); setSupplierResults([]); setSelectedSupplierIds([]); setSupplierQuery(''); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${supplierName === supplier ? 'bg-purple-400 text-black' : 'text-zinc-400 hover:text-white'}`}>{getSupplierLabel(supplier)}</button>)}
            </div>
          </div>
          {supplierName === 'fazercards' ? (
            <>
              <div className="flex gap-3 mb-3 flex-wrap">
                <select value={catalogType} onChange={e => setCatalogType(e.target.value)} className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                  {FAZERCARDS_CATALOG_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <select value={catalogCategoryId} onChange={e => { setCatalogCategoryId(e.target.value); setSupplierResults([]); setCatalogOffersNextCursor(''); }} className="flex-1 min-w-[220px] bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                  <option value="">{catalogLoading ? 'جارٍ تحميل التصنيفات...' : 'اختر تصنيفًا'}</option>
                  {catalogCategories.map(category => {
                    const id = category.category_id || category.game_id || category.id;
                    return <option key={id} value={id}>{category.name || id}</option>;
                  })}
                </select>
                <button type="button" onClick={loadCatalogOffers} disabled={!catalogCategoryId || catalogLoading} className="px-5 py-3 rounded-xl bg-purple-400 text-black font-bold text-sm disabled:opacity-50">{catalogLoading ? 'جارٍ التحميل...' : 'تحميل العروض'}</button>
                {catalogNextCursor && <button type="button" onClick={() => loadCatalogCategories(false)} disabled={catalogLoading} className="px-4 py-3 rounded-xl border border-white/10 text-white text-sm disabled:opacity-50">تصنيفات إضافية</button>}
              </div>
              <input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="تصفية العروض المحملة..." className="w-full mb-4 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </>
          ) : (
            <>
          <form onSubmit={searchSupplier} className="flex gap-3 mb-2"><input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="ابحث عن منتجات FoxReload..." className="flex-1 min-w-0 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" /><button disabled={supplierSearching} className="px-5 py-3 rounded-xl bg-purple-400 text-black font-bold text-sm disabled:opacity-50">{supplierSearching ? 'جارٍ البحث...' : 'بحث في FoxReload'}</button></form>
              <p className="text-[11px] text-zinc-600 mb-4">نتائج البحث في FoxReload · اختر المنتجات بالأسفل لمراجعتها واستيرادها.</p>
            </>
          )}
          {supplierResults.length > 0 && <div className="mb-3 flex items-center justify-between gap-3 text-xs text-zinc-400"><span>{supplierName === 'foxreload' ? 'نتائج البحث في FoxReload' : 'عروض كتالوج FazerCards'} · تم تحميل: {supplierResults.length}</span><div className="flex gap-2"><button type="button" onClick={selectAllVisibleSupplierResults} className="text-purple-300 hover:text-white">تحديد الكل الظاهر</button><button type="button" onClick={clearSupplierSelection} className="text-zinc-500 hover:text-white">مسح التحديد</button></div></div>}
          {supplierResults.length > 0 && <div className="mb-4 p-3 rounded-xl border border-white/5 bg-black/20"><div className="flex items-center justify-between gap-3 mb-2"><span className="text-xs text-zinc-400">المحدد: {selectedSupplierIds.length}</span><button type="button" onClick={importSelectedSupplierProducts} disabled={!selectedSupplierIds.length} className="px-3 py-2 rounded-lg bg-white text-black text-xs font-bold disabled:opacity-40">استيراد المحدد</button></div><div className="grid gap-2 max-h-40 overflow-y-auto">{supplierResults.map(item => <label key={`select-${item.supplierProductId}`} className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={selectedSupplierIds.includes(item.supplierProductId)} onChange={e => setSelectedSupplierIds(current => e.target.checked ? [...new Set([...current, item.supplierProductId])] : current.filter(id => id !== item.supplierProductId))} />{item.name || 'منتج مورد بدون اسم'} <span className="text-zinc-600">{item.supplierProductId}</span></label>)}</div></div>}
          {supplierResults.length > 0 && <div className="mb-3 grid gap-1 text-[11px] text-zinc-500">{supplierResults.map(item => <div key={`availability-${item.supplierProductId}`}><span className="text-zinc-300">{item.name || 'Unnamed supplier item'}</span> · {getCatalogAvailability(item)}{item.stock !== undefined && item.stock !== null ? ` / ${item.stock}` : ''}{item.region ? ` · ${item.region}` : ''}{item.countryCode ? ` · ${item.countryCode}` : ''}{item.duration !== undefined ? ` · ${item.duration}` : ''}{item.variant !== undefined ? ` · ${item.variant}` : ''}{item.productType ? ` · ${item.productType}` : ''}</div>)}</div>}
          {supplierResults.filter(item => !supplierQuery.trim() || [item.name, item.supplierProductId, item.region, item.countryCode, item.duration, item.variant].filter(Boolean).some(value => String(value).toLowerCase().includes(supplierQuery.trim().toLowerCase()))).length > 0 && <div className="space-y-2 max-h-64 overflow-y-auto">{supplierResults.filter(item => !supplierQuery.trim() || [item.name, item.supplierProductId, item.region, item.countryCode, item.duration, item.variant].filter(Boolean).some(value => String(value).toLowerCase().includes(supplierQuery.trim().toLowerCase()))).map(item => <div key={`${item.supplier}-${item.supplierProductId}`} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-black/30 border border-white/5"><div className="min-w-0"><p className="text-sm text-white truncate">{item.name || 'منتج مورد بدون اسم'}</p><p className="text-[11px] text-zinc-500">المعرّف: {item.supplierProductId}{item.supplierCost !== undefined ? ` · التكلفة ${item.supplierCost} ${item.currency || 'USD'}` : ' · التكلفة غير متاحة'}{item.stock === undefined ? ' · التوفر غير معروف' : ` · المخزون ${item.stock}`}{item.region ? ` · ${item.region}` : ''}{item.countryCode ? ` · ${item.countryCode}` : ''}{item.duration !== undefined ? ` · ${item.duration}` : ''}{item.variant !== undefined ? ` · ${item.variant}` : ''}{item.productType ? ` · ${item.productType}` : ''}</p></div><button type="button" onClick={() => importSupplierProduct(item)} className="shrink-0 px-3 py-2 rounded-lg bg-white text-black text-xs font-bold">استيراد</button></div>)}</div>}
          {supplierName === 'fazercards' && catalogOffersNextCursor && <button type="button" onClick={loadCatalogOffers} disabled={catalogLoading} className="mt-3 px-4 py-2 rounded-lg border border-white/10 text-white text-xs disabled:opacity-50">{catalogLoading ? 'جارٍ التحميل...' : 'عروض إضافية'}</button>}
        </div>

        <div className="relative mb-4 max-w-md">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن المنتجات..."
            className="w-full px-5 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl text-sm focus:border-white/20 outline-none transition-all text-white"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="bg-zinc-900/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
            <option value="all">كل الموردين</option><option value="foxreload">FoxReload</option><option value="fazercards">FazerCards</option><option value="manual">يدوي / قديم</option>
          </select>
          <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} className="bg-zinc-900/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
            <option value="all">كل حالات التوفر</option><option value="available">متوفر</option><option value="out_of_stock">نفد المخزون</option><option value="unknown">غير معروف</option>
          </select>
          <select value={importedFilter} onChange={e => setImportedFilter(e.target.value)} className="bg-zinc-900/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
            <option value="all">كل حالات الاستيراد</option><option value="imported">مستورد</option><option value="not_imported">غير مستورد</option>
          </select>
          <select value={publishedFilter} onChange={e => setPublishedFilter(e.target.value)} className="bg-zinc-900/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
            <option value="all">كل حالات النشر</option><option value="live">منشور</option><option value="hidden">مخفي</option>
          </select>
        </div>

        {supplierSelectedProducts.length > 0 && <div className="flex items-center gap-3 flex-wrap mb-6 p-3 rounded-xl border border-purple-400/20 bg-purple-500/[0.04]">
          <span className="text-xs text-zinc-300">تم تحديد {supplierSelectedProducts.length} من منتجات المورد</span>
          <button type="button" onClick={handleBulkPrice} className="px-3 py-2 rounded-lg bg-white text-black text-xs font-bold">تحديد سعر البيع</button>
          <button type="button" onClick={handleBulkPublish} className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold">نشر المنتجات الصالحة</button>
          <button type="button" onClick={() => setSelectedProductIds([])} className="text-xs text-zinc-500 hover:text-white">مسح التحديد</button>
        </div>}

        <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider">المنتج</th>
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider">المخزون</th>
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider">السعر</th>
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="4" className="px-8 py-20 text-center text-zinc-600">جارٍ تحميل المخزون...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="4" className="px-8 py-20 text-center text-zinc-600 font-medium text-sm">لا توجد منتجات في هذه القائمة.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-5 flex items-center gap-4">
                      {p.supplier && p.supplier !== 'manual' && <input type="checkbox" checked={selectedProductIds.includes(p._id)} onChange={e => setSelectedProductIds(current => e.target.checked ? [...new Set([...current, p._id])] : current.filter(id => id !== p._id))} className="accent-purple-400" aria-label={`Select ${p.name}`} />}
                      <img src={getImageUrl(p.image) || `https://placehold.co/48x48/18181b/22c55e?text=${encodeURIComponent(p.name?.[0] || '?')}`} className="w-12 h-12 rounded-xl object-cover border border-white/5 bg-zinc-800" alt="" />
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <div className="flex items-center gap-2"><p className="text-[11px] text-zinc-500 font-medium">{getAdminCategoryLabel(p)}</p>{p.supplier && p.supplier !== 'manual' && <span className="text-[9px] text-purple-300">{getSupplierLabel(p.supplier)} · {p.supplierProductId}</span>}{p.isFeatured && <span className="text-[9px] uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">شائع</span>}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {p.supplier && p.supplier !== 'manual' ? (
                        <>
                          <div className="text-[10px] text-purple-300 mb-1">المورد: {getSupplierLabel(p.supplier)}</div>
                          <div className="text-[10px] text-zinc-500 mb-1">الحالة: {getSupplierManagementState(p)}</div>
                          {p.supplierCost !== undefined && p.supplierCost !== null && <div className="text-[10px] text-zinc-500 mb-1">تكلفة المورد: ${Number(p.supplierCost).toFixed(2)} USD</div>}
                          <span className={`text-sm font-medium ${getSupplierQuantity(p) !== null && getSupplierQuantity(p) > 0 ? 'text-zinc-400' : getSupplierQuantity(p) !== null ? 'text-rose-500' : 'text-amber-400'}`}>
                            {getSupplierQuantity(p) === null ? 'التوفر غير معروف' : getSupplierQuantity(p) > 0 ? `متوفر / ${getSupplierQuantity(p)}` : 'نفد المخزون'}
                          </span>
                        </>
                      ) : p.isUnlimited ? (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold text-xl">∞</span>
                          <span className="text-[10px] text-emerald-500/70 font-bold">غير محدود</span>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${p.stock <= 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
                          {p.stock <= 0 ? 'نفد المخزون' : `${p.stock} وحدة`}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 font-bold text-white">${p.price}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => openEdit(p)} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">تعديل</button>
                        <button onClick={() => handleTogglePopular(p)} className={`text-sm font-bold transition-colors ${p.isFeatured ? 'text-amber-300 hover:text-amber-200' : 'text-zinc-400 hover:text-amber-300'}`}>{p.isFeatured ? 'إزالة التمييز' : 'تعيين كمنتج مميز'}</button>
                        <button 
                          onClick={() => handleToggleStatus(p)} 
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${p.isActive ? 'bg-zinc-800 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                        >
                          {p.isActive ? 'إخفاء المنتج' : 'نشر المنتج'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
          </div>

          <div className="sm:hidden divide-y divide-white/5">
            {loading ? <div className="p-12 text-center text-zinc-600 text-sm">Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø®Ø²Ù†...</div> : filtered.length === 0 ? <div className="p-12 text-center text-zinc-600 text-sm">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©.</div> : filtered.map(p => (
              <article key={`mobile-${p._id}`} className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  {p.supplier && p.supplier !== 'manual' && <input type="checkbox" checked={selectedProductIds.includes(p._id)} onChange={e => setSelectedProductIds(current => e.target.checked ? [...new Set([...current, p._id])] : current.filter(id => id !== p._id))} className="mt-2 accent-purple-400" aria-label={`Select ${p.name}`} />}
                  <img src={getImageUrl(p.image) || `https://placehold.co/48x48/18181b/22c55e?text=${encodeURIComponent(p.name?.[0] || '?')}`} className="w-14 h-14 shrink-0 rounded-2xl object-cover border border-white/5 bg-zinc-800" alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white break-words">{p.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{getAdminCategoryLabel(p)}</p>
                    {p.supplier && p.supplier !== 'manual' && <p className="text-[10px] text-purple-300 mt-1">{getSupplierLabel(p.supplier)} · {p.supplierProductId}</p>}
                  </div>
                  {p.isFeatured && <span className="shrink-0 text-[9px] text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">شائع</span>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                    <p className="text-[10px] text-zinc-600 mb-1">المخزون</p>
                    <p className={`text-xs font-semibold ${p.supplier && p.supplier !== 'manual' ? 'text-purple-300' : p.isUnlimited || p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.supplier && p.supplier !== 'manual' ? (getSupplierQuantity(p) === null ? 'غير معروف' : getSupplierQuantity(p) > 0 ? `متوفر / ${getSupplierQuantity(p)}` : 'نفد المخزون') : p.isUnlimited ? 'غير محدود' : p.stock <= 0 ? 'نفد المخزون' : `${p.stock} وحدات`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                    <p className="text-[10px] text-zinc-600 mb-1">السعر</p>
                    <p className="text-xs font-bold text-white">${p.price}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 min-w-[90px] py-2.5 rounded-xl bg-zinc-800 text-white text-[11px] font-semibold border border-white/10">تعديل</button>
                  <button onClick={() => handleTogglePopular(p)} className="flex-1 min-w-[110px] py-2.5 rounded-xl bg-zinc-800 text-amber-300 text-[11px] font-semibold border border-white/10">{p.isFeatured ? 'إزالة التمييز' : 'منتج مميز'}</button>
                  <button onClick={() => handleToggleStatus(p)} className={`w-full py-2.5 rounded-xl text-[11px] font-bold ${p.isActive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500 text-white'}`}>{p.isActive ? 'إخفاء المنتج' : 'نشر المنتج'}</button>
                </div>
              </article>
            ))}
          </div>

          <div className="flex justify-between items-center px-8 py-5 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-zinc-600 font-normal ">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-6">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="text-xs font-semibold disabled:opacity-20 hover:text-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="text-xs font-semibold disabled:opacity-20 hover:text-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#0c0c0c] border border-white/5 rounded-2xl sm:rounded-[2.5rem] shadow-2xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-5 sm:p-10">
              <div className="flex justify-between items-center gap-4 mb-6 sm:mb-8">
                <h2 className="text-2xl font-bold text-white">{editing ? 'تعديل المنتج' : 'منتج جديد'}</h2>
                <button onClick={() => setModal(false)} className="text-zinc-500 hover:text-white text-3xl transition-colors">&times;</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-8">
                  <div>
                    <p className="text-sm font-bold text-emerald-400 font-sans">مخزون غير محدود / يدوي</p>
                    <p className="text-[11px] text-zinc-500 font-medium mt-1">
                      فعّل هذا لمنع ظهور حالة «نفد المخزون». مناسب للخدمات والبطاقات الرقمية.
                    </p>
                  </div>

                  <input 
                    type="checkbox" 
                    checked={form.isUnlimited} 
                    onChange={e => setForm(f => ({ ...f, isUnlimited: e.target.checked }))}
                    className="w-6 h-6 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-purple-500/5 border border-purple-400/20 rounded-2xl mb-8">
                  <div>
                    <p className="text-sm font-bold text-purple-300">السعر حسب الطلب</p>
                    <p className="text-[11px] text-zinc-500 mt-1">يخفي السعر ويعرض زر «تواصل واتساب» للعميل.</p>
                  </div>
                  <input type="checkbox" checked={!!form.isQuoteOnly} onChange={e => setForm(f => ({ ...f, isQuoteOnly: e.target.checked }))} className="w-6 h-6 accent-purple-500 cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">اسم المنتج *</label>
                    <input required value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">التصنيف *</label>
                    <select value={form.category} onChange={e => setForm(f=>({...f, category: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white font-sans">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">المنصة</label>
                    <input value={form.platform} onChange={e => setForm(f=>({...f, platform: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" placeholder="e.g. Roblox, Steam" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">السعر ($) *</label>
                    <input required type="number" step="0.01" value={form.price} onChange={e => setForm(f=>({...f, price: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">السعر الأصلي</label>
                    <input type="number" step="0.01" value={form.originalPrice} onChange={e => setForm(f=>({...f, originalPrice: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  <div className="sm:col-span-2 rounded-2xl border border-purple-400/20 bg-purple-500/[0.04] p-4 space-y-4">
                    <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">عرض خاص</p><p className="text-[11px] text-zinc-500">إنشاء عرض ترويجي مجدول للمنتج</p></div><label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={!!form.promotion?.active} onChange={e => setForm(f => ({ ...f, promotion: { ...f.promotion, active: e.target.checked } }))} className="accent-purple-400" /> نشط</label></div>
                    <input value={form.promotion?.name || ''} onChange={e => setForm(f => ({ ...f, promotion: { ...f.promotion, name: e.target.value } }))} placeholder="اسم الحملة، مثال: اليوم الوطني السعودي" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-purple-300" />
                    <div className="grid grid-cols-3 gap-3"><select value={form.promotion?.type || 'percentage'} onChange={e => setForm(f => ({ ...f, promotion: { ...f.promotion, type: e.target.value } }))} className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white"><option value="percentage">نسبة مئوية %</option><option value="fixed">مبلغ ثابت $</option></select><input type="number" min="0" max={form.promotion?.type === 'percentage' ? 100 : undefined} step="0.01" value={form.promotion?.value || ''} onChange={e => setForm(f => ({ ...f, promotion: { ...f.promotion, value: e.target.value } }))} placeholder="قيمة الخصم" className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white" /><label className="flex flex-col gap-2 text-xs text-zinc-400"><span>تاريخ بداية العرض</span><input type="date" value={form.promotion?.startsAt || ''} onChange={e => setForm(f => ({ ...f, promotion: { ...f.promotion, startsAt: e.target.value } }))} className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white" /></label></div>
                    <label className="flex flex-col gap-2 text-xs text-zinc-400"><span>تاريخ نهاية العرض</span><input type="date" value={form.promotion?.endsAt || ''} onChange={e => setForm(f => ({ ...f, promotion: { ...f.promotion, endsAt: e.target.value } }))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white" /></label>
                  </div>

                  {!form.isUnlimited && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">كمية المخزون *</label>
                      <input type="number" value={form.stock} onChange={e => setForm(f=>({...f, stock: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">الوصف الكامل *</label>
                    <textarea required value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} rows={4} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all resize-none text-white font-sans" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">خيارات الباقات والأسعار</label>
                    <textarea value={form.optionsText || ''} onChange={e => setForm(f=>({...f, optionsText: e.target.value}))} rows={4} dir="ltr" placeholder="Netflix - 1 Month|5|اشتراك شهر كامل" className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all resize-none text-white font-mono text-sm" />
                    <p className="text-[11px] text-zinc-500 mt-2">كل سطر بهذا الشكل: اسم الباقة | السعر | وصف مختصر</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">صورة المنتج</label>
                    <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-black hover:file:bg-zinc-200 cursor-pointer transition-all font-sans" />
                  </div>

                  <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                    <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 accent-white cursor-pointer" />
                    <label htmlFor="isFeatured" className="text-xs font-semibold text-zinc-400 cursor-pointer font-sans">تمييز كمنتج مميز</label>
                  </div>
                </div>

                {/* Reviews */}
                {editing && form.reviews && form.reviews.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      تقييمات العملاء 
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">{form.reviews.length}</span>
                    </h3>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {form.reviews.map((rev) => (
                        <div key={rev._id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-emerald-500">★ {rev.rating}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{rev.comment}</p>
                            <p className="text-[10px] text-zinc-600 mt-2 font-mono">رقم المستخدم: {rev.user}</p>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => handleDeleteReview(rev._id)}
                            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-xs font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-8 border-t border-white/5">
                  <button type="submit" disabled={saving} className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50">
                    {saving ? 'جارٍ التنفيذ...' : editing ? 'تحديث المنتج' : 'إنشاء المنتج'}
                  </button>
                  <button type="button" onClick={() => setModal(false)} className="px-10 bg-zinc-900 text-zinc-400 font-bold py-4 rounded-xl hover:bg-zinc-800 transition-all font-sans">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
