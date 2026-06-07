import React, { useState } from 'react';
import { Mail, Phone, MapPin, Star, MessageSquare, ExternalLink, Loader2, CheckCircle, Navigation, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Contact() {
  const { t, lang } = useSettings();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'host' || user?.email?.toLowerCase() === 'fakharalimirza@gmail.com';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [agreeContact, setAgreeContact] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setStatusMsg(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
      return;
    }

    if (!agreeContact) {
      setStatus('error');
      setStatusMsg(lang === 'ar' ? 'يرجى الموافقة على رغبتك بالاتصال بك للمتابعة.' : 'Please agree to be contacted back to submit form.');
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
        setAgreeContact(false);
      } else {
        setStatus('error');
        setStatusMsg(data.error || (lang === 'ar' ? 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'Failed to send message. Please try again.'));
      }
    } catch (error) {
      console.error('Contact Form Submit Error:', error);
      setStatus('error');
      setStatusMsg(lang === 'ar' ? 'حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.' : 'A network error occurred. Please try again.');
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

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between relative overflow-hidden h-full min-h-[600px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
                  {lang === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-550 font-semibold tracking-wider">
                  {lang === 'ar' ? 'سنتصل بك في غضون 24 ساعة' : 'WE WILL RESPOND WITHIN 24 HOURS'}
                </p>
              </div>
            </div>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-20 space-y-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {lang === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message Sent Successfully!'}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                  {lang === 'ar' 
                    ? 'شكراً لتواصلك معنا. لقد استلمنا استفسارك وسيقوم أحد مستشارينا بالتواصل معك قريباً.' 
                    : 'Thank you for reaching out. We have received your inquiry and one of our dedicated holiday home consultants will contact you shortly.'
                  }
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all uppercase tracking-wider"
                >
                  {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-455 dark:text-zinc-500 uppercase tracking-widest block">
                    {lang === 'ar' ? 'الاسم بالكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'e.g. John Doe'}
                    className="w-full px-4.5 py-3.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-455 dark:text-zinc-500 uppercase tracking-widest block">
                    {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full px-4.5 py-3.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40 transition-all ltr:text-left rtl:text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-455 dark:text-zinc-500 uppercase tracking-widest block">
                    {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+971 50 000 0000"
                    className="w-full px-4.5 py-3.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-455 dark:text-zinc-500 uppercase tracking-widest block">
                    {lang === 'ar' ? 'الرسالة أو الاستفسار *' : 'Your Message *'}
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'اكتب تفاصيل استفسارك هنا...' : 'How can we help you today? Provide details on property type, dates, or guests...'}
                    className="w-full px-4.5 py-3.5 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40 transition-all resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeContact"
                      name="agreeContact"
                      type="checkbox"
                      required
                      checked={agreeContact}
                      onChange={(e) => setAgreeContact(e.target.checked)}
                      className="w-4 h-4 rounded text-brand border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 focus:ring-brand/50 cursor-pointer accent-brand"
                    />
                  </div>
                  <label htmlFor="agreeContact" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium select-none cursor-pointer leading-snug">
                    {lang === 'ar' 
                      ? 'أوافق على التواصل معي من قبل فريق Authentic Holiday Homes بشأن استفساري.' 
                      : 'I agree to be contacted back by Authentic Holiday Homes team regarding my inquiry.'}
                  </label>
                </div>

                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-xs font-semibold"
                  >
                    {statusMsg}
                  </motion.div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-4 bg-brand hover:bg-brand/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand/15 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {lang === 'ar' ? 'جاري إرسال الاستفسار...' : 'Sending Inquiry...'}
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        {lang === 'ar' ? 'إرسال الرسالة الإلكترونية' : 'Send Message'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full h-[500px] rounded-[3rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative group bg-zinc-50 dark:bg-zinc-950"
      >
        {/* HQ Address Box / Directions Console */}
        <div className="absolute top-4 right-4 left-4 sm:top-8 sm:right-8 sm:left-auto z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{lang === 'ar' ? 'مقرنا' : 'Our HQ'}</p>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase mb-1">{lang === 'ar' ? 'سبورت سوسيتي مول' : 'Sport Society Mall'}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{lang === 'ar' ? 'مردف، دبي' : 'Mirdif, Dubai'}</p>
          <a
            href="https://www.google.com/maps/place/Authentic+Holiday+Homes/@25.2220003,55.4081068,17z/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-brand hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg shadow-brand/15 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Navigation size={14} className="shrink-0 animate-pulse" />
            {lang === 'ar' ? 'البدء بالاتجاهات' : 'Get Directions'}
          </a>
        </div>

        <div className="relative w-full h-full overflow-hidden">
          {/* Beautiful static map snapshot locally stored */}
          <img 
            src="/map.webp" 
            alt="Mirdif Dubai Map Snapshot for Authentic Holiday Homes" 
            className="absolute inset-0 w-full h-full object-cover transition-all duration-750 select-none pointer-events-none filter lg:grayscale lg:contrast-[1.05] lg:brightness-95 lg:opacity-90 lg:group-hover:scale-105 lg:group-hover:grayscale-0 lg:group-hover:opacity-100 lg:group-hover:brightness-100" 
            referrerPolicy="no-referrer"
          />

          {/* Subtle Gradient Overlays for High Luxury Feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

          {/* Glowing active site icon marker aligned precisely in the center representing our headquarters */}
          <div className="absolute left-[50%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing brand indicator halos */}
              <div className="w-20 h-20 bg-brand/25 rounded-full animate-ping absolute" />
              <div className="w-12 h-12 bg-brand/15 rounded-full animate-pulse absolute" />
              
              {/* Pulsing Site Logo Container */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.12, 1],
                  boxShadow: [
                    "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
                    "0 20px 25px -5px rgba(190, 24, 74, 0.35), 0 8px 10px -6px rgba(190, 24, 74, 0.3)",
                    "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)"
                  ]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center p-2.5 shadow-2xl border border-zinc-200/50 dark:border-zinc-800/80 group-hover:scale-105 transition-all duration-300 relative z-10"
              >
                <img 
                  src="/icon.png" 
                  alt="Authentic Holiday Homes Icon" 
                  className="w-full h-full object-contain pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
