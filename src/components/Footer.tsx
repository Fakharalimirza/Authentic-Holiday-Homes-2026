import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import Logo from './Logo';
import { Instagram, Facebook, Linkedin, Twitter, Youtube, MessageCircle } from 'lucide-react';

export default function Footer() {
  const { t, lang } = useSettings();
  const { settings } = useGlobalSettings();

  const socialLinks = [
    {
      url: settings?.socialInstagram,
      icon: <Instagram size={18} />,
      label: 'Instagram'
    },
    {
      url: settings?.socialFacebook,
      icon: <Facebook size={18} />,
      label: 'Facebook'
    },
    {
      url: settings?.socialLinkedin,
      icon: <Linkedin size={18} />,
      label: 'LinkedIn'
    },
    {
      url: settings?.socialTwitter,
      icon: <Twitter size={18} />,
      label: 'Twitter'
    },
    {
      url: settings?.socialYoutube,
      icon: <Youtube size={18} />,
      label: 'YouTube'
    },
    {
      url: settings?.socialTiktok,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      ),
      label: 'TikTok'
    },
    {
      url: settings?.socialSnapchat,
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-[18px] h-[18px]">
          <path d="M15.943 11.526c-.111-.303-.323-.465-.564-.599a1 1 0 0 0-.123-.064l-.219-.111c-.752-.399-1.339-.902-1.746-1.498a3.4 3.4 0 0 1-.3-.531c-.034-.1-.032-.156-.008-.207a.3.3 0 0 1 .097-.1c.129-.086.262-.173.352-.231.162-.104.289-.187.371-.245.309-.216.525-.446.66-.702a1.4 1.4 0 0 0 .069-1.16c-.205-.538-.713-.872-1.329-.872a1.8 1.8 0 0 0-.487.065c.006-.368-.002-.757-.035-1.139-.116-1.344-.587-2.048-1.077-2.61a4.3 4.3 0 0 0-1.095-.881C9.764.216 8.92 0 7.999 0s-1.76.216-2.505.641c-.412.232-.782.53-1.097.883-.49.562-.96 1.267-1.077 2.61-.033.382-.04.772-.036 1.138a1.8 1.8 0 0 0-.487-.065c-.615 0-1.124.335-1.328.873a1.4 1.4 0 0 0 .067 1.161c.136.256.352.486.66.701.082.058.21.14.371.246l.339.221a.4.4 0 0 1 .109.11c.026.053.027.11-.012.217a3.4 3.4 0 0 1-.295.52c-.398.583-.968 1.077-1.696 1.472-.385.204-.786.34-.955.8-.128.348-.044.743.28 1.075q.18.189.409.31a4.4 4.4 0 0 0 1 .4.7.7 0 0 1 .202.09c.118.104.102.26.259.488q.12.178.296.3c.33.229.701.243 1.095.258.355.014.758.03 1.217.18.19.064.389.186.618.328.55.338 1.305.802 2.566.802 1.262 0 2.02-.466 2.576-.806.227-.14.424-.26.609-.321.46-.152.863-.168 1.218-.181.393-.015.764-.03 1.095-.258a1.14 1.14 0 0 0 .336-.368c.114-.192.11-.327.217-.42a.6.6 0 0 1 .19-.087 4.5 4.5 0 0 0 1.014-.404c.16-.087.306-.2.429-.336l.004-.005c.304-.325.38-.709.256-1.047m-1.121.602c-.684.378-1.139.337-1.493.565-.3.193-.122.61-.34.76-.269.186-1.061-.012-2.085.326-.845.279-1.384 1.082-2.903 1.082s-2.045-.801-2.904-1.084c-1.022-.338-1.816-.14-2.084-.325-.218-.15-.041-.568-.341-.761-.354-.228-.809-.187-1.492-.563-.436-.24-.189-.39-.044-.46 2.478-1.199 2.873-3.05 2.89-3.188.022-.166.045-.297-.138-.466-.177-.164-.962-.65-1.18-.802-.36-.252-.52-.503-.402-.812.082-.214.281-.295.49-.295a1 1 0 0 1 .197.022c.396.086.78.285 1.002.338q.04.01.082.011c.118 0 .16-.06.152-.195-.026-.433-.087-1.277-.019-2.066.094-1.084.444-1.622.859-2.097.2-.229 1.137-1.22 2.93-1.22 1.792 0 2.732.987 2.931 1.215.416.475.766 1.013.859 2.098.068.788.009 1.632-.019 2.065-.01.142.034.195.152.195a.4.4 0 0 0 .082-.01c.222-.054.607-.253 1.002-.338a1 1 0 0 1 .197-.023c.21 0 .409.082.49.295.117.309-.04.56-.401.812-.218.152-1.003.638-1.18.802-.184.169-.16.3-.139.466.018.14.413 1.991 2.89 3.189.147.073.394.222-.041.464" />
        </svg>
      ),
      label: 'Snapchat'
    }
  ].filter(item => item.url && item.url.trim() !== '');
  
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
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                {socialLinks.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.label}
                    className="w-10 h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-brand hover:border-brand hover:bg-brand/5 dark:hover:bg-brand/10 transition-all shadow-sm"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}
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
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
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
