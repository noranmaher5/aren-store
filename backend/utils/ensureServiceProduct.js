const Product = require('../models/Product');

const SERVICE_SLUG = 'aren-store-building-service';

// Keep the portfolio offer available without touching or reseeding the catalog.
module.exports = async function ensureServiceProduct() {
  await Product.findOneAndUpdate(
    { slug: SERVICE_SLUG },
    {
      // Values in $set are also applied during an upsert. Do not repeat them
      // in $setOnInsert because MongoDB rejects overlapping update paths.
      $set: {
        name: 'نوران ماهر - حلول المتاجر الإلكترونية والذكاء الاصطناعي',
        shortDescription: 'خدمات تطوير وتصميم المتاجر الإلكترونية وحلول الذكاء الاصطناعي المخصصة للأعمال.',
        description: 'أقدّم خدمات تطوير وتصميم المتاجر الإلكترونية باحترافية، من تصميم الواجهة وتجربة المستخدم إلى البرمجة وربط بوابات الدفع والـAPIs، بالإضافة إلى تطوير وكلاء الذكاء الاصطناعي (AI Agents) وروبوتات المحادثة (Chatbots) وحلول الذكاء الاصطناعي المخصصة للأعمال.\n\n🚀 متاجر إلكترونية\n🤖 وكلاء الذكاء الاصطناعي وروبوتات المحادثة\n🔌 ربط واجهات برمجة التطبيقات (API Integration)\n📱 تطبيقات الويب والموبايل\n⚙️ لوحات تحكم إدارية\n🧠 حلول الذكاء الاصطناعي و(RAG)\n\nللاستفسار عن الأسعار أو طلب تنفيذ مشروع مخصص، تواصل معي عبر واتساب.',
        category: 'services',
        platform: 'Aren Services',
        region: 'Global',
        price: 0,
        originalPrice: 0,
        currency: 'USD',
        tags: ['store-building', 'ai-agent', 'automation', 'web-development'],
        productType: 'service',
        deliveryType: 'manual',
        availabilityType: 'on_demand',
        isQuoteOnly: true,
        contactWhatsapp: '201121967774',
        isUnlimited: true,
        isActive: true,
        image: ''
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
