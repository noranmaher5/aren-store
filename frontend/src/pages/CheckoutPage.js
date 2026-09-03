import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI, settingsAPI, discountAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const copyValue = async (value) => {
  if (!value) return;
  await navigator.clipboard.writeText(value);
};

export default function CheckoutPage() {
  const { items, isEmpty, clearCart } = useCart();
  const { format, currency } = useCurrency();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [deliveryContact, setDeliveryContact] = useState('');
  const [bankTransfer, setBankTransfer] = useState({ enabled: true, whatsapp: '', instructions: '', accounts: [] });
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [copied, setCopied] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [items]);
  const finalTotal = appliedDiscount?.finalAmount ?? total;
  const selectedAccount = bankTransfer.accounts.find(account => account.id === paymentAccountId);

  useEffect(() => {
    settingsAPI.getBankTransfer()
      .then(res => {
        const next = res.data.bankTransfer || { accounts: [] };
        setBankTransfer(next);
        if (next.accounts?.length === 1) setPaymentAccountId(next.accounts[0].id);
      })
      .catch(() => {});
  }, []);

  const handleCopy = async (key, value) => {
    try {
      await copyValue(value);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  };

  const applyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;
    setDiscountLoading(true); setDiscountError('');
    try {
      const response = await discountAPI.validate({ code, totalAmount: total });
      setAppliedDiscount({ code: response.data.discount.code, amount: response.data.discountAmount, finalAmount: response.data.finalAmount });
    } catch (err) {
      setAppliedDiscount(null);
      setDiscountError(err.response?.data?.message || 'قسيمة الخصم غير صالحة');
    } finally { setDiscountLoading(false); }
  };

  const createOrder = async (event) => {
    event.preventDefault();
    setSubmitting(true); setError('');
    const key = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const response = await orderAPI.create({
        items: items.map(item => ({ productId: item.product?._id || item.product, quantity: item.quantity, optionId: item.selectedOption?.id || '' })),
        discountCode: appliedDiscount?.code || '',
        deliveryMethod,
        deliveryContact: deliveryContact.trim(),
        paymentAccountId,
        referralCode: localStorage.getItem('aren_referral_code') || '',
      }, key);
      if (paymentProof) {
        await orderAPI.submitPaymentProof(response.data.order._id, paymentProof);
      }
      await clearCart();
      navigate(`/orders/${response.data.order._id}`);
    } catch (err) { setError(err.response?.data?.message || err.message || 'تعذر إنشاء الطلب. راجع البيانات وحاول مرة أخرى.'); }
    finally { setSubmitting(false); }
  };

  if (isEmpty) return <div dir="rtl" className="min-h-screen pt-32 text-center text-zinc-300">السلة فارغة. <Link className="text-indigo-400" to="/cart">العودة إلى السلة</Link></div>;
  return <div dir="rtl" className="min-h-screen bg-[#0B0E17] pt-28 pb-16 text-zinc-200"><div className="mx-auto max-w-3xl px-5">
    <Link to="/cart" className="text-sm text-zinc-400">العودة إلى السلة</Link><h1 className="mt-5 text-3xl font-bold">تأكيد الطلب</h1>
    <form onSubmit={createOrder} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/[.03] p-6">
      <div className="space-y-3">{items.map(item => <div key={item.product?._id || item.product} className="flex justify-between gap-4 border-b border-white/5 py-3"><span>{item.name} × {item.quantity}</span><span>{format(item.price * item.quantity)}</span></div>)}<div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><label htmlFor="discount-code" className="mb-2 block text-sm font-bold">قسيمة الخصم</label><div className="flex gap-2"><input id="discount-code" value={discountCode} onChange={event => { setDiscountCode(event.target.value); setAppliedDiscount(null); setDiscountError(''); }} placeholder="أدخل كود الخصم" dir="ltr" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left outline-none focus:border-indigo-400" /><button type="button" onClick={applyDiscount} disabled={discountLoading || !discountCode.trim()} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{discountLoading ? '...' : 'تطبيق'}</button></div>{discountError && <p className="mt-2 text-xs text-red-300">{discountError}</p>}{appliedDiscount && <p className="mt-2 text-xs text-emerald-300">تم تطبيق القسيمة {appliedDiscount.code}</p>}</div>{appliedDiscount && <div className="flex justify-between text-sm text-emerald-300"><span>الخصم</span><span>-{format(appliedDiscount.amount)}</span></div>}<div className="flex justify-between pt-3 text-xl font-bold"><span>الإجمالي</span><span>{format(finalTotal)}</span></div></div>
      <div><label className="mb-3 block text-sm font-bold">طريقة استلام الاشتراك</label><div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => { setDeliveryMethod('email'); setDeliveryContact(''); }} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${deliveryMethod === 'email' ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/10 bg-black/20 text-zinc-400'}`}>البريد الإلكتروني</button>
        <button type="button" onClick={() => { setDeliveryMethod('whatsapp'); setDeliveryContact(''); }} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${deliveryMethod === 'whatsapp' ? 'border-emerald-400 bg-emerald-600 text-white' : 'border-white/10 bg-black/20 text-zinc-400'}`}>واتساب</button>
      </div></div>
      <div><label htmlFor="delivery-contact" className="mb-2 block text-sm font-bold">{deliveryMethod === 'email' ? 'البريد الإلكتروني لاستلام الطلب' : 'رقم واتساب لاستلام الطلب'}</label><input id="delivery-contact" required type={deliveryMethod === 'email' ? 'email' : 'tel'} value={deliveryContact} onChange={event => setDeliveryContact(event.target.value)} placeholder={deliveryMethod === 'email' ? 'name@example.com' : '+201xxxxxxxxx'} dir="ltr" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left outline-none focus:border-indigo-400" />{deliveryMethod === 'whatsapp' && <p className="mt-2 text-xs text-zinc-500">اكتب الرقم بصيغة دولية، مثل +201xxxxxxxxx</p>}</div>
      <div>
        <label className="mb-3 block text-sm font-bold">الدفع بتحويل بنكي</label>
        {bankTransfer.instructions && <p className="mb-4 text-sm text-zinc-400">{bankTransfer.instructions}</p>}
        {bankTransfer.accounts.length === 0 && <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">سيتم التواصل معك بعد الطلب ببيانات التحويل.</p>}
        <div className="space-y-3">
          {bankTransfer.accounts.map(account => (
            <button type="button" key={account.id} onClick={() => setPaymentAccountId(account.id)} className={`w-full rounded-xl border p-4 text-right ${paymentAccountId === account.id ? 'border-indigo-400 bg-indigo-500/15' : 'border-white/10 bg-black/20'}`}>
              <p className="font-bold text-white">{account.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{[account.bankName, account.accountName].filter(Boolean).join(' · ')}</p>
              {account.accountNumber && <p dir="ltr" className="mt-2 font-mono text-sm text-zinc-200">{account.accountNumber}</p>}
            </button>
          ))}
        </div>
        {selectedAccount && (
          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            {[['اسم الحساب', selectedAccount.accountName, 'name'], ['رقم الحساب', selectedAccount.accountNumber, 'number'], ['IBAN', selectedAccount.iban, 'iban']].filter(row => row[1]).map(([label, value, key]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-zinc-400">{label}</span>
                <button type="button" onClick={() => handleCopy(key, value)} className="font-mono text-white">{copied === key ? 'تم النسخ' : value}</button>
              </div>
            ))}
            {selectedAccount.notes && <p className="pt-2 text-xs text-amber-200">{selectedAccount.notes}</p>}
            <div className="pt-3">
              <label htmlFor="payment-proof" className="mb-2 block text-sm font-bold text-white">صورة التحويل</label>
              <p className="mb-3 text-xs text-zinc-400">ارفع صورة إيصال التحويل بعد إتمام الدفع.</p>
              <input id="payment-proof" type="file" accept="image/*" onChange={event => setPaymentProof(event.target.files?.[0] || null)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-300 file:ml-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" />
              {paymentProof && <p className="mt-2 text-xs text-emerald-300">تم اختيار: {paymentProof.name}</p>}
            </div>
          </div>
        )}
      </div>
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">بعد إرسال الطلب حوّل المبلغ ثم ارفع صورة التحويل أو أرسلها عبر واتساب. سيتم التسليم بعد تأكيد الأدمن.</p>
      {error && <p className="text-sm text-red-300">{error}</p>}<button disabled={submitting} type="submit" className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white disabled:opacity-50">{submitting ? 'جارٍ إرسال الطلب...' : `إرسال الطلب (${currency})`}</button>
    </form></div></div>;
}
