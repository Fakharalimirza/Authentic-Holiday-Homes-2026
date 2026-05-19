import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import Logo from './Logo';
import { Instagram, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';

export default function Footer() {
  const { t, lang } = useSettings();
  
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 pt-24 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 mb-20">
          {/* Logo & About */}
          <div className="md:col-span-4 space-y-8 text-center md:text-start flex flex-col items-center md:items-start">
            <Link to="/" className="inline-block hover:scale-105 transition-transform">
              <Logo />
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              {lang === 'ar' 
                ? "أهلاً بكم في أوثينتيك هوليداي هومز للشقق الفاخرة. نعيد تعريف الفخامة في قلب دبي. نحن نوفر جوًا مجتمعيًا في بيئة متخصصة." 
                : "Welcome to Authentic Holiday Homes Luxury Apartments. Redefining luxury in the heart of Dubai. We provide a community-feel atmosphere in a specialized environment."}
            </p>
            <div className="flex items-center gap-4">
              {[Instagram, Facebook, Linkedin, Twitter].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-10 h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-brand hover:border-brand hover:bg-brand/5 dark:hover:bg-brand/10 transition-all shadow-sm"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Groups */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-12 text-center sm:text-start">
            <div className="space-y-6">
              <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'التجربة' : 'Experience'}</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><Link to="/" className="hover:text-brand transition-colors">{lang === 'ar' ? 'فلل في دبي' : 'Villas in Dubai'}</Link></li>
                <li><Link to="/" className="hover:text-brand transition-colors">{lang === 'ar' ? 'شقق فاخرة' : 'Luxury Apartments'}</Link></li>
                <li><Link to="/" className="hover:text-brand transition-colors">{lang === 'ar' ? 'بنتهاوس حصرية' : 'Exclusive Penthouses'}</Link></li>
                <li><Link to="/list-your-property" className="text-brand font-bold hover:underline">{t('list_your_property')}</Link></li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-[10px]">{lang === 'ar' ? 'الشركة' : 'Company'}</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><Link to="/about" className="hover:text-brand transition-colors">{lang === 'ar' ? 'قصتنا' : 'Our Story'}</Link></li>
                <li><Link to="/contact" className="hover:text-brand transition-colors">{t('contact')}</Link></li>
                <li><Link to="/privacy" className="hover:text-brand transition-colors">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
                <li><Link to="/terms" className="hover:text-brand transition-colors">{lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-6 flex flex-col items-center sm:items-start text-center sm:text-start">
              <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-[10px]">{t('contact')}</h4>
              <div className="text-sm text-zinc-500 leading-relaxed space-y-4">
                <p>{lang === 'ar' ? 'A202 - سبورت سوسيتي مول - مردف، دبي' : 'A202 – Sport Society Mall – Mirdif, Dubai'}</p>
                <div className="space-y-1">
                  <a href="mailto:info@authenticholidayhomes.ae" className="block hover:text-brand transition-colors" dir="ltr">info@authenticholidayhomes.ae</a>
                  <a href="tel:+97142866788" className="block hover:text-brand transition-colors" dir="ltr">+971 4 286 6788</a>
                </div>
                <a 
                  href="https://wa.me/971569969332" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-600 rounded-full text-xs font-bold hover:bg-green-500 hover:text-white transition-all shadow-sm"
                >
                  <MessageCircle size={14} />
                  {lang === 'ar' ? 'راسلنا واتساب' : 'WhatsApp Us'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center md:text-start">
            © 2026 {lang === 'ar' ? 'أوثينتيك هوليداي هومز' : 'AUTHENTIC HOLIDAY HOMES'}. {lang === 'ar' ? 'مرخص من قبل DTCM' : 'LICENSED BY DTCM'}.
          </p>
          <div className="flex items-center gap-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <Link to="/admin" className="hover:text-brand transition-colors">{lang === 'ar' ? 'لوحة المشرف' : 'Admin Portal'}</Link>
            <span className="hidden md:block w-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <span className="hidden md:block">{lang === 'ar' ? 'دبي، الإمارات' : 'Dubai, UAE'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
