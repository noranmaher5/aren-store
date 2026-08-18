import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E17] text-[#f5f5f5] pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto bg-[#1e2517] rounded-[24px] p-8 md:p-12 border border-[#2a3420]/60 shadow-2xl">
        
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">الشروط والأحكام</h1>
          <p className="text-[#8892A4]">For Digital Products / للمنتجات الرقمية</p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* English source hidden for Arabic-only storefront */}
          <div className="hidden" aria-hidden="true">
            <h2 className="text-2xl font-bold text-[#f5f5f5] border-b border-[#2a3420] pb-3 mb-6">Terms and Conditions</h2>
            
            <section>
              <h3 className="font-bold text-white mb-2">1. No Returns or Exchanges:</h3>
              <p>Due to the nature of digital products, no returns or exchanges are permitted once a code has been sent or displayed to the customer. This policy is strictly enforced to protect against misuse.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">2. Responsibility of Use:</h3>
              <p>Once the code is received, the customer assumes full responsibility for its use. The store is not liable for errors, including but not limited to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-[#8892A4]">
                <li>Entering the code into the wrong account.</li>
                <li>Selecting an incompatible Region.</li>
                <li>Sharing the code with a third party.</li>
                <li>Loss or theft of the code after delivery.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">3. Verification Before Purchase:</h3>
              <p>It is the customer’s responsibility to verify the following before completing a transaction:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-[#8892A4]">
                <li>Compatibility: Ensure the code matches your account’s country and platform.</li>
                <li>Product Description: Read the full product details and requirements carefully.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">4. Exceptional Cases:</h3>
              <p>If there is a proven issue with the code (e.g., an invalid or "already used" code at the time of delivery), you must contact us within 24 hours of purchase. You must provide clear evidence of the issue, and the case will be reviewed by our team.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">5. Fraud and Misuse:</h3>
              <p>The store reserves the right to reject any request for a refund or compensation if there is suspicion of fraud, attempted scams, or illegal use of our services.</p>
            </section>
          </div>

          <div className="space-y-8 text-[15px] leading-relaxed text-[#b4c89e]" dir="rtl">
            <h2 className="text-2xl font-bold text-[#f5f5f5] border-b border-[#2a3420] pb-3 mb-6">سياسة المستخدم</h2>
            
            <section>
              <h3 className="font-bold text-white mb-2">1. عدم الاسترجاع أو الاستبدال:</h3>
              <p>نظرًا لطبيعة المنتجات الرقمية، لا يمكن استرجاع أو استبدال أي كود بعد إرساله أو عرضه للعميل، وذلك لحمايتنا من سوء الاستخدام.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">2. مسؤولية الاستخدام:</h3>
              <p>بمجرد استلام الكود، تصبح مسؤولية استخدامه بالكامل على العميل. المتجر غير مسؤول عن أي استخدام خاطئ، مثل:</p>
              <ul className="list-disc pr-5 mt-2 space-y-1 text-[#8892A4]">
                <li>إدخال الكود في حساب غير صحيح</li>
                <li>اختيار منطقة (Region) غير متوافقة</li>
                <li>مشاركة الكود مع طرف آخر</li>
                <li>فقدان الكود بعد استلامه</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">3. التحقق قبل الشراء:</h3>
              <p>يجب على العميل التأكد من:</p>
              <ul className="list-disc pr-5 mt-2 space-y-1 text-[#8892A4]">
                <li>توافق الكود مع حسابه (الدولة / المنصة)</li>
                <li>قراءة وصف المنتج بشكل كامل قبل الشراء</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">4. الحالات الاستثنائية:</h3>
              <p>في حال وجود مشكلة مثبتة في الكود (مثل كود غير صالح ولم يتم استخدامه)، يجب التواصل معنا خلال مدة لا تتجاوز 24 ساعة من وقت الشراء، مع تقديم إثبات واضح، وسيتم مراجعة الحالة.</p>
            </section>

            <section>
              <h3 className="font-bold text-white mb-2">5. الاحتيال وسوء الاستخدام:</h3>
              <p>يحتفظ المتجر بالحق في رفض أي طلب استرجاع أو تعويض في حال الاشتباه بأي محاولة احتيال أو استخدام غير مشروع.</p>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
