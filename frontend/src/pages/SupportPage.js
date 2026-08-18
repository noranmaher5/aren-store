import React from 'react';

const topics = ['كيف أطلب منتجًا؟', 'أين طلبي؟', 'كيف يتم توصيل المنتجات الرقمية؟', 'سياسة الاسترجاع والاستبدال', 'طرق الدفع'];

export default function SupportPage() {
  const openChat = () => window.$chatwoot?.toggle('open');
  return <div className="aren-page aren-info-page">
    <div className="aren-page-intro"><span className="aren-eyebrow">نحن هنا لمساعدتك</span><h1>كيف يمكننا مساعدتك؟</h1><p>اعثر على إجابة أو تواصل مع فريق الدعم في أي وقت.</p></div>
    <div className="aren-support-layout">
      <section className="aren-support-card"><h2>مواضيع شائعة</h2>{topics.map(topic => <button key={topic} onClick={openChat}>{topic}<span>←</span></button>)}<button className="aren-gold-button" onClick={openChat}>تواصل مع الدعم ←</button></section>
      <section className="aren-support-card aren-support-contact"><span className="aren-big-icon">◌</span><h2>تحتاج مساعدة بشأن طلب؟</h2><p>فريق الدعم جاهز لمساعدتك على مدار الساعة. افتح محادثة وسنتولى الأمر.</p><button className="aren-gold-button" onClick={openChat}>ابدأ محادثة</button></section>
    </div>
  </div>;
}
