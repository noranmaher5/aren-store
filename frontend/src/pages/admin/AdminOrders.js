import React, { useState, useEffect, useRef } from 'react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';

const STATUS_STYLES = {
    PENDING_PAYMENT: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    paid_unconfirmed: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    pending: 'bg-zinc-800 text-zinc-400',
    paid: 'bg-zinc-700 text-zinc-200',
    processing: 'bg-zinc-600 text-zinc-100',
    completed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium',
    failed: 'bg-rose-900/20 text-rose-500',
    refunded: 'bg-zinc-800 text-zinc-500',
    cancelled: 'bg-zinc-900 text-zinc-600',
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10; 
    
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const [viewOrder, setViewOrder] = useState(null);         
    
    const [manualCodes, setManualCodes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState('manual');
    const [fulfillmentType, setFulfillmentType] = useState('manual_code');
    const [accountEmail, setAccountEmail] = useState('');
    const [accountPassword, setAccountPassword] = useState('');

    useEffect(() => { loadOrders(); }, [status, paymentStatus, search, page]);

    
    const lastTotalRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const params = { page: 1, limit: 1 };
                if (status) params.status = status;
                const res = await orderAPI.getAll(params);
                const latestTotal = res.data.total;

                
                if (lastTotalRef.current === null) {
                    lastTotalRef.current = latestTotal;
                    return;
                }

               
                if (latestTotal > lastTotalRef.current) {
                    lastTotalRef.current = latestTotal;
                    loadOrders();
                }
            } catch {
               
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [status]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (status) params.status = status;
            if (paymentStatus) params.paymentStatus = paymentStatus;
            if (search.trim()) params.search = search.trim();
            const res = await orderAPI.getAll(params);
            setOrders(res.data.orders);
            setTotal(res.data.total);

            const unconfirmedCount = res.data.orders.filter(o => o.status === 'paid_unconfirmed').length;
            if (unconfirmedCount > 0 && page === 1) {
                    toast(`لديك ${unconfirmedCount} طلبات بانتظار التأكيد`, {
                    icon: '🔔',
                    style: { borderRadius: '12px', background: '#fff', color: '#000', fontSize: '14px', fontWeight: '500' },
                    duration: 5000
                });
            }
        } catch { 
            toast.error('تعذر الاتصال بالخادم'); 
        } finally { 
            setLoading(false); 
        }
    };

    const confirmManualPayment = async (order) => {
        const loadingToast = toast.loading('جارٍ تأكيد التحويل...');
        try {
            await orderAPI.confirmPayment(order._id);
            toast.success('تم تأكيد الدفع وبدء التسليم', { id: loadingToast });
            setViewOrder(null);
            loadOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'تعذر تأكيد الدفع', { id: loadingToast });
        }
    };

    const confirmDevelopmentPayment = async (order) => {
        const loadingToast = toast.loading('جارٍ تأكيد الدفع التجريبي...');
        try {
            await orderAPI.updateStatus(order._id, 'paid');
            toast.success('تم تأكيد الدفع التجريبي', { id: loadingToast });
            loadOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'تعذر تأكيد الدفع التجريبي', { id: loadingToast });
        }
    };

    const openDeliveryTarget = (order) => {
        const contact = String(order.deliveryContact || '').trim();
        if (!contact) return toast.error('لا توجد بيانات تسليم لهذا الطلب');
        if (order.deliveryMethod === 'whatsapp') {
            window.open(`https://wa.me/${contact.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
            return;
        }
        const subject = encodeURIComponent(`بيانات الاشتراك - الطلب ${order.orderNumber || ''}`);
        const body = encodeURIComponent('مرحبًا،\n\nبيانات اشتراكك مرفقة في هذه الرسالة.\n\nشكرًا لاختيارك متجرنا.');
        window.location.href = `mailto:${contact}?subject=${subject}&body=${body}`;
    };

    const handleFulfillRequest = async (e) => {
        e.preventDefault();

        if (false && fulfillmentType === 'manual_code') {
            const items = selectedOrder.items || [];
            
            const missing = items.some((item, idx) =>
                Array.from({ length: item.quantity }).some((_, qIdx) => !manualCodes[`${idx}_${qIdx}`]?.trim())
            );
            if (missing) return toast.error('يرجى إدخال رمز لكل كمية من المنتجات');
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('جارٍ التنفيذ...');
        try {
            const items = selectedOrder.items || [];
            // codesArray = array of arrays, كل item فيها array بالكودات حسب الـ quantity
            const codesArray = items.map((item, idx) =>
                Array.from({ length: item.quantity }).map((_, qIdx) => manualCodes[`${idx}_${qIdx}`] || '')
            );

            if (false && fulfillmentType === 'manual_account' && (!accountEmail.trim() || !accountPassword.trim())) {
                return toast.error('يرجى إدخال بريد الحساب وكلمة المرور');
            }
            await orderAPI.confirmAndSend(selectedOrder._id, {
                deliveryMode: 'manual',
                fulfillmentType,
                deliveryConfirmed: true,
                manualCodesPerItem: codesArray,
                deliveredEmail: accountEmail,
                deliveredPassword: accountPassword,
                deliveredCode: codesArray[0]?.[0] || '',
            });
            toast.success('تم تنفيذ الطلب بنجاح', { id: loadingToast });
            setSelectedOrder(null);
            setManualCodes({});
            setDeliveryMode('manual');
            setFulfillmentType('manual_code');
            setAccountEmail('');
            setAccountPassword('');
            loadOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'تعذر تنفيذ الطلب', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div dir="rtl" className="pt-24 pb-16 min-h-screen bg-[#080808] text-zinc-200 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-zinc-500 mb-1">إجمالي الطلبات</p>
                        <p className="text-3xl font-semibold text-white">{total}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-zinc-500 mb-1">الطلبات المعروضة</p>
                        <p className="text-3xl font-semibold text-white">{orders.length}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-zinc-500 mb-1">حالة النظام</p>
                        <p className="text-3xl font-semibold text-emerald-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> يعمل
                        </p>
                    </div>
                </div>

                {/* Header & Filter */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight">إدارة الطلبات</h1>
                    <select 
                        value={status} 
                        onChange={e => { setStatus(e.target.value); setPage(1); }} 
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-zinc-700 transition-all"
                    >
                        <option value="">كل الحالات</option>
                        <option value="PENDING_PAYMENT">بانتظار التحويل</option>
                        <option value="paid_unconfirmed">بانتظار التأكيد</option>
                        <option value="completed">مكتمل</option>
                        <option value="failed">فشل</option>
                    </select>
                    <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }} className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-2 text-sm outline-none">
                        <option value="">All payment states</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option>
                    </select>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search order number" className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-2 text-sm outline-none" />
                </div>

                {/* Table */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">رقم الطلب</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">العميل</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">طريقة التسليم</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">الحالة</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal text-right">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-20 text-center text-zinc-600 text-sm">جارٍ تحديث البيانات...</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order._id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-5 text-sm text-zinc-400 font-mono">#{order.orderNumber?.slice(-6).toUpperCase()}</td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-medium text-white">{order.user?.name || 'زائر'}</p>
                                            <p className="text-[11px] text-zinc-500">{order.user?.email}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-indigo-300">{order.deliveryMethod === 'whatsapp' ? 'واتساب' : 'البريد الإلكتروني'}</p>
                                            <p dir="ltr" className="mt-1 max-w-[190px] truncate text-[11px] text-zinc-400">{order.deliveryContact || 'غير محدد'}</p>
                                            {order.deliveryContact && <button onClick={() => openDeliveryTarget(order)} className="mt-2 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-300 hover:bg-indigo-500/25">{order.deliveryMethod === 'whatsapp' ? 'فتح واتساب' : 'فتح البريد'}</button>}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-md border ${STATUS_STYLES[order.status] || 'bg-zinc-800 text-zinc-400'}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setViewOrder(order)} className="p-2 text-zinc-400 hover:text-white transition-colors" title="عرض التفاصيل">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                {['PENDING_PAYMENT', 'pending'].includes(order.status) && order.paymentStatus !== 'PAID' && (
                                                    <button onClick={() => confirmManualPayment(order)} className="bg-emerald-500 text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors">
                                                        تأكيد التحويل
                                                    </button>
                                                )}
                                                {process.env.REACT_APP_ALLOW_DEV_PAYMENT === 'true' && ['PENDING_PAYMENT', 'pending'].includes(order.status) && (
                                                    <button onClick={() => confirmDevelopmentPayment(order)} className="bg-amber-500 text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors">
                                                        تأكيد دفع تجريبي
                                                    </button>
                                                )}
                                                {['paid_unconfirmed', 'failed'].includes(order.status) && (
                                                    <button onClick={() => { setSelectedOrder(order); setManualCodes({}); setDeliveryMode('manual'); setFulfillmentType('manual_code'); setAccountEmail(''); setAccountPassword(''); }} className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors">
                                                        تنفيذ الطلب
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center px-2">
                    <span className="text-xs text-zinc-500 font-medium">صفحة {page} من {totalPages}</span>
                    <div className="flex gap-8">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-sm font-bold text-zinc-400 disabled:opacity-20 hover:text-white transition-colors flex items-center gap-2">السابق</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-sm font-bold text-zinc-400 disabled:opacity-20 hover:text-white transition-colors flex items-center gap-2">التالي</button>
                    </div>
                </div>
            </div>

            {/* Modal: View Order Details */}
            {viewOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
                    <div className="absolute inset-0" onClick={() => setViewOrder(null)} />
                    <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-white">تفاصيل الطلب</h2>
                                <p className="text-xs text-zinc-500 mt-1">المرجع: #{viewOrder.orderNumber?.toUpperCase()}</p>
                            </div>
                            <button onClick={() => setViewOrder(null)} className="text-zinc-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {viewOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-black/20 border border-zinc-800 rounded-2xl">
                                    <div className="w-14 h-14 bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
                                        {getImageUrl(item.product?.image) ? (
                                            <img src={getImageUrl(item.product?.image)} className="w-full h-full object-cover" alt="" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-white">{item.product?.name || 'منتج رقمي'}</p>
                                        <p className="text-xs text-zinc-500">الكمية: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
                            {viewOrder.selectedPaymentAccount && (
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                                    <p className="mb-2 font-bold text-white">حساب التحويل</p>
                                    <p>{viewOrder.selectedPaymentAccount.label} · {viewOrder.selectedPaymentAccount.accountName}</p>
                                    <p dir="ltr">{viewOrder.selectedPaymentAccount.accountNumber || viewOrder.selectedPaymentAccount.iban}</p>
                                </div>
                            )}
                            {viewOrder.paymentProofUrl && (
                                <a href={viewOrder.paymentProofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10">
                                    <img src={viewOrder.paymentProofUrl} alt="إثبات التحويل" className="max-h-64 w-full object-contain bg-black" />
                                </a>
                            )}
                            <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-zinc-500 font-normal">Total Settlement</p>
                                <p className="text-2xl font-bold text-white">${viewOrder.totalAmount?.toFixed(2)}</p>
                            </div>
                            {['PENDING_PAYMENT', 'pending'].includes(viewOrder.status) && viewOrder.paymentStatus !== 'PAID' && (
                                <button onClick={() => confirmManualPayment(viewOrder)} className="bg-emerald-500 text-black px-8 py-3 rounded-xl font-bold text-sm">تأكيد التحويل</button>
                            )}
                            {['paid_unconfirmed', 'failed'].includes(viewOrder.status) && (
                                <button 
                                    onClick={() => { setViewOrder(null); setSelectedOrder(viewOrder); setManualCodes({}); setDeliveryMode('manual'); setFulfillmentType('manual_code'); setAccountEmail(''); setAccountPassword(''); }}
                                    className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                                >
                                    Proceed to Delivery
                                </button>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Fulfill Order */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
                    <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-2">تنفيذ الطلب</h2>
                        <p className="text-zinc-500 text-sm mb-8 font-medium">
                            إرسال المنتج الرقمي إلى {selectedOrder.user?.name}
                        </p>
                        
                        <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm">
                            <p className="mb-2 font-bold text-white">طريقة التسليم المطلوبة</p>
                            <p className="text-zinc-300">{selectedOrder.deliveryMethod === 'whatsapp' ? 'واتساب' : 'البريد الإلكتروني'}: <span dir="ltr" className="font-mono">{selectedOrder.deliveryContact}</span></p>
                            <p className="mt-1 text-xs text-zinc-500">التواصل والتسليم يتمان يدويًا من الأدمن.</p>
                        </div>
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => { setFulfillmentType('manual_code'); setManualCodes({}); }} className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${fulfillmentType === 'manual_code' ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>تسليم كود</button>
                            <button type="button" onClick={() => { setFulfillmentType('manual_account'); setManualCodes({}); }} className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${fulfillmentType === 'manual_account' ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>تسليم حساب</button>
                        </div>
                        <div style={{ display: 'none' }}>
                            <button
                                type="button"
                                onClick={() => { setDeliveryMode('database'); setManualCodes({}); }}
                                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${deliveryMode === 'database' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                            >
                                📦 مخزون قاعدة البيانات
                            </button>
                            <button
                                type="button"
                                onClick={() => { setDeliveryMode('manual'); setManualCodes({}); }}
                                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${deliveryMode === 'manual' ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                            >
                                ✋ Manual Entry
                            </button>
                        </div>

                        <form onSubmit={handleFulfillRequest} className="space-y-6">
                            {false && deliveryMode === 'manual' && fulfillmentType === 'manual_code' && (
                                <div className="space-y-4">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="bg-black/30 border border-zinc-800 rounded-2xl p-4">
                                            {/* Item Header */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                                    {getImageUrl(item.product?.image) ? (
                                                        <img src={getImageUrl(item.product?.image)} className="w-full h-full object-cover" alt="" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{item.product?.name || 'Digital Product'}</p>
                                                    <p className="text-[11px] text-zinc-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            {/* Code Textarea per quantity unit */}
                                            {Array.from({ length: item.quantity }).map((_, qIdx) => (
                                                <div key={qIdx} className={qIdx > 0 ? 'mt-3' : ''}>
                                                    <label className="text-xs font-bold text-amber-400 mb-2 block">
                                                        {item.quantity > 1
                                                            ? `Code ${qIdx + 1} of ${item.quantity} — ${item.product?.name || 'Item'}`
                                                            : `Code for ${item.product?.name || 'this item'}`}
                                                    </label>
                                                    <textarea
                                                        required
                                                        autoFocus={idx === 0 && qIdx === 0}
                                                        value={manualCodes[`${idx}_${qIdx}`] || ''}
                                                        onChange={(e) => setManualCodes(prev => ({ ...prev, [`${idx}_${qIdx}`]: e.target.value }))}
                                                        placeholder={`Paste redeem code #${qIdx + 1} for ${item.product?.name || 'this item'}...`}
                                                        className="w-full bg-black border border-zinc-700 rounded-xl p-4 font-mono text-sm outline-none focus:border-amber-500 transition-all text-white resize-none"
                                                        rows={3}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {false && deliveryMode === 'database' && (
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                    <p className="text-sm text-emerald-500 font-medium">✓ Codes will be automatically sent from database inventory</p>
                                    <p className="text-[11px] text-zinc-500 mt-2">Make sure there are available codes in stock for this product.</p>
                                </div>
                            )}

                            {false && fulfillmentType === 'manual_account' && (
                                <div className="space-y-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                                    <p className="text-sm font-bold text-indigo-300">بيانات الحساب الذي سيتم تسليمه</p>
                                    <input required value={accountEmail} onChange={event => setAccountEmail(event.target.value)} type="email" placeholder="البريد الإلكتروني للحساب" dir="ltr" className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-left text-white outline-none focus:border-indigo-500" />
                                    <input required value={accountPassword} onChange={event => setAccountPassword(event.target.value)} type="text" placeholder="كلمة المرور" dir="ltr" className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-left text-white outline-none focus:border-indigo-500" />
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all">
                                    {isSubmitting ? 'جارٍ تسجيل التسليم...' : 'تسجيل التسليم'}
                                </button>
                                <button type="button" onClick={() => setSelectedOrder(null)} className="px-6 bg-zinc-800 text-zinc-400 font-bold py-4 rounded-xl">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
