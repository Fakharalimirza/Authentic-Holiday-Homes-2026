import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Clock, AlertCircle, Info } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function Terms() {
  const { lang } = useSettings();
  const lastUpdated = lang === 'ar' ? "18 مايو 2026" : "May 18, 2026";

  const sections = [
    {
      id: "definitions",
      title: lang === 'ar' ? "التعريفات" : "Definitions",
      icon: <Info size={20} className="text-brand" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: lang === 'ar' ? "المشغل" : "Operator", value: lang === 'ar' ? "شركة أوثينتيك هوليداي هومز ذ.م.م، مسجلة بموجب ترخيص رقم: 1061365؛" : "Authentic Holiday Homes L.L.C, registered under license no.: 1061365;" },
            { label: lang === 'ar' ? "العقار" : "Property", value: lang === 'ar' ? "العقار المذكور في تأكيد الحجز الذي استلمه الضيف؛" : "The Property mentioned in the Reservation Confirmation received by the Guest;" },
            { label: lang === 'ar' ? "الضيف أو الضيوف" : "Guest or Guests", value: lang === 'ar' ? "أي فرد أو منظمة تحجز عقاراً من المشغل للاستخدام المؤقت كمنزل عطلات؛" : "Any individual(s) or organization booking a Property from the Operator for temporary usage as a vacation home;" },
            { label: lang === 'ar' ? "الزوار" : "Visitors", value: lang === 'ar' ? "أفراد إضافيون مدعوون من قبل الضيف يزورون العقار بدلاً من المبيت." : "Additional individual(s) invitees of the Guest who are visiting the Property, rather than staying overnight." }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest font-bold text-brand mb-1">{item.label}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.value}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "bookings",
      title: lang === 'ar' ? "1.1 الحجوزات المدفوعة، الإلغاء وعدم الحضور" : "1.1 Paid bookings, cancellations & No Show",
      icon: <Clock size={20} className="text-brand" />,
      content: (
        <div className="space-y-4">
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.1A</span> <span className="text-zinc-600 dark:text-zinc-400">All Bookings paid in full prior to check-in are Non-Refundable. Cancellation fee of (the full amount paid) is applicable for all cancellations 14 Days from check in date. Any paid amounts including deposits are non-refundable in the event of canceling a contract/reservation 14 days or less before check in date.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.1B</span> <span className="text-zinc-600 dark:text-zinc-400">All Annual and Bi-Annual Bookings would require 1 month notice and 1 month penalty upon early termination of the contact period.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.1C</span> <span className="text-zinc-600 dark:text-zinc-400">Should the Guest require an extension of the Booking, the Guest shall notify the Company not less than 21 days before expiry of the Booking. Should the Guest fail to notify the Company of their intention to extend the Booking, the Company reserves the right to offer the Booking to a new Guest.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.1D</span> <span className="text-zinc-600 dark:text-zinc-400">Upon receiving notice from the Guest of their intention to extend the Booking, the Company will then provide to the Guest the cost to extend, the term by the Guest’s desired period. To extend the Booking, the Guest must provide payment to the Company on signing and confirmation of the new term.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.1E</span> <span className="text-zinc-600 dark:text-zinc-400">In the event that the guest fails to make payment to the Company after providing notice to extend the Booking in accordance with 1.1C and 1.1D, the Company reserves the right to withhold the Guest’s full deposit.</span></p>
        </div>
      )
    },
    {
      id: "timings",
      title: "1.2 Check in & out timings",
      icon: <Clock size={20} className="text-brand" />,
      content: (
        <div className="space-y-4">
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.2A</span> <span className="text-zinc-600 dark:text-zinc-400">Regular check in time is 3 PM and check out time is 12 noon</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.2B</span> <span className="text-zinc-600 dark:text-zinc-400">Early check in or late check out requests are subject to Authentic Holiday Homes L.L.C. approval and property availability. To request an early check in or late check out you must email us at <a href="mailto:customerservice@authenticholidayhomes.ae" className="text-brand hover:underline">customerservice@authenticholidayhomes.ae</a></span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.2C</span> <span className="text-zinc-600 dark:text-zinc-400">The property should be promptly vacated at the agreed check out time. Any delay in checking out that is not authorized will lead to a charges of AED 200/hour of delay which will be deducted from the security/damage deposit held.</span></p>
        </div>
      )
    },
    {
      id: "deposit",
      title: "1.3 Refundable security deposit",
      icon: <Shield size={20} className="text-brand" />,
      content: (
        <div className="space-y-4">
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.3A</span> <span className="text-zinc-600 dark:text-zinc-400">A refundable security deposit with the amount mentioned on page 1 of this agreement will be held by the Company as an insurance against any damage or misuse of the property or for covering any incidental utilization of facilities/phones/paid TV charges/Additional cleaning.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.3B</span> <span className="text-zinc-600 dark:text-zinc-400">The full amount of this deposit will be refunded upon handover of the property to a Authentic Holiday Homes L.L.C. representative after going through the final handover inspection. The amount will be refunded within 2 to 5 working days post check-out.</span></p>
        </div>
      )
    },
    {
      id: "conduct",
      title: "1.4 Code of conduct and behavior",
      icon: <AlertCircle size={20} className="text-brand" />,
      content: (
        <div className="space-y-4">
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.4A</span> <span className="text-zinc-600 dark:text-zinc-400">The Guests are requested to follow civilized behaviors while staying at one of our properties</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.4B</span> <span className="text-zinc-600 dark:text-zinc-400">The Guests are expected to be considerate to their neighbors and not cause any inconvenience such as extremely loud noise or music which are prohibited by law and by property community rules</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.4C</span> <span className="text-zinc-600 dark:text-zinc-400">Parties with loud music and noise are not permitted and could result in the eviction of the guests from the properties and the withholding of the prepaid sum of money as penalty of breaking community rules.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.4D</span> <span className="text-zinc-600 dark:text-zinc-400">Guests have the right to receive outside guests in their properties for a few hours where these guests are expected to follow the code of conduct and civilized behavior as per the community rules. Certain communities do not allow UN-registered guests to be admitted. Registration will be mandatory and subject to approval.</span></p>
        </div>
      )
    },
    {
      id: "pets-smoking",
      title: "1.5 Pets and smoking",
      icon: <AlertCircle size={20} className="text-brand" />,
      content: (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl">
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            All our properties do not allow pets and are classified as non-smoking. Unauthorized smoking inside the properties or having pets (unless a permission is granted) will lead to an <span className="font-bold text-brand">additional cleaning charge of 2000 AED per stay</span> in addition to any damage charges caused by the guest during the stay.
          </p>
        </div>
      )
    },
    {
      id: "tariffs",
      title: "1.6 Payment tariffs and fees",
      icon: <FileText size={20} className="text-brand" />,
      content: (
        <div className="space-y-4">
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.6A</span> <span className="text-zinc-600 dark:text-zinc-400">All fees, percentage charge on a certain amount or any other tariff on a payment made to Authentic Holiday Homes L.L.C. from the card provider, bank or any other financial institute should be paid by one of the guests staying 3 days before the due date . A third-party payment authorization needs to be obtained in advance for any third-party payments.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.6B</span> <span className="text-zinc-600 dark:text-zinc-400">Dubai Tourism fees as per the Dubai Tourism & Marketing Authority are applicable and paid by guest and is highlighted on page 1 of this agreement. This fee is limited to the first 30 nights of your stay.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.6C</span> <span className="text-zinc-600 dark:text-zinc-400">Monthly rental price will vary based on market scenario and Will be informed before the due date .</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.6D</span> <span className="text-zinc-600 dark:text-zinc-400">In case of cash payment for monthly rent 1st appointment for rent collection is free and if missed, 2nd appointment for collection will be charged 100aed extra .</span></p>
        </div>
      )
    },
    {
      id: "keys",
      title: "1.14 Lost keys and access cards",
      icon: <Shield size={20} className="text-brand" />,
      content: (
        <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
              <tr>
                <td className="px-6 py-4">Lost property key</td>
                <td className="px-6 py-4 font-bold text-brand">AED 200</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Lost access card</td>
                <td className="px-6 py-4">As per Building Management</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Lost parking remote/card</td>
                <td className="px-6 py-4">As per Building Management</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      id: "liability",
      title: "1.17 No liability Undertaking",
      icon: <AlertCircle size={20} className="text-brand" />,
      content: (
        <div className="space-y-4">
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.17A</span> <span className="text-zinc-600 dark:text-zinc-400">The Company undertakes no liability for any accidents caused by the guest while staying in our properties that lead to property damage or personal injuries or loss.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.17B</span> <span className="text-zinc-600 dark:text-zinc-400">Guests are required to be cautious around sharp items, electricity, fixtures, balconies and any other item that may cause an injury if handled wrongly.</span></p>
          <p className="flex gap-3"><span className="font-bold text-zinc-900 dark:text-white shrink-0">1.17C</span> <span className="text-zinc-600 dark:text-zinc-400">Guests with kids are requested to closely watch their kids at all times while occupying our properties. No liability will be passed on to the Company in the event of injury to personnel due to negligence.</span></p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Shield size={14} />
            {lang === 'ar' ? 'اتفاقية قانونية' : 'Legal Agreement'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-4 uppercase">
            {lang === 'ar' ? 'الشروط و' : 'Terms &'} <span className="text-brand italic">{lang === 'ar' ? 'الأحكام' : 'Conditions'}</span>
          </h1>
          <p className="text-zinc-500 uppercase tracking-[0.2em] text-[10px]">{lang === 'ar' ? 'آخر تحديث' : 'Last Updated'}: {lastUpdated}</p>
        </motion.div>

        {/* Content */}
        <div className="space-y-20">
          {sections.map((section, index) => (
            <motion.section 
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl group-hover:bg-brand/10 transition-colors">
                  {section.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
                  {section.title}
                </h2>
              </div>
              <div className="pl-1 md:pl-12">
                {section.content}
              </div>
            </motion.section>
          ))}

          {/* Remaining Sections Simplified */}
          <div className="space-y-12 pl-1 md:pl-12">
            {[
              { title: "1.8 Changes in the booking dates", text: "Notify via phone or email (customerservice@authenticholidayhomes.ae). Changes +30 days prior are free. <30 days, cancellation fees apply." },
              { title: "1.9 Assigned property change", text: "Property reassignment fee of 200 AED applies plus any price difference. Refunds for differences only if 30+ days prior to check-in." },
              { title: "1.10 Refunds", text: "Processed within a week of approval. May take up to 14 working days to appear in your account." },
              { title: "1.11 Services and facilities", text: "Properties are fully furnished. Utilities included, but excessive DEWA consumption will be charged separately." },
              { title: "1.12 Lost and found", text: "Contact immediately. Courier charges apply for delivery of items." },
              { title: "1.13 Legal activities", text: "Strictly for habitation. Subleasing is illegal and will be reported to police." },
              { title: "1.15 Other services", text: "Visa assistance, airport transfers, and guides available via guest relations manager." },
              { title: "1.16 Emergencies", text: "Dial emergency numbers located at the property entrance immediately." },
              { title: "1.18 Privacy policy", text: "Personal data remains strictly confidential and used only for service completion." },
              { title: "1.19 Property Access", text: "Viewings for future guests/investors must be granted with proper notice from the Company." }
            ].map((item, i) => (
              <div key={i} className="border-b border-zinc-100 dark:border-zinc-800 pb-8">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Final Call to Action or Footer Note */}
          <div className="pt-10 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl mx-auto italic">
              By booking a property with Authentic Holiday Homes L.L.C, you acknowledge that you have read, understood, and agreed to be bound by these terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
