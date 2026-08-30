import React from 'react';

const sections = [
  {
    title: '1. عدم الاسترجاع أو الاستبدال',
    body: 'نظرًا لطبيعة المنتجات الرقمية، لا يمكن استرجاع أو استبدال أي كود أو اشتراك بعد إرساله أو عرضه للعميل. تُطبَّق هذه السياسة لحماية المتجر من سوء الاستخدام.',
  },
  {
    title: '2. مسؤولية الاستخدام',
    body: 'بمجرد استلام المنتج، تصبح مسؤولية استخدامه بالكامل على العميل. المتجر غير مسؤول عن أي استخدام خاطئ، بما في ذلك:',
    items: [
      'إدخال الكود في حساب غير صحيح',
      'اختيار منطقة أو منصة غير متوافقة',
      'مشاركة الكود مع طرف آخر',
      'فقدان الكود أو بيانات الدخول بعد الاستلام',
    ],
  },
  {
    title: '3. التحقق قبل الشراء',
    body: 'يجب على العميل التأكد قبل إتمام الطلب من توافق المنتج مع حسابه (الدولة والمنصة)، وقراءة وصف المنتج بالكامل.',
  },
  {
    title: '4. الدفع والتسليم',
    body: 'الدفع يتم عبر التحويل البنكي. يبدأ تنفيذ الطلب بعد تأكيد وصول المبلغ. قد يصل المنتج عبر البريد الإلكتروني أو واتساب حسب طريقة الاستلام المختارة.',
  },
  {
    title: '5. الحالات الاستثنائية',
    body: 'إذا ثبت أن الكود غير صالح ولم يُستخدم، يجب التواصل معنا خلال 24 ساعة من وقت الشراء مع إثبات واضح، وسيتم مراجعة الحالة.',
  },
  {
    title: '6. الاحتيال وسوء الاستخدام',
    body: 'يحتفظ المتجر بحق رفض أي طلب استرجاع أو تعويض عند الاشتباه بمحاولة احتيال أو استخدام غير مشروع، كما يحق له إلغاء الطلبات المخالفة.',
  },
];

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0B0E17] pt-28 pb-20 px-4 text-[#f5f0ff] md:px-8">
      <div className="mx-auto max-w-[920px] rounded-[24px] border border-[rgba(185,140,255,0.28)] bg-[#17121f] p-8 shadow-[0_18px_50px_rgba(185,140,255,0.08)] md:p-12">
        <div className="mb-10">
          <p className="mb-3 text-[11px] font-extrabold tracking-[0.18em] text-[#c5a0ff]">أرن ستور</p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">الشروط والأحكام</h1>
          <p className="text-[#b8a9cc]">سياسة استخدام المتجر للمنتجات الرقمية والاشتراكات.</p>
        </div>

        <div className="space-y-8 text-[15px] leading-relaxed text-[#d4cbe3]">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-lg font-bold text-white">{section.title}</h2>
              <p>{section.body}</p>
              {section.items && (
                <ul className="mt-2 list-disc space-y-1 pr-5 text-[#b8a9cc]">
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
