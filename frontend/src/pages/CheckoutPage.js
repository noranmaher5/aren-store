import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export default function CheckoutPage() {
  const { items, isEmpty, clearCart } = useCart();
  const { format, currency } = useCurrency();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [items]);

  const createOrder = async () => {
    setSubmitting(true); setError('');
    const key = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const response = await orderAPI.create({ items: items.map(item => ({ productId: item.product?._id || item.product, quantity: item.quantity })) }, key);
      await clearCart();
      navigate(`/orders/${response.data.order._id}`);
    } catch (err) { setError(err.response?.data?.message || 'Unable to create the order. Please review your cart.'); }
    finally { setSubmitting(false); }
  };

  if (isEmpty) return <div className="min-h-screen pt-32 text-center text-zinc-300">Your cart is empty. <Link className="text-indigo-400" to="/cart">Return to cart</Link></div>;
  return <div className="min-h-screen bg-[#0B0E17] pt-28 pb-16 text-zinc-200"><div className="mx-auto max-w-3xl px-5">
    <Link to="/cart" className="text-sm text-zinc-400">← Back to cart</Link><h1 className="mt-5 text-3xl font-bold">Review your order</h1>
    <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[.03] p-6">
      {items.map(item => <div key={item.product?._id || item.product} className="flex justify-between gap-4 border-b border-white/5 py-3"><span>{item.name} × {item.quantity}</span><span>{format(item.price * item.quantity)}</span></div>)}
      <div className="flex justify-between pt-3 text-xl font-bold"><span>Total</span><span>{format(total)}</span></div>
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">Payment gateway integration pending. Confirming creates an order in <strong>Awaiting Payment</strong> status; no payment is processed yet.</p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button disabled={submitting} onClick={createOrder} className="mt-3 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white disabled:opacity-50">{submitting ? 'Creating order…' : `Confirm order (${currency})`}</button>
    </div></div></div>;
}
