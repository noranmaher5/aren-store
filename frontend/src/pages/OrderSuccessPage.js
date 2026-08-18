import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <section className="aren-success-page">
      <div className="aren-success-card">
        <div className="aren-success-mark" aria-hidden="true">✓</div>
        <span className="aren-eyebrow">تم تأكيد الطلب</span>
        <h1>شكراً لإتمام عملية الشراء</h1>
        <p>تم استلام دفعتك. نجهّز منتجك الرقمي وسنرسل تفاصيل التسليم إلى بريد حسابك.</p>
        <div className="aren-order-reference">رقم الطلب <strong>#{id}</strong></div>
        <div className="aren-success-actions">
          <Link className="aren-gold-button" to={`/orders/${id}`}>عرض الطلب</Link>
          <Link className="aren-outline-button" to="/products">متابعة التسوق</Link>
        </div>
      </div>
    </section>
  );
}
