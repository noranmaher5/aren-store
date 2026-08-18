import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');

  .ord-root {
    min-height: 100vh;
    background: #0B0E17;
    padding-top: 80px;
    padding-bottom: 64px;
    font-family: 'Outfit', sans-serif;
    color: #e8f0e0;
  }
  .ord-glass {
    background: rgba(255,255,255,0.03);
    border: 1px solid #252B3B;
    border-radius: 16px;
  }
  .ord-card {
    background: #141810;
    border: 1px solid #252B3B;
    border-radius: 16px;
    transition: border-color .2s, background .2s;
    text-decoration: none;
    display: block;
  }
  .ord-card:hover {
    border-color: #4F46E5;
    background: #161c11;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'Rajdhani', sans-serif;
    letter-spacing: .06em;
    text-transform: uppercase;
    border: 1px solid;
  }
  .code-box {
    background: #0e1209;
    border: 1px solid #252B3B;
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: border-color .2s;
  }
  .code-box:hover { border-color: #4F46E5; }
  .copy-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: rgba(86,114,69,0.12);
    border: 1px solid rgba(86,114,69,0.25);
    color: #8892A4;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; flex-shrink: 0;
  }
  .copy-btn:hover {
    background: rgba(86,114,69,0.25);
    border-color: #4F46E5;
    color: #A5B4FC;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin .7s linear infinite; }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fade-up { animation: fadeUp .35s ease both; }
`;

const STATUS_CONFIG = {
  paid_unconfirmed: { color:'#f97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.2)', dot:'#f97316', label:'بانتظار التأكيد' },
  pending:    { color:'#fbbf24', bg:'rgba(251,191,36,0.08)',   border:'rgba(251,191,36,0.2)',  dot:'#fbbf24', label:'قيد الانتظار'    },
  paid:       { color:'#60a5fa', bg:'rgba(96,165,250,0.08)',   border:'rgba(96,165,250,0.2)',  dot:'#60a5fa', label:'مدفوع'       },
  processing: { color:'#60a5fa', bg:'rgba(96,165,250,0.08)',   border:'rgba(96,165,250,0.2)',  dot:'#60a5fa', label:'قيد المعالجة' },
  pending_fulfillment: { color:'#efba42', bg:'rgba(239,186,66,0.08)', border:'rgba(239,186,66,0.2)', dot:'#efba42', label:'جارٍ تجهيز التسليم' },
  completed:  { color:'#6366F1', bg:'rgba(34,197,94,0.08)',    border:'rgba(34,197,94,0.2)',   dot:'#6366F1', label:'مكتمل'  },
  failed:     { color:'#f87171', bg:'rgba(248,113,113,0.08)',  border:'rgba(248,113,113,0.2)', dot:'#f87171', label:'فشل'     },
  refunded:   { color:'#8892A4', bg:'rgba(136,146,164,0.08)',  border:'rgba(136,146,164,0.2)',dot:'#8892A4', label:'مسترد'   },
  cancelled:  { color:'#f87171', bg:'rgba(248,113,113,0.08)',  border:'rgba(248,113,113,0.2)', dot:'#f87171', label:'ملغى'  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className="status-badge" style={{
      color: cfg.color, background: cfg.bg, borderColor: cfg.border
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, display:'inline-block' }} />
      {cfg.label}
    </span>
  );
};

// ── Orders List Page ──────────────────────────────────────────────────────────
export function OrdersPage() {
  const { format } = useCurrency();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(res => setOrders(res.data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <div className="ord-root">
      <style>{STYLES}</style>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 20px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:3, height:20, borderRadius:2, background:'#4F46E5' }} />
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:12, fontWeight:700,
              color:'#4a5a3a', letterSpacing:'.12em', textTransform:'uppercase' }}>
              Purchase History
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
              fontSize:30, color:'#e8f0e0', margin:0 }}>
              My Orders
              {orders.length > 0 && (
                <span style={{ fontSize:16, fontWeight:500, color:'#4a5a3a', marginLeft:10 }}>
                  ({orders.length})
                </span>
              )}
            </h1>
            <Link to="/products" style={{
              display:'inline-flex', alignItems:'center', gap:6,
              fontSize:13, color:'#8892A4', textDecoration:'none',
              padding:'8px 16px', borderRadius:8,
              border:'1px solid #252B3B', background:'#141810',
              fontFamily:'Outfit,sans-serif', transition:'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#4F46E5'; e.currentTarget.style.color='#A5B4FC'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#252B3B'; e.currentTarget.style.color='#8892A4'; }}>
              + New Purchase
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="fade-up" style={{
            display:'flex', gap:6, marginBottom:20,
            overflowX:'auto', paddingBottom:4,
          }}>
            {['all', 'completed', 'pending', 'failed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'6px 14px', borderRadius:8, border:'1px solid',
                fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
                fontFamily:'Rajdhani,sans-serif', letterSpacing:'.06em',
                textTransform:'uppercase', transition:'all .2s',
                borderColor: filter === f ? '#4F46E5' : '#252B3B',
                background:  filter === f ? 'rgba(86,114,69,0.12)' : '#141810',
                color:        filter === f ? '#A5B4FC' : '#4a5a3a',
              }}>
                {f === 'all' ? `All (${orders.length})` : f}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                height:80, borderRadius:16, background:'#141810',
                border:'1px solid #252B3B',
                animation:'fadeUp .3s ease both',
                animationDelay: `${i * 0.06}s`,
              }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="fade-up" style={{
            textAlign:'center', padding:'72px 0',
            display:'flex', flexDirection:'column', alignItems:'center', gap:16,
          }}>
            <div style={{
              width:64, height:64, borderRadius:18, background:'#141810',
              border:'1px solid #252B3B', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:28,
            }}>📦</div>
            <div>
              <h3 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                fontSize:22, color:'#e8f0e0', margin:'0 0 6px' }}>No orders yet</h3>
              <p style={{ fontSize:13, color:'#4a5a3a', margin:0 }}>
                Your purchase history will appear here
              </p>
            </div>
            <Link to="/products" style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'#4F46E5', color:'white', textDecoration:'none',
              padding:'11px 24px', borderRadius:10, fontSize:14,
              fontWeight:600, fontFamily:'Outfit,sans-serif',
              transition:'background .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='#658553'}
              onMouseLeave={e => e.currentTarget.style.background='#4F46E5'}>
              Start Shopping →
            </Link>
          </div>
        )}

        {/* No results after filter */}
        {!loading && orders.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <p style={{ color:'#4a5a3a', fontSize:14 }}>No {filter} orders found</p>
          </div>
        )}

        {/* Orders List */}
        {!loading && filtered.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((order, i) => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="ord-card fade-up"
                style={{ padding:'18px 20px', animationDelay:`${i * 0.04}s` }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>

                  {/* Icon */}
                  <div style={{
                    width:42, height:42, borderRadius:12, flexShrink:0,
                    background: order.status === 'completed'
                      ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${order.status === 'completed' ? 'rgba(34,197,94,0.2)' : '#252B3B'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                  }}>
                   {order.status === 'completed'        ? '✅' :
 order.status === 'failed'           ? '❌' :
 
 order.status === 'paid_unconfirmed' ? '🕐' : '📦'}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5, flexWrap:'wrap' }}>
                      <span style={{
                        fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                        fontSize:15, color:'#A5B4FC', letterSpacing:'.04em',
                      }}>
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p style={{
                      fontSize:12, color:'#4a5a3a', margin:'0 0 3px',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {order.items?.map(i => i.name || i.product?.name).filter(Boolean).join(', ') || 'Digital Products'}
                    </p>
                    <p style={{ fontSize:11, color:'#3a4a2a', margin:0 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year:'numeric', month:'short', day:'numeric',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </p>
                  </div>

                  {/* Amount + Arrow */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{
                      fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                      fontSize:20, color:'#e8f0e0', margin:'0 0 4px',
                    }}>
                      {format(order.totalAmount)}
                    </p>
                    <span style={{ fontSize:11, color:'#3a4a2a', display:'flex',
                      alignItems:'center', gap:3, justifyContent:'flex-end' }}>
                      View details
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Order Detail Page ─────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { format } = useCurrency();
  const { id } = useParams();
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showCodes, setShowCodes] = useState({});
  const [copied, setCopied]     = useState({});
  const [revealedCodes, setRevealedCodes] = useState({});

  const fetchOrder = () => {
    orderAPI.getOne(id)
      .then(res => setOrder(res.data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  
  useEffect(() => {
    if (!order || order.status !== 'paid_unconfirmed') return;
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const handleCopy = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopied(c => ({ ...c, [key]: true }));
    toast.success('تم نسخ الرمز');
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000);
  };

  const handleCopyAll = (item, idx) => {
    const allCodes = item.codes.map(c => c.code || c).join('\n');
    navigator.clipboard.writeText(allCodes);
    toast.success(`${item.codes.length} codes copied!`);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0B0E17', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <style>{STYLES}</style>
      <div style={{ width:36, height:36, border:'3px solid #4F46E5',
        borderTopColor:'transparent', borderRadius:'50' }} className="spin" />
    </div>
  );

  if (!order) return (
    <div style={{ minHeight:'100vh', background:'#0B0E17', display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      textAlign:'center', padding:24 }}>
      <style>{STYLES}</style>
      <div style={{ fontSize:56, marginBottom:16 }}>😕</div>
      <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26,
        color:'#e8f0e0', margin:'0 0 8px' }}>Order Not Found</h2>
      <Link to="/orders" style={{
        marginTop:16, background:'#4F46E5', color:'white',
        textDecoration:'none', padding:'11px 24px', borderRadius:10,
        fontSize:14, fontWeight:600, fontFamily:'Outfit,sans-serif',
      }}>Back to Orders</Link>
    </div>
  );

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="ord-root">
      <style>{STYLES}</style>
      <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 20px' }}>

        {/* Back */}
        <Link to="/orders" className="fade-up" style={{
          display:'inline-flex', alignItems:'center', gap:6,
          fontSize:13, color:'#4a5a3a', textDecoration:'none',
          marginBottom:20, fontFamily:'Outfit,sans-serif',
          transition:'color .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color='#8892A4'}
          onMouseLeave={e => e.currentTarget.style.color='#4a5a3a'}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to orders
        </Link>

        {/* Header Card */}
        <div className="ord-glass fade-up" style={{ padding:'24px 28px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start',
            justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <p style={{ fontSize:11, fontWeight:600, color:'#4a5a3a',
                fontFamily:'Rajdhani,sans-serif', letterSpacing:'.1em',
                textTransform:'uppercase', margin:'0 0 6px' }}>Order Details</p>
              <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                fontSize:26, color:'#e8f0e0', margin:'0 0 8px' }}>
                {order.orderNumber}
              </h1>
              <p style={{ fontSize:12, color:'#4a5a3a', margin:0 }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year:'numeric', month:'long', day:'numeric',
                  hour:'2-digit', minute:'2-digit'
                })}
              </p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              <StatusBadge status={order.status} />
              <p style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                fontSize:28, color:'#e8f0e0', margin:0 }}>
                {format(order.totalAmount)}
              </p>
              <p style={{ fontSize:11, color:'#4a5a3a', margin:0, textTransform:'capitalize' }}>
                via {order.paymentMethod}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Banner */}
        {order.status === 'completed' && (
          <div className="fade-up" style={{
            background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.2)',
            borderRadius:14, padding:'14px 20px', marginBottom:20,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              flexShrink:0,
            }}>✅</div>
            <div>
              <p style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                fontSize:15, color:'#6366F1', margin:'0 0 2px' }}>
                Order Fulfilled Successfully!
              </p>
              <p style={{ fontSize:12, color:'#4a6a4a', margin:0 }}>
                Your digital codes are ready below
                {order.emailSent && ' and have been sent to your email'}
              </p>
            </div>
          </div>
        )}
        {/* Awaiting Confirmation Banner */}
{order.status === 'paid_unconfirmed' && (
  <div className="fade-up" style={{
    background:'rgba(249,115,22,0.05)', border:'1px solid rgba(249,115,22,0.2)',
    borderRadius:14, padding:'14px 20px', marginBottom:20,
    display:'flex', alignItems:'center', gap:12,
  }}>
    <div style={{
      width:36, height:36, borderRadius:10,
      background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
      flexShrink:0,
    }}>🕐</div>
    <div>
      <p style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
        fontSize:15, color:'#f97316', margin:'0 0 2px' }}>
        Payment Received — Awaiting Confirmation
      </p>
      <p style={{ fontSize:12, color:'#6a4a2a', margin:0 }}>
        Your order is being reviewed. Codes will appear here once confirmed.
      </p>
    </div>
  </div>
)}

        {/* Items */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
          {order.items?.map((item, idx) => (
            <div key={idx} className="ord-glass fade-up"
              style={{ padding:'20px 24px', animationDelay:`${idx * 0.06}s` }}>

              {/* Item Header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom: item.codes?.length ? 16 : 0 }}>
                <img
                  src={item.image || `https://placehold.co/52x52/141810/567245?text=${(item.name||'?')[0]}`}
                  alt={item.name}
                  style={{ width:52, height:52, borderRadius:12, objectFit:'cover',
                    flexShrink:0, border:'1px solid #252B3B' }}
                  onError={e => { e.target.src=`https://placehold.co/52x52/141810/567245?text=${(item.name||'?')[0]}`; }}
                />
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:600,
                    fontSize:15, color:'#e8f0e0', margin:'0 0 4px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.name || item.product?.name}
                  </h3>
                  <p style={{ fontSize:12, color:'#4a5a3a', margin:0 }}>
                    Qty: {item.quantity} × {format(item.price)}
                  </p>
                </div>
                <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                  fontSize:18, color:'#A5B4FC', flexShrink:0 }}>
                  {format(item.price * item.quantity)}
                </span>
              </div>

              {/* Codes Section */}
              {item.codes?.length > 0 && order.status === 'completed' && (
                <div>
                  <div style={{ height:1, background:'#252B3B', margin:'0 0 14px' }} />

                  {/* Toggle Header */}
                  <div style={{ display:'flex', alignItems:'center',
                    justifyContent:'space-between', marginBottom:10 }}>
                    <button
                      onClick={() => setShowCodes(s => ({ ...s, [idx]: !s[idx] }))}
                      style={{
                        display:'flex', alignItems:'center', gap:7,
                        background:'none', border:'none', cursor:'pointer',
                        fontFamily:'Outfit,sans-serif', fontSize:13,
                        fontWeight:600, color:'#8892A4',
                        transition:'color .2s', padding:0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color='#A5B4FC'}
                      onMouseLeave={e => e.currentTarget.style.color='#8892A4'}
                    >
                      <svg
                        width="14" height="14" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth={2}
                        style={{ transition:'transform .2s',
                          transform: showCodes[idx] ? 'rotate(90deg)' : 'rotate(0)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      {showCodes[idx] ? 'Hide' : 'Show'} {item.codes.length} code{item.codes.length > 1 ? 's' : ''}
                    </button>

                    {/* Copy All */}
                    {showCodes[idx] && item.codes.length > 1 && (
                      <button
                        onClick={() => handleCopyAll(item, idx)}
                        style={{
                          display:'flex', alignItems:'center', gap:5,
                          background:'rgba(79,70,229,0.1)', border:'1px solid rgba(86,114,69,0.2)',
                          borderRadius:7, padding:'4px 10px',
                          fontSize:11, fontWeight:600, color:'#8892A4',
                          cursor:'pointer', fontFamily:'Outfit,sans-serif',
                          transition:'all .2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(86,114,69,0.2)'; e.currentTarget.style.color='#A5B4FC'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(79,70,229,0.1)'; e.currentTarget.style.color='#8892A4'; }}
                      >
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy All
                      </button>
                    )}
                  </div>

                  {/* Codes List */}
                  {showCodes[idx] && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {item.codes.map((code, ci) => {
                        const codeVal = code.code || code;
                        const copyKey = `${idx}-${ci}`;
                        const revealKey = `${idx}-${ci}`;
                        const isRevealed = revealedCodes[revealKey];
                        return (
                          <div key={ci} className="code-box">
                            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0, flex:1 }}>
                              <span style={{
                                fontSize:11, fontWeight:700,
                                fontFamily:'Rajdhani,sans-serif',
                                color:'#4a5a3a', letterSpacing:'.06em',
                                flexShrink:0,
                              }}>
                                #{ci + 1}
                              </span>
                              <span style={{
                                fontFamily:'monospace', fontSize:14,
                                color: isRevealed ? '#A5B4FC' : '#4a5a3a',
                                letterSpacing: isRevealed ? '.12em' : '.3em',
                                overflow:'hidden', textOverflow:'ellipsis',
                                whiteSpace:'nowrap', flex:1,
                                filter: isRevealed ? 'none' : 'blur(4px)',
                                userSelect: isRevealed ? 'text' : 'none',
                                transition: 'filter .2s',
                              }}>
                                {isRevealed ? codeVal : '••••••••••••••••'}
                              </span>
                            </div>
                            {/* Eye button */}
                            <button
                              onClick={() => setRevealedCodes(r => ({ ...r, [revealKey]: !r[revealKey] }))}
                              title={isRevealed ? 'Hide code' : 'Reveal code'}
                              style={{
                                width:32, height:32, borderRadius:8, flexShrink:0,
                                background:'rgba(86,114,69,0.08)',
                                border:'1px solid rgba(86,114,69,0.2)',
                                color: isRevealed ? '#6366F1' : '#8892A4',
                                cursor:'pointer', display:'flex',
                                alignItems:'center', justifyContent:'center',
                                transition:'all .2s',
                              }}
                            >
                              {isRevealed ? (
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                            {/* Copy button */}
                            <button
                              className="copy-btn"
                              onClick={() => handleCopy(codeVal, copyKey)}
                              title="Copy code"
                            >
                              {copied[copyKey] ? (
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                                  stroke="#6366F1" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                                  stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="ord-glass fade-up" style={{ padding:'20px 24px' }}>
          <h3 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
            fontSize:16, color:'#e8f0e0', margin:'0 0 14px' }}>
            Order Summary
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'#4a5a3a' }}>Subtotal</span>
              <span style={{ fontSize:13, color:'#e8f0e0' }}>{format(order.totalAmount)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'#4a5a3a' }}>Tax</span>
                <span style={{ fontSize:13, color:'#6366F1' }}>{format(0)}</span>
            </div>
            <div style={{ height:1, background:'#252B3B', margin:'4px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                fontSize:16, color:'#e8f0e0' }}>Total</span>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                fontSize:24, color:'#e8f0e0' }}>{format(order.totalAmount)}</span>
            </div>
          </div>

          <div style={{ height:1, background:'#252B3B', margin:'14px 0' }} />

          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {[
              ['Payment Method', order.paymentMethod],
              ['Order ID', order._id],
              ['Date', new Date(order.createdAt).toLocaleString()],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                <span style={{ fontSize:11, color:'#3a4a2a' }}>{label}</span>
                <span style={{ fontSize:11, color:'#4a5a3a', textAlign:'right',
                  overflow:'hidden', textOverflow:'ellipsis',
                  fontFamily: label === 'Order ID' ? 'monospace' : 'inherit' }}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default OrdersPage;
