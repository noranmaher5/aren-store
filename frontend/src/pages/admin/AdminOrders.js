import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, orderAPI } from '../../services/api';
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

const STATUS_LABELS = {
    PENDING_PAYMENT: 'بانتظار التحويل',
    paid_unconfirmed: 'بانتظار التأكيد',
    pending: 'قيد الانتظار',
    paid: 'مدفوع',
    processing: 'قيد المعالجة',
    completed: 'مكتمل',
    failed: 'فشل',
    refunded: 'مسترد',
    cancelled: 'ملغي',
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex max-w-full truncate text-[10px] px-2.5 py-1 rounded-md border ${STATUS_STYLES[status] || 'bg-zinc-800 text-zinc-400'}`}>
            {STATUS_LABELS[status] || status?.replace('_', ' ')}
        </span>
    );
}

function OrderActions({ order, stacked, onView, onConfirmPayment, onFulfill }) {
    const wrap = stacked
        ? 'flex flex-col gap-2 w-full'
        : 'flex flex-wrap justify-end items-center gap-2';
    const actionBtn = stacked ? 'w-full text-center' : '';

    return (
        <div className={wrap}>
            <button type="button" onClick={() => onView(order)} className={stacked ? `${actionBtn} bg-zinc-800 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors` : 'p-2 text-zinc-400 hover:text-white transition-colors'} title="عرض التفاصيل">
                {stacked ? 'عرض التفاصيل' : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
            </button>
            {['PENDING_PAYMENT', 'pending'].includes(order.status) && order.paymentStatus !== 'PAID' && (
                <button type="button" onClick={() => onConfirmPayment(order)} className={`${actionBtn} bg-emerald-500 text-black text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-emerald-400 transition-colors`}>
                    تأكيد التحويل
                </button>
            )}
            {['paid_unconfirmed', 'failed'].includes(order.status) && (
                <button type="button" onClick={() => onFulfill(order)} className={`${actionBtn} bg-white text-black text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors`}>
                    تنفيذ الطلب
                </button>
            )}
        </div>
    );
}

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

    const openDeliveryTarget = async (order) => {
        const contact = String(order.deliveryContact || '').trim();
        if (!contact) return toast.error('No delivery contact for this order');
        const popup = order.deliveryMethod === 'whatsapp' ? window.open('', '_blank') : null;
        try {
            const response = await orderAPI.getOne(order._id);
            const fullOrder = response.data.order || order;
            const itemCodes = (fullOrder.items || []).flatMap(item =>
                (item.codes || []).map(code => code?.code || code).filter(Boolean)
            );
            const delivered = fullOrder.deliveredData || {};
            const deliveredCodes = Array.isArray(delivered.codes)
                ? delivered.codes.filter(Boolean)
                : [delivered.code || delivered.key].filter(Boolean);
            const codes = [...new Set([...itemCodes, ...deliveredCodes])];
            const codeLines = codes.length
                ? codes.map((code, index) => `${index + 1}. ${code}`).join('\n')
                : 'Codes are not recorded yet';
            const settingsResponse = await adminAPI.getDashboard();
            const template = settingsResponse.data?.stats?.deliveryMessage || 'مرحبًا،\nتم تنفيذ طلبك بنجاح. رقم الطلب: {orderNumber}\n\nالأكواد الرقمية:\n{codes}\n\nشكرًا لاختياركم.';
            const message = template
                .replaceAll('{orderNumber}', fullOrder.orderNumber || order.orderNumber || '')
                .replaceAll('{codes}', codeLines)
                .replaceAll('{customerName}', fullOrder.user?.name || order.user?.name || ''); /*
                '\u0645\u0631\062d\0628\u0627\u060c',
                '\u062a\0645 \u062a\0646\0641\u064a\0630 \u0637\0644\0628\0643 \u0628\0646\062c\0627\u062d.',
                `\u0631\0642\u0645 \u0627\u0644\u0637\u0644\u0628: ${fullOrder.orderNumber || order.orderNumber || ''}`,
                '',
                '\u0627\u0644\u0623\u0643\u0648\u0627\u062f \u0627\u0644\u0631\u0642\u0645\u064a\u0629:',
                codeLines,
                '',
                '\u0634\u0643\u0631\u0627\u064b \u0644\u0627\u062e\u062a\u064a\u0627\u0631\u0643\u0645.'
            */
            if (order.deliveryMethod === 'whatsapp') {
                const url = `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                if (popup) popup.location.href = url;
                else window.open(url, '_blank', 'noopener,noreferrer');
                return;
            }
            const subject = encodeURIComponent(`Order details - ${fullOrder.orderNumber || ''}`); /*
            */
            window.location.href = `mailto:${contact}?subject=${subject}&body=${encodeURIComponent(message)}`;
        } catch (error) {
            if (popup) popup.close();
            toast.error('Unable to load order delivery data');
        }
        return;
        /*
        const legacyContact = String(order.deliveryContact || '').trim();
        if (!contact) return toast.error('لا توجد بيانات تسليم لهذا الطلب');
        if (order.deliveryMethod === 'whatsapp') {
            window.open(`https://wa.me/${contact.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
            return;
        }
        const subject = encodeURIComponent(`بيانات الاشتراك - الطلب ${order.orderNumber || ''}`);
        const body = encodeURIComponent('مرحبًا،\n\nبيانات اشتراكك مرفقة في هذه الرسالة.\n\nشكرًا لاختيارك متجرنا.');
        window.location.href = `mailto:${contact}?subject=${subject}&body=${body}`;
        */
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

    const startFulfill = (order) => {
        setSelectedOrder(order);
        setManualCodes({});
        setDeliveryMode('manual');
        setFulfillmentType('manual_code');
        setAccountEmail('');
        setAccountPassword('');
    };

    const filterClass = 'w-full min-w-0 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zinc-600 transition-all';

    return (
        <div dir="rtl" className="pt-32 sm:pt-36 pb-24 sm:pb-16 min-h-screen bg-[#080808] text-zinc-200 font-sans overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-10">
                    <div className="bg-zinc-900/50 border border-white/5 p-4 sm:p-6 rounded-2xl min-w-0">
                        <p className="text-xs text-zinc-500 mb-1">إجمالي الطلبات</p>
                        <p className="text-2xl sm:text-3xl font-semibold text-white">{total}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-4 sm:p-6 rounded-2xl min-w-0">
                        <p className="text-xs text-zinc-500 mb-1">الطلبات المعروضة</p>
                        <p className="text-2xl sm:text-3xl font-semibold text-white">{orders.length}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-4 sm:p-6 rounded-2xl min-w-0">
                        <p className="text-xs text-zinc-500 mb-1">حالة النظام</p>
                        <p className="text-xl sm:text-3xl font-semibold text-emerald-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" /> يعمل
                        </p>
                    </div>
                </div>

                {/* Header & Filter */}
                <div className="mb-6 sm:mb-8 space-y-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">إدارة الطلبات</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); setPage(1); }}
                            className={filterClass}
                        >
                            <option value="">كل الحالات</option>
                            <option value="PENDING_PAYMENT">بانتظار التحويل</option>
                            <option value="paid_unconfirmed">بانتظار التأكيد</option>
                            <option value="completed">مكتمل</option>
                            <option value="failed">فشل</option>
                        </select>
                        <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }} className={filterClass}>
                            <option value="">كل حالات الدفع</option>
                            <option value="PENDING">قيد الانتظار</option>
                            <option value="PAID">مدفوع</option>
                            <option value="FAILED">فشل</option>
                            <option value="REFUNDED">مسترد</option>
                        </select>
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث برقم الطلب" className={`${filterClass} sm:col-span-2 lg:col-span-1`} />
                    </div>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3 mb-6">
                    {loading ? (
                        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-12 text-center text-zinc-600 text-sm">جارٍ تحديث البيانات...</div>
                    ) : orders.length === 0 ? (
                        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-12 text-center text-zinc-600 text-sm">لا توجد طلبات</div>
                    ) : orders.map(order => (
                        <article key={order._id} className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-zinc-400 font-mono">#{order.orderNumber?.slice(-6).toUpperCase()}</p>
                                <StatusBadge status={order.status} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{order.user?.name || 'زائر'}</p>
                                <p className="text-[11px] text-zinc-500 break-all">{order.user?.email}</p>
                            </div>
                            <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                                <p className="text-xs font-bold text-indigo-300">{order.deliveryMethod === 'whatsapp' ? 'واتساب' : 'البريد الإلكتروني'}</p>
                                <p dir="ltr" className="mt-1 text-[11px] text-zinc-400 break-all text-left">{order.deliveryContact || 'غير محدد'}</p>
                                {order.deliveryContact && (
                                    <button type="button" onClick={() => openDeliveryTarget(order)} className="mt-2 rounded-lg bg-indigo-500/15 px-2.5 py-1.5 text-[10px] font-bold text-indigo-300 hover:bg-indigo-500/25">
                                        {order.deliveryMethod === 'whatsapp' ? 'فتح واتساب' : 'فتح البريد'}
                                    </button>
                                )}
                            </div>
                            <OrderActions
                                order={order}
                                stacked
                                onView={setViewOrder}
                                onConfirmPayment={confirmManualPayment}
                                onFulfill={startFulfill}
                            />
                        </article>
                    ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-5 xl:px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">رقم الطلب</th>
                                    <th className="px-5 xl:px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">العميل</th>
                                    <th className="px-5 xl:px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">طريقة التسليم</th>
                                    <th className="px-5 xl:px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">الحالة</th>
                                    <th className="px-5 xl:px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-20 text-center text-zinc-600 text-sm">جارٍ تحديث البيانات...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="5" className="p-20 text-center text-zinc-600 text-sm">لا توجد طلبات</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order._id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-5 xl:px-8 py-5 text-sm text-zinc-400 font-mono">#{order.orderNumber?.slice(-6).toUpperCase()}</td>
                                        <td className="px-5 xl:px-8 py-5">
                                            <p className="text-sm font-medium text-white">{order.user?.name || 'زائر'}</p>
                                            <p className="text-[11px] text-zinc-500">{order.user?.email}</p>
                                        </td>
                                        <td className="px-5 xl:px-8 py-5">
                                            <p className="text-xs font-bold text-indigo-300">{order.deliveryMethod === 'whatsapp' ? 'واتساب' : 'البريد الإلكتروني'}</p>
                                            <p dir="ltr" className="mt-1 max-w-[190px] truncate text-[11px] text-zinc-400">{order.deliveryContact || 'غير محدد'}</p>
                                            {order.deliveryContact && <button type="button" onClick={() => openDeliveryTarget(order)} className="mt-2 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-300 hover:bg-indigo-500/25">{order.deliveryMethod === 'whatsapp' ? 'فتح واتساب' : 'فتح البريد'}</button>}
                                        </td>
                                        <td className="px-5 xl:px-8 py-5">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-5 xl:px-8 py-5">
                                            <OrderActions
                                                order={order}
                                                onView={setViewOrder}
                                                onConfirmPayment={confirmManualPayment}
                                                onFulfill={startFulfill}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center gap-3 px-1">
                    <span className="text-xs text-zinc-500 font-medium">صفحة {page} من {totalPages || 1}</span>
                    <div className="flex gap-4 sm:gap-8">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-sm font-bold text-zinc-400 disabled:opacity-20 hover:text-white transition-colors min-h-[44px] px-2">السابق</button>
                        <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="text-sm font-bold text-zinc-400 disabled:opacity-20 hover:text-white transition-colors min-h-[44px] px-2">التالي</button>
                    </div>
                </div>
            </div>

            {/* Modal: View Order Details */}
            {viewOrder && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-black/40">
                    <div className="absolute inset-0" onClick={() => setViewOrder(null)} />
                    <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
                        <div className="flex justify-between items-start gap-3 mb-6 sm:mb-8">
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-white">تفاصيل الطلب</h2>
                                <p className="text-xs text-zinc-500 mt-1 break-all">المرجع: #{viewOrder.orderNumber?.toUpperCase()}</p>
                            </div>
                            <button type="button" onClick={() => setViewOrder(null)} className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[36vh] overflow-y-auto custom-scrollbar">
                            {viewOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-black/20 border border-zinc-800 rounded-2xl min-w-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
                                        {getImageUrl(item.product?.image) ? (
                                            <img src={getImageUrl(item.product?.image)} className="w-full h-full object-cover" alt="" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{item.product?.name || item.productName || item.name || 'منتج رقمي'}</p>
                                        {(item.attributes?.optionName || item.selectedOption?.name) && <p className="mt-1 text-xs font-bold text-indigo-300">الباقة: {item.attributes?.optionName || item.selectedOption?.name}</p>}
                                        <p className="text-xs text-zinc-500">الكمية: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-white shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 sm:mt-8 pt-6 border-t border-zinc-800 space-y-4">
                            {viewOrder.selectedPaymentAccount && (
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 break-words">
                                    <p className="mb-2 font-bold text-white">حساب التحويل</p>
                                    <p>{viewOrder.selectedPaymentAccount.label} · {viewOrder.selectedPaymentAccount.accountName}</p>
                                    <p dir="ltr" className="text-left break-all">{viewOrder.selectedPaymentAccount.accountNumber || viewOrder.selectedPaymentAccount.iban}</p>
                                </div>
                            )}
                            {viewOrder.paymentProofUrl && (
                                <a href={viewOrder.paymentProofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10">
                                    <img src={viewOrder.paymentProofUrl} alt="إثبات التحويل" className="max-h-52 sm:max-h-64 w-full object-contain bg-black" />
                                </a>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <p className="text-xs text-zinc-500 font-normal">إجمالي التسوية</p>
                                <p className="text-2xl font-bold text-white">${viewOrder.totalAmount?.toFixed(2)}</p>
                            </div>
                            {['PENDING_PAYMENT', 'pending'].includes(viewOrder.status) && viewOrder.paymentStatus !== 'PAID' && (
                                <button type="button" onClick={() => confirmManualPayment(viewOrder)} className="w-full sm:w-auto bg-emerald-500 text-black px-6 sm:px-8 py-3 rounded-xl font-bold text-sm">تأكيد التحويل</button>
                            )}
                            {['paid_unconfirmed', 'failed'].includes(viewOrder.status) && (
                                <button 
                                    type="button"
                                    onClick={() => { setViewOrder(null); startFulfill(viewOrder); }}
                                    className="w-full sm:w-auto bg-white text-black px-6 sm:px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                                >
                                    متابعة التسليم
                                </button>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Fulfill Order */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-xl bg-black/60">
                    <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-white/5 rounded-t-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 shadow-2xl max-h-[92vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">تنفيذ الطلب</h2>
                        <p className="text-zinc-500 text-sm mb-6 sm:mb-8 font-medium">
                            إرسال المنتج الرقمي إلى {selectedOrder.user?.name}
                        </p>
                        
                        <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm">
                            <p className="mb-2 font-bold text-white">طريقة التسليم المطلوبة</p>
                            <p className="text-zinc-300 break-words">{selectedOrder.deliveryMethod === 'whatsapp' ? 'واتساب' : 'البريد الإلكتروني'}: <span dir="ltr" className="font-mono break-all">{selectedOrder.deliveryContact}</span></p>
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

                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all">
                                    {isSubmitting ? 'جارٍ تسجيل التسليم...' : 'تسجيل التسليم'}
                                </button>
                                <button type="button" onClick={() => setSelectedOrder(null)} className="sm:px-6 bg-zinc-800 text-zinc-400 font-bold py-4 rounded-xl">
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
