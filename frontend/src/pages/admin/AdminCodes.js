import React, { useState, useEffect } from 'react';
import { productAPI, codeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCodes() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState([]);
  const [codesText, setCodesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('upload'); // 'upload' or 'view'

  // Load products and stock stats on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Sync codes when switching to 'view' tab or changing product
  useEffect(() => {
    if (selectedProduct && tab === 'view') {
      loadCodes();
    }
  }, [selectedProduct, tab]);

  const loadInitialData = async () => {
    try {
      const [resProd, resStats] = await Promise.all([
        productAPI.getAll({ limit: 100 }),
        codeAPI.getStats()
      ]);
      setProducts(resProd.data.products);
      setStats(resStats.data.stats);
      if (resProd.data.products.length && !selectedProduct) {
        setSelectedProduct(resProd.data.products[0]._id);
      }
    } catch (err) {
      toast.error('تعذر تحميل البيانات');
    }
  };

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await codeAPI.getByProduct(selectedProduct, { limit: 100 });
      setCodes(res.data.codes);
    } catch (err) {
      toast.error('تعذر تحميل الرموز');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const lines = codesText.split('\n').map(c => c.trim()).filter(Boolean);
    
    if (!lines.length) return toast.error('يرجى إدخال رمز واحد على الأقل');
    if (!selectedProduct) return toast.error('يرجى اختيار منتج');

    setUploading(true);
    try {
      const res = await codeAPI.addBulk({ productId: selectedProduct, codes: lines });
      toast.success(res.data.message);
      setCodesText(''); 
      loadInitialData(); // Update stock counts immediately
      if (tab === 'view') loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرمز؟')) return;
    try {
      await codeAPI.delete(id);
      toast.success('تم حذف الرمز بنجاح');
      loadCodes();
      loadInitialData();
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold">المخزون الرقمي</h1>
          <p className="text-zinc-500 text-sm mt-2 font-normal">إدارة مفاتيح المنتجات ومستويات المخزون</p>
        </header>

        {/* Top Section: Product Selector & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-zinc-900/40 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md">
            <label className="block text-xs font-semibold text-zinc-500 mb-4">المنتج المستهدف</label>
            <select 
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-black border border-white/10 p-4 rounded-xl outline-none focus:border-white transition-all appearance-none font-semibold text-sm cursor-pointer"
            >
              {products.map(p => (
                <option key={p._id} value={p._id} className="bg-zinc-950">
                  {p.name.toUpperCase()} (المخزون: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-zinc-900/40 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md">
            <label className="block text-xs font-semibold text-zinc-500 mb-4">مراقبة المخزون</label>
            <div className="space-y-3 max-h-32 overflow-y-auto no-scrollbar">
              {stats.map(s => (
                <div key={s._id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400 truncate font-semibold">{s.product?.name}</span>
                  <span className={`font-mono font-bold ${s.available < 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {s.available}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 mb-8 bg-zinc-900/50 w-fit p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setTab('upload')}
            className={`px-10 py-3 rounded-xl text-xs font-semibold transition-all ${tab === 'upload' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            رفع جماعي
          </button>
          <button 
            onClick={() => setTab('view')}
            className={`px-10 py-3 rounded-xl text-xs font-semibold transition-all ${tab === 'view' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            قاعدة البيانات
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          {tab === 'upload' ? (
            <div className="p-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">رفع المفاتيح</h2>
                <span className="text-xs text-zinc-500 font-normal">
                  تم اكتشاف {codesText.split('\n').filter(c => c.trim()).length} مفاتيح
                </span>
              </div>
              <form onSubmit={handleUpload}>
                <textarea 
                  value={codesText}
                  onChange={(e) => setCodesText(e.target.value)}
                  placeholder="ألصق المفاتيح هنا... (مفتاح واحد في كل سطر)"
                  rows={12}
                  className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 outline-none focus:border-white/10 font-mono text-sm mb-8 resize-none transition-all placeholder:text-zinc-800"
                />
                <button 
                  disabled={uploading}
                  className="w-full bg-white text-black font-bold py-6 rounded-2xl hover:bg-zinc-200 transition-all text-sm disabled:opacity-50"
                >
                  {uploading ? 'جارٍ التنفيذ...' : 'تأكيد الرفع'}
                </button>
              </form>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-10 py-6 text-xs font-semibold text-zinc-500">المفتاح السري</th>
                    <th className="px-10 py-6 text-xs font-semibold text-zinc-500">الحالة</th>
                    <th className="px-10 py-6 text-xs font-semibold text-zinc-500 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="3" className="p-20 text-center text-zinc-600 font-normal text-sm">جارٍ تحديث البيانات...</td></tr>
                  ) : codes.map(c => (
                    <tr key={c._id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="px-10 py-5 font-mono text-sm font-semibold text-zinc-300">{c.code}</td>
                      <td className="px-10 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${c.isUsed ? 'border-rose-500/10 text-rose-500' : 'border-emerald-500/10 text-emerald-500'}`}>
                          {c.isUsed ? '● مستخدم' : '○ متاح'}
                        </span>
                      </td>
                      <td className="px-10 py-5 text-right">
                        {!c.isUsed && (
                          <button 
                            onClick={() => handleDelete(c._id)} 
                            className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && codes.length === 0 && (
                <div className="p-20 text-center text-zinc-800 font-normal text-sm">لا توجد مفاتيح لهذا المنتج</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
