import React, { useState, useEffect, useRef } from 'react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';

const STATUS_STYLES = {
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
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10; 
    
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const [viewOrder, setViewOrder] = useState(null);         
    
    const [manualCodes, setManualCodes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState('database');

    useEffect(() => { loadOrders(); }, [status, page]);

    
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
            const res = await orderAPI.getAll(params);
            setOrders(res.data.orders);
            setTotal(res.data.total);

            const unconfirmedCount = res.data.orders.filter(o => o.status === 'paid_unconfirmed').length;
            if (unconfirmedCount > 0 && page === 1) {
                toast(`You have ${unconfirmedCount} orders awaiting confirmation`, {
                    icon: '🔔',
                    style: { borderRadius: '12px', background: '#fff', color: '#000', fontSize: '14px', fontWeight: '500' },
                    duration: 5000
                });
            }
        } catch { 
            toast.error('Failed to sync with server'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleFulfillRequest = async (e) => {
        e.preventDefault();

        if (deliveryMode === 'manual') {
            const items = selectedOrder.items || [];
            
            const missing = items.some((item, idx) =>
                Array.from({ length: item.quantity }).some((_, qIdx) => !manualCodes[`${idx}_${qIdx}`]?.trim())
            );
            if (missing) return toast.error('Please enter a code for every item quantity');
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Processing...');
        try {
            const items = selectedOrder.items || [];
            // codesArray = array of arrays, كل item فيها array بالكودات حسب الـ quantity
            const codesArray = items.map((item, idx) =>
                Array.from({ length: item.quantity }).map((_, qIdx) => manualCodes[`${idx}_${qIdx}`] || '')
            );

            await orderAPI.confirmAndSend(selectedOrder._id, { 
                deliveryMode,
                manualCodesPerItem: codesArray,
               
                deliveredCode: codesArray[0]?.[0] || '',
            });
            toast.success('Order fulfilled successfully', { id: loadingToast });
            setSelectedOrder(null);
            setManualCodes({});
            setDeliveryMode('database');
            loadOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fulfill order', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="pt-24 pb-16 min-h-screen bg-[#080808] text-zinc-200 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-zinc-500 mb-1">Total Orders</p>
                        <p className="text-3xl font-semibold text-white">{total}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-zinc-500 mb-1">Orders Shown</p>
                        <p className="text-3xl font-semibold text-white">{orders.length}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-zinc-500 mb-1">System Status</p>
                        <p className="text-3xl font-semibold text-emerald-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live
                        </p>
                    </div>
                </div>

                {/* Header & Filter */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Order Management</h1>
                    <select 
                        value={status} 
                        onChange={e => { setStatus(e.target.value); setPage(1); }} 
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-zinc-700 transition-all"
                    >
                        <option value="">All Statuses</option>
                        <option value="paid_unconfirmed">Pending Confirmation</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">Order ID</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">Customer</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal">Status</th>
                                    <th className="px-8 py-4 text-xs font-semibold text-zinc-500 tracking-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-20 text-center text-zinc-600 text-sm">Syncing with registry...</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order._id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-5 text-sm text-zinc-400 font-mono">#{order.orderNumber?.slice(-6).toUpperCase()}</td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-medium text-white">{order.user?.name || 'Guest'}</p>
                                            <p className="text-[11px] text-zinc-500">{order.user?.email}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-md border ${STATUS_STYLES[order.status]}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setViewOrder(order)} className="p-2 text-zinc-400 hover:text-white transition-colors" title="View Details">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                {['paid_unconfirmed', 'failed'].includes(order.status) && (
                                                    <button onClick={() => { setSelectedOrder(order); setManualCodes({}); setDeliveryMode('database'); }} className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors">
                                                        Fulfill
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
                    <span className="text-xs text-zinc-500 font-medium">Page {page} of {totalPages}</span>
                    <div className="flex gap-8">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-sm font-bold text-zinc-400 disabled:opacity-20 hover:text-white transition-colors flex items-center gap-2">&larr; Previous</button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-sm font-bold text-zinc-400 disabled:opacity-20 hover:text-white transition-colors flex items-center gap-2">Next &rarr;</button>
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
                                <h2 className="text-xl font-bold text-white">Order Details</h2>
                                <p className="text-xs text-zinc-500 mt-1">Ref: #{viewOrder.orderNumber?.toUpperCase()}</p>
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
                                        <p className="text-sm font-semibold text-white">{item.product?.name || 'Digital Product'}</p>
                                        <p className="text-xs text-zinc-500">Quantity: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-zinc-500 font-normal">Total Settlement</p>
                                <p className="text-2xl font-bold text-white">${viewOrder.totalAmount?.toFixed(2)}</p>
                            </div>
                            {['paid_unconfirmed', 'failed'].includes(viewOrder.status) && (
                                <button 
                                    onClick={() => { setViewOrder(null); setSelectedOrder(viewOrder); setManualCodes({}); setDeliveryMode('database'); }} 
                                    className="bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                                >
                                    Proceed to Delivery
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Fulfill Order */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
                    <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-2">Fulfill Order</h2>
                        <p className="text-zinc-500 text-sm mb-8 font-medium">
                            Sending digital asset to {selectedOrder.user?.name}
                        </p>
                        
                        {/* Delivery Mode Selector */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => { setDeliveryMode('database'); setManualCodes({}); }}
                                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${deliveryMode === 'database' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                            >
                                📦 Database Stock
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
                            {deliveryMode === 'manual' && (
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

                            {deliveryMode === 'database' && (
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                    <p className="text-sm text-emerald-500 font-medium">✓ Codes will be automatically sent from database inventory</p>
                                    <p className="text-[11px] text-zinc-500 mt-2">Make sure there are available codes in stock for this product.</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all">
                                    {isSubmitting ? 'Sending...' : 'Deliver to Client'}
                                </button>
                                <button type="button" onClick={() => setSelectedOrder(null)} className="px-6 bg-zinc-800 text-zinc-400 font-bold py-4 rounded-xl">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}