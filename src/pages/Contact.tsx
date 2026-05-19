import React, { useState } from 'react';
import { Mail, Phone, MapPin, Star, MessageSquare, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from '../contexts/SettingsContext';

export default function Contact() {
  const { t, lang } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-6xl font-bold tracking-tighter mb-8 uppercase">
            {lang === 'ar' ? 'تواصل' : 'Get in'} <br />
            <span className="text-brand italic font-medium tracking-normal">{lang === 'ar' ? 'معنا' : 'Touch'}</span>
          </h1>
          <p className="text-xl text-zinc-500 mb-12 leading-relaxed">{t('support_msg')}</p>
          
          <div className="space-y-8 mb-12">
            <div className="flex items-center gap-5 group">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl group-hover:bg-brand group-hover:text-white transition-all duration-300">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{t('email_us')}</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">info@authenticholidayhomes.ae</p>
              </div>
            </div>
            
            <div className="flex items-center gap-5 group">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl group-hover:bg-brand group-hover:text-white transition-all duration-300">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{t('call_us')}</p>
                <div className="text-lg font-bold text-zinc-900 dark:text-white flex flex-col">
                  <span>+971 4 286 6788</span>
                  <span className="text-zinc-500 font-medium text-base">+971 56 996 9332</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 group">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl group-hover:bg-brand group-hover:text-white transition-all duration-300">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{t('visit_us')}</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                  {lang === 'ar' ? 'مكتب A202 - سبورت سوسيتي مول' : 'Office A202 – Sport Society Mall'} <br />
                  {lang === 'ar' ? 'مردف، دبي، الإمارات' : 'Mirdif, Dubai, UAE'}
                </p>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-brand/5 dark:bg-brand/10 rounded-[2rem] border border-brand/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Star size={80} className="fill-brand text-brand" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{lang === 'ar' ? 'هل استمتعت بخدمتنا؟' : 'Enjoyed our service?'}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-xs">{lang === 'ar' ? 'شارك تجربتك معنا على جوجل. تساعدنا ملاحظاتك في الحفاظ على معاييرنا المتميزة.' : 'Share your experience with us on Google. Your feedback helps us maintain our premium standards.'}</p>
            <a 
              href="https://g.page/r/CUQi72TuttH6EBM/review" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-brand/20"
            >
              {t('write_review')} 
              <ExternalLink size={16} />
            </a>
          </motion.div>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="bg-zinc-50 dark:bg-zinc-900 p-10 rounded-[3rem] shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6 flex flex-col justify-center relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {submitStatus === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 text-center bg-zinc-50 dark:bg-zinc-900"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 uppercase tracking-tighter">
                  {lang === 'ar' ? 'تم الإرسال بنجاح' : 'Message Sent Successfully'}
                </h3>
                <p className="text-zinc-500 mb-8 max-w-xs">
                  {lang === 'ar' ? 'شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.' : "Thank you for reaching out. We've received your message and will get back to you shortly."}
                </p>
                <button 
                  type="button"
                  onClick={() => setSubmitStatus('idle')}
                  className="px-8 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-mono"
                >
                  {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another'}
                </button>
              </motion.div>
            ) : (
              <div key="form" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('first_name')}</label>
                    <input 
                      required
                      type="text" 
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('last_name')}</label>
                    <input 
                      type="text" 
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                    {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none" 
                    placeholder="+971 -- --- ----"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('email')}</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{t('message')}</label>
                  <textarea 
                    required
                    rows={4} 
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none resize-none"
                  ></textarea>
                </div>
                
                {submitStatus === 'error' && (
                  <p className="text-red-500 text-sm font-medium px-1">
                    {lang === 'ar' ? 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'Failed to send message. Please try again.'}
                  </p>
                )}

                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                    </>
                  ) : (
                    t('send_inquiry')
                  )}
                </button>
              </div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full h-[500px] rounded-[3rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative group"
      >
        <div className="absolute top-8 right-8 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'ar' ? 'مقرنا' : 'Our HQ'}</p>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase mb-1">{lang === 'ar' ? 'سبورت سوسيتي مول' : 'Sport Society Mall'}</h3>
          <p className="text-sm text-zinc-500">{lang === 'ar' ? 'مردف، دبي' : 'Mirdif, Dubai'}</p>
        </div>
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4441.306804334587!2d55.4081068!3d25.222000299999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43fbe01575e5%3A0xfad1b6ee64ef2244!2sAuthentic%20Holiday%20Homes!5e1!3m2!1sen!2sae!4v1779098373808!5m2!1sen!2sae" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          className="grayscale dark:invert opacity-80 group-hover:grayscale-0 group-hover:opacity-100 dark:group-hover:invert-0 transition-all duration-700"
        ></iframe>
      </motion.div>
    </div>
  );
}
