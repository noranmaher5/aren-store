import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../../services/api';

const discountAPI = {
  getAll: () => API.get('/discounts'),
  create: (data) => API.post('/discounts', data),
  toggle: (id) => API.put(`/discounts/${id}/toggle`),
  delete: (id) => API.delete(`/discounts/${id}`),
};

export default function AdminDiscounts() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewCode, setViewCode] = useState(null);
  const [form, setForm] = useState({
    code: '', description: '', type: 'percentage',
    value: '', maxUses: '', maxUsesPerUser: '1', expiresAt: '',
  });

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await discountAPI.getAll();
      setCodes(res.data.codes);
    } catch { toast.error('تعذر تحميل أكواد الخصم'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await discountAPI.create({
        ...form,
        value: Number(form.value),
        maxUses: Number(form.maxUses) || 0,
        maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
        expiresAt: form.expiresAt || null,
      });
      toast.success('تم إنشاء كود الخصم');
      setShowCreate(false);
      setForm({ code: '', description: '', type: 'percentage', value: '', maxUses: '', maxUsesPerUser: '1', expiresAt: '' });
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر إنشاء الكود');
    }
  };

  const handleToggle = async (id) => {
    try {
      await discountAPI.toggle(id);
      loadCodes();
    } catch { toast.error('تعذر تغيير حالة الكود'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف كود الخصم هذا؟')) return;
    try {
      await discountAPI.delete(id);
      toast.success('تم الحذف');
      loadCodes();
    } catch { toast.error('فشل الحذف'); }
  };

  const isExpired = (code) => code.expiresAt && new Date() > new Date(code.expiresAt);
  const isMaxed = (code) => code.maxUses > 0 && code.usedCount >= code.maxUses;

  return (
    <div dir="rtl" className="pt-24 pb-16 min-h-screen bg-[#080808] text-zinc-200 font-sans">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">أكواد الخصم</h1>
            <p className="text-xs text-zinc-600 mt-1">إدارة أكواد الشراكات والعروض الترويجية</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-white text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-zinc-200 transition-all"
          >
            + كود جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
            <p className="text-xs text-zinc-500 mb-1">إجمالي الأكواد</p>
            <p className="text-2xl font-bold text-white">{codes.length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
            <p className="text-xs text-zinc-500 mb-1">نشطة</p>
            <p className="text-2xl font-bold text-emerald-400">{codes.filter(c => c.isActive && !isExpired(c) && !isMaxed(c)).length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
            <p className="text-xs text-zinc-500 mb-1">إجمالي الاستخدامات</p>
            <p className="text-2xl font-bold text-white">{codes.reduce((s, c) => s + c.usedCount, 0)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500">الكود</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500">الخصم</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500">الاستخدام</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500">الحالة</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="p-16 text-center text-zinc-600 text-sm">جارٍ التحميل...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan="5" className="p-16 text-center text-zinc-600 text-sm">لا توجد أكواد خصم بعد</td></tr>
              ) : codes.map(code => {
                const expired = isExpired(code);
                const maxed = isMaxed(code);
                const statusOk = code.isActive && !expired && !maxed;
                return (
                  <tr key={code._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-white text-sm">{code.code}</p>
                      {code.description && <p className="text-[11px] text-zinc-500 mt-0.5">{code.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-400">
                        {code.type === 'percentage' ? `${code.value}%` : `$${code.value}`}
                      </span>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{code.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">
                        {code.usedCount} / {code.maxUses === 0 ? '∞' : code.maxUses}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">الحد الأقصى {code.maxUsesPerUser}/مستخدم</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                        expired ? 'bg-zinc-900 text-zinc-500 border-zinc-800' :
                        maxed ? 'bg-rose-900/20 text-rose-400 border-rose-900/30' :
                        statusOk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {expired ? 'منتهي' : maxed ? 'مستنفد' : statusOk ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewCode(code)}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleToggle(code._id)}
                          className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${
                            code.isActive ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {code.isActive ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button
                          onClick={() => handleDelete(code._id)}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-black/70">
          <div className="absolute inset-0" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/5 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">إنشاء كود خصم</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">الكود *</label>
                <input
                  required value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. PARTNER20"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none focus:border-zinc-600 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">الوصف</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Partnership with XYZ"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-600 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 mb-1.5 block">النوع</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  >
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed $</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 mb-1.5 block">
                    Value {form.type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    required type="number" min="0" max={form.type === 'percentage' ? 100 : undefined}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'percentage' ? '20' : '5.00'}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 mb-1.5 block">أقصى استخدام إجمالي</label>
                  <input
                    type="number" min="0" value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="0 = unlimited"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 mb-1.5 block">أقصى استخدام للمستخدم</label>
                  <input
                    type="number" min="1" value={form.maxUsesPerUser}
                    onChange={e => setForm(f => ({ ...f, maxUsesPerUser: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date" value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all text-sm">
                  إنشاء الكود
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-xl text-sm">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewCode && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-black/70">
          <div className="absolute inset-0" onClick={() => setViewCode(null)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/5 rounded-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">{viewCode.code}</h2>
                <p className="text-xs text-zinc-500 mt-1">{viewCode.description || 'لا يوجد وصف'}</p>
              </div>
              <button onClick={() => setViewCode(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">الخصم</p>
                <p className="text-lg font-bold text-emerald-400">
                  {viewCode.type === 'percentage' ? `${viewCode.value}%` : `$${viewCode.value}`}
                </p>
              </div>
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Total Uses</p>
                <p className="text-lg font-bold text-white">
                  {viewCode.usedCount} / {viewCode.maxUses === 0 ? '∞' : viewCode.maxUses}
                </p>
              </div>
            </div>

            {/* Users who used it */}
            <div>
                  <p className="text-xs font-bold text-zinc-400 mb-3">استخدمه ({viewCode.usedBy?.length || 0} مستخدم)</p>
              {viewCode.usedBy?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewCode.usedBy.map((usage, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-black/30 border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-white">{usage.user?.name || 'غير معروف'}</p>
                        <p className="text-[10px] text-zinc-500">{usage.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-400 font-bold">-${usage.discountAmount?.toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-600">{new Date(usage.usedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 text-center py-6">No one has used this code yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
