import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('إذا كان الحساب موجوداً، فسيصلك رابط إعادة التعيين قريباً.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="aren-auth-page">
      <div className="aren-auth-card">
        <span className="aren-eyebrow">استعادة الحساب</span>
        <h1>{sent ? 'تحقق من بريدك الإلكتروني' : 'هل نسيت كلمة المرور؟'}</h1>
        <p>{sent ? 'استخدم الرابط الآمن في بريدك لإنشاء كلمة مرور جديدة.' : 'أدخل البريد المرتبط بحسابك في Aren Store وسنرسل لك رابط إعادة تعيين آمن.'}</p>
        {sent ? (
          <div className="aren-auth-success">تم طلب تعليمات إعادة التعيين للبريد <strong>{email}</strong>.</div>
        ) : (
          <form onSubmit={handleSubmit} className="aren-auth-form">
            <label htmlFor="recovery-email">البريد الإلكتروني</label>
            <input id="recovery-email" className="aren-auth-input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            <button className="aren-auth-submit" type="submit" disabled={loading}>{loading ? 'جارٍ الإرسال…' : 'إرسال رابط التعيين'}</button>
          </form>
        )}
        <Link className="aren-auth-link" to="/login">← العودة لتسجيل الدخول</Link>
      </div>
    </section>
  );
}
