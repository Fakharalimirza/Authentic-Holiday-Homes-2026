import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function Privacy() {
  const { lang } = useSettings();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-32">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase mb-12">
        {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
      </h1>
      
      <div className="space-y-12">
        <section>
          <p className="text-xl text-zinc-500 leading-relaxed">
            {lang === 'ar' 
              ? 'خصوصيتك مهمة بالنسبة لنا. إن سياسة "أوثينتيك هوليداي هومز" هي احترام خصوصيتك فيما يتعلق بأي معلومات قد نجمعها منك عبر موقعنا الإلكتروني.' 
              : "Your privacy is important to us. It is Authentic Holiday Homes' policy to respect your privacy regarding any information we may collect from you across our website."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-4">
            {lang === 'ar' ? '1. المعلومات التي نجمعها' : '1. Information We Collect'}
          </h2>
          <p className="text-zinc-500 leading-relaxed">
            {lang === 'ar'
              ? 'نطلب المعلومات الشخصية فقط عندما نحتاجها حقاً لتقديم خدمة لك. نجمعها بوسائل عادلة وقانونية، بمعرفتك وموافقتك.'
              : "We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-4">
            {lang === 'ar' ? '2. استخدام المعلومات' : '2. Use of Information'}
          </h2>
          <p className="text-zinc-500 leading-relaxed">
            {lang === 'ar'
              ? 'نستخدم البيانات التي نجمعها لتقديم خدماتنا وصيانتها وتحسينها، وللتواصل معك بخصوص الحجوزات والتحديثات.'
              : "We use the data we collect to provide, maintain, and improve our services, and to communicate with you regarding bookings and updates."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-4">
            {lang === 'ar' ? '3. أمن البيانات' : '3. Data Security'}
          </h2>
          <p className="text-zinc-500 leading-relaxed">
            {lang === 'ar'
              ? 'نحن نحمي البيانات المخزنة ضمن الوسائل المقبولة تجارياً لمنع الفقدان والسرقة، فضلاً عن الوصول غير المصرح به أو الكشف أو النسخ أو الاستخدام أو التعديل.'
              : "We protect stored data within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification."}
          </p>
        </section>
      </div>
    </div>
  );
}
