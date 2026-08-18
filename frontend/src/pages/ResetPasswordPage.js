import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return toast.error('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل');
    if (password !== confirmPassword) return toast.error('كلمتا المرور غير متطابقتين');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'رابط إعادة التعيين غير صالح أو منتهي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="aren-auth-page">
      <div className="aren-auth-card">
        <span className="aren-eyebrow">إعادة تعيين آمنة</span>
        <h1>إنشاء كلمة مرور جديدة</h1>
        <p>اختر كلمة مرور قوية لحسابك في Aren Store.</p>
        <form onSubmit={handleSubmit} className="aren-auth-form">
          <label htmlFor="new-password">كلمة المرور الجديدة</label>
          <input id="new-password" className="aren-auth-input" type="password" minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 أحرف على الأقل" />
          <label htmlFor="confirm-password">تأكيد كلمة المرور</label>
          <input id="confirm-password" className="aren-auth-input" type="password" minLength="8" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="أعد كتابة كلمة المرور" />
          <button className="aren-auth-submit" type="submit" disabled={loading}>{loading ? 'جارٍ التحديث…' : 'تحديث كلمة المرور'}</button>
        </form>
        <Link className="aren-auth-link" to="/login">← العودة لتسجيل الدخول</Link>
      </div>
    </section>
  );
}
