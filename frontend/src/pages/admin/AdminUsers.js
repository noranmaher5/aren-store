import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ALL_ROLES = ['user', 'editor', 'admin', 'manager', 'co-owner', 'owner', 'hidden'];

const PERMISSIONS_LIST = [
  { id: 'manage_products',     label: 'إدارة المنتجات',      icon: '📦' },
  { id: 'manage_orders',       label: 'إدارة الطلبات',        icon: '🧾' },
  { id: 'manage_maintenance',  label: 'وضع الصيانة',     icon: '🔧' },
  { id: 'view_analytics',      label: 'التحليلات المالية',  icon: '📊' },
  { id: 'manage_users',        label: 'إدارة المستخدمين',      icon: '👥' },
  { id: 'manage_settings',     label: 'إعدادات النظام',      icon: '⚙️' },
  { id: 'view_ledger',         label: 'الوصول إلى السجل المالي',        icon: '💰' },
];


export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [editTarget, setEditTarget] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null); 
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Password Modal States
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ limit: 100 });
      setUsers(res.data.users);
    } catch (err) {
      toast.error('تعذر تحميل المستخدمين');
    } finally { setLoading(false); }
  };

  const togglePermission = (id) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleDeleteUser = async () => {
    setDeleteLoading(true);
    try {
      await adminAPI.deleteUser(deleteTarget._id);
      toast.success(`تم حذف ${deleteTarget.name} نهائياً`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف المستخدم');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6)
      return toast.error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
    if (newPassword !== confirmPassword)
      return toast.error('كلمتا المرور غير متطابقتين');

    setPasswordLoading(true);
    try {
      await adminAPI.changeUserPassword(passwordTarget._id, { newPassword });
      toast.success('تم تحديث كلمة المرور بنجاح');
      setPasswordTarget(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث كلمة المرور');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div dir="rtl" className="admin-users-page min-h-screen bg-black text-white px-4 py-6 sm:p-8 pt-24 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold leading-none">إدارة المستخدمين</h1>
          <p className="text-sm text-white  font-normal">إدارة الحسابات والصلاحيات</p>
        </div>
        
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl sm:rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="hidden sm:block w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white/[0.02] text-xs text-neutral-100 border-b border-white/5 font-semibold">
              <tr>
                <th className="px-8 py-7">بيانات المستخدم</th>
                <th className="px-8 py-7 text-center">إحصائيات الطلبات</th>
                <th className="px-8 py-7 text-center">الدور</th>
                <th className="px-8 py-7 text-right">الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-bold group-hover:border-[#6366F1]/50 transition-all shadow-inner">
                        {u.name?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-xs text-zinc-600 font-mono">{u.email}</p>
                        {u.phone && (
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">📞 {u.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-xs text-[#6366F1] font-semibold">${u.totalSpent?.toFixed(2) || '0.00'}</span>
                       <span className="text-[13px] text-zinc-600 font-normal">{u.orderCount || 0} طلب</span>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <span className="text-xs bg-zinc-800/80 px-3 py-1.5 rounded-lg font-semibold border border-white/10 text-zinc-400">
                      {u.role === 'hidden' ? '⭐' : u.role}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => { setViewingActivity(u); setExpandedOrderId(null); }}
                        className="text-xs font-semibold py-2.5 px-6 rounded-xl bg-zinc-800 text-white border border-white/10 hover:bg-white hover:text-black transition-all"
                      >
                        Activity
                      </button>
                      <button
                        onClick={() => { setPasswordTarget(u); setNewPassword(''); setConfirmPassword(''); setShowPassword(false); }}
                        className="text-xs font-semibold py-2.5 px-5 rounded-xl bg-zinc-800 text-zinc-400 border border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30 transition-all"
                        title="Change Password"
                      >
                        🔑
                      </button>
                      <button 
                        onClick={() => { setEditTarget(u); setSelectedRole(u.role); setSelectedPerms(u.permissions || []); }}
                        className="text-xs font-semibold py-2.5 px-6 rounded-xl bg-white text-black hover:bg-[#6366F1] hover:text-white transition-all shadow-xl active:scale-95"
                      >
                        Access
                      </button>
                      {u._id !== me?._id && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-xs font-semibold py-2.5 px-5 rounded-xl bg-zinc-800 text-zinc-400 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Mobile cards: easier to scan and use than the desktop table. */}
          <div className="sm:hidden divide-y divide-white/5">
            {users.map(u => (
              <article key={`mobile-${u._id}`} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-bold">
                      {u.name?.[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[190px]">{u.email}</p>
                      {u.phone && <p className="text-[11px] text-zinc-600 font-mono truncate">{u.phone}</p>}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] bg-zinc-800/80 px-2.5 py-1.5 rounded-lg font-semibold border border-white/10 text-zinc-400">
                    {u.role === 'hidden' ? '⭐' : u.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                    <p className="text-[10px] text-zinc-600 mb-1">إجمالي الإنفاق</p>
                    <p className="text-xs text-[#6366F1] font-semibold">${u.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                    <p className="text-[10px] text-zinc-600 mb-1">الطلبات</p>
                    <p className="text-xs text-zinc-300 font-semibold">{u.orderCount || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setViewingActivity(u); setExpandedOrderId(null); }} className="py-2.5 rounded-xl bg-zinc-800 text-white border border-white/10 text-[11px] font-semibold">Activity</button>
                  <button onClick={() => { setEditTarget(u); setSelectedRole(u.role); setSelectedPerms(u.permissions || []); }} className="py-2.5 rounded-xl bg-white text-black text-[11px] font-semibold">Access</button>
                  <button onClick={() => { setPasswordTarget(u); setNewPassword(''); setConfirmPassword(''); setShowPassword(false); }} className="py-2.5 rounded-xl bg-zinc-800 text-zinc-300 border border-white/10 text-[11px] font-semibold">🔑 تغيير كلمة المرور</button>
                  {u._id !== me?._id ? (
                    <button onClick={() => setDeleteTarget(u)} className="py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-semibold">🗑️ حذف المستخدم</button>
                  ) : <div />}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* --- ACTIVITY MODAL: --- */}
      {viewingActivity && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl transition-all animate-in fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-2xl rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            
            <div className="p-5 sm:p-10 border-b border-white/5 flex justify-between items-center gap-4 bg-white/[0.01]">
              <div>
            <h2 className="text-2xl font-bold text-white">نشاط المستخدم</h2>
                <p className="text-xs text-[#6366F1] font-semibold mt-1">Operator: {viewingActivity.name}</p>
              </div>
              <button 
                onClick={() => setViewingActivity(null)}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-xl"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-4 sm:space-y-6 custom-scrollbar">
              {viewingActivity.orderHistory && viewingActivity.orderHistory.length > 0 ? (
                viewingActivity.orderHistory.map((order) => (
                  <div key={order._id} className="bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden group/order">
                    {/* --- ORDER HEADER --- */}
                    <div 
                      onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                      className="p-4 sm:p-6 flex justify-between items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-600">Batch ID: {order._id.slice(-8)}</span>
                        <span className="text-sm font-semibold text-white">{new Date(order.createdAt).toDateString()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md w-fit"
                          style={{
                            background: order.paymentMethod === 'paypal' ? 'rgba(0,112,240,0.1)' : 'rgba(99,91,255,0.1)',
                            color: order.paymentMethod === 'paypal' ? '#0070f0' : '#635bff',
                            border: `1px solid ${order.paymentMethod === 'paypal' ? 'rgba(0,112,240,0.3)' : 'rgba(99,91,255,0.3)'}`,
                          }}>
                          {order.paymentMethod === 'paypal' ? '🅿 PayPal' : '💳 Stripe'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-zinc-600 mb-1">القيمة</p>
                          <p className="text-lg font-bold text-[#6366F1]">${order.totalAmount?.toFixed(2)}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center transition-all ${expandedOrderId === order._id ? 'rotate-180 bg-[#6366F1] border-[#6366F1] text-black' : 'bg-black'}`}>
                          ↓
                        </div>
                      </div>
                    </div>

                    {/*  */}
                    {expandedOrderId === order._id && (
                      <div className="px-6 pb-6 pt-2 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="h-px bg-white/5 mb-4" />
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/[0.03] hover:border-[#6366F1]/20">
                           
<div className="flex items-center gap-4">
  <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
    {getImageUrl(item.image) ? (
      <img 
        src={getImageUrl(item.image)} 
        alt={item.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    ) : (
      <div className="text-[8px] font-black text-zinc-600 italic uppercase">No_Img</div>
    )}
  </div>
  <div>
    <p className="text-xs font-black text-white uppercase tracking-tight">{item.name}</p>
                          <p className="text-[9px] text-zinc-600 font-bold tracking-widest">الكمية: {item.quantity}</p>
  </div>
</div>
                            <span className="text-xs font-semibold text-white font-mono">${item.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
              <div className="text-center py-32 opacity-50 text-xs font-normal">لا توجد معاملات</div>
              )}
            </div>

            {/* الفوتر الخاص بالنافذة */}
            <div className="p-5 sm:p-10 bg-white/[0.01] border-t border-white/5 backdrop-blur-3xl flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-600 font-normal mb-1 text-left">إجمالي القيمة</p>
                <p className="text-3xl font-bold text-white leading-none">${viewingActivity.totalSpent?.toFixed(2)}</p>
              </div>
             
            </div>
          </div>
        </div>
      )}

      {/* --- ACCESS MODAL:--- */}
      {editTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-8 text-white border-l-4 border-[#6366F1] pl-5">إدارة الصلاحيات</h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs text-zinc-500 font-semibold mb-3 block">مستوى الصلاحية</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-xs font-semibold outline-none focus:border-[#6366F1] transition-all"
                >
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r === 'hidden' ? '⭐' : r}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-zinc-500 font-semibold mb-3 block">الصلاحيات المتاحة</label>
                <div className="space-y-2">
                  {PERMISSIONS_LIST.map(perm => {
                    const active = selectedPerms.includes(perm.id);
                    return (
                      <div 
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${active ? 'bg-[#6366F1]/5 border-[#6366F1]/40' : 'bg-black border-white/5 opacity-40 hover:opacity-100'}`}
                      >
                        <span className="text-xs font-semibold">{perm.label}</span>
                        <div className={`w-4 h-4 rounded border ${active ? 'bg-[#6366F1] border-[#6366F1]' : 'border-zinc-700'}`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4 mt-8">
                <button 
                  onClick={async () => {
                    try {
                      await adminAPI.updateUserRole(editTarget._id, { role: selectedRole, permissions: selectedPerms });
                      toast.success('PROTOCOL_UPDATED');
                      setEditTarget(null);
                      loadUsers();
                    } catch (err) { toast.error('ERROR'); }
                  }}
                  className="py-4 bg-white text-black rounded-xl font-semibold text-xs hover:bg-[#6366F1] transition-all"
                >حفظ التغييرات</button>
                <button 
                  onClick={() => setEditTarget(null)}
                  className="py-4 bg-zinc-900 text-zinc-600 rounded-xl font-semibold text-xs border border-white/5"
                >إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- DELETE MODAL:--- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border border-red-500/20 w-full max-w-md rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-3xl">
                ⚠️
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">حذف نهائي</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                هذا الإجراء <span className="text-red-400 font-semibold">لا يمكن التراجع عنه</span>. سيتم حذف جميع بيانات المستخدم نهائياً من النظام.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 mb-8 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                {deleteTarget.name?.[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{deleteTarget.name}</p>
                <p className="text-xs text-zinc-600 font-mono">{deleteTarget.email}</p>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-400 font-semibold mt-1 inline-block border border-white/5">{deleteTarget.role === 'hidden' ? '⭐' : deleteTarget.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="py-4 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <> 🗑️ تأكيد الحذف</>
                )}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-4 bg-zinc-900 text-zinc-400 rounded-xl font-semibold text-xs border border-white/5 hover:border-white/10 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PASSWORD MODAL--- */}
      {passwordTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white border-l-4 border-yellow-500 pl-5">تغيير كلمة المرور</h2>
                <p className="text-xs text-zinc-500 mt-2 pl-5">Operator: <span className="text-yellow-400 font-semibold">{passwordTarget.name}</span></p>
              </div>
              <button
                onClick={() => setPasswordTarget(null)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
              >✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 font-semibold mb-2 block">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full h-13 bg-zinc-900 border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors text-xs"
                  >
                    {showPassword ? '👀' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-semibold mb-2 block">تأكيد كلمة المرور</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className={`w-full h-13 bg-zinc-900 border rounded-xl px-5 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500/50 focus:border-red-500'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-green-500/50 focus:border-green-500'
                      : 'border-white/10 focus:border-yellow-500/50'
                  }`}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400 mt-1 pl-1">كلمتا المرور غير متطابقتين</p>
                )}
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                  className="py-4 bg-yellow-500 text-black rounded-xl font-bold text-xs hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <> 🔑 تحديث كلمة المرور</>
                  )}
                </button>
                <button
                  onClick={() => setPasswordTarget(null)}
                  className="py-4 bg-zinc-900 text-zinc-600 rounded-xl font-semibold text-xs border border-white/5 hover:border-white/10 transition-all"
                >✕</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
