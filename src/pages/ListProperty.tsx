import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, TrendingUp, Calendar, Home, Wallet, ShieldCheck, ArrowRight, Sparkles, Layout } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Card = ({ title, text, icon }: { title: string, text: string, icon: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-brand/30 transition-all group"
  >
    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-brand mb-6 shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">{title}</h3>
    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{text}</p>
  </motion.div>
);

const Step = ({ number, title, text }: { number: string, title: string, text: string }) => (
  <div className="flex gap-6 md:gap-10">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-full border-2 border-brand flex items-center justify-center text-brand font-bold text-lg shrink-0">
        {number}
      </div>
      <div className="w-px h-full bg-zinc-200 dark:bg-zinc-800 my-4" />
    </div>
    <div className="pb-12">
      <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-tighter">{title}</h4>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">{text}</p>
    </div>
  </div>
);

export default function ListProperty() {
  const { lang } = useSettings();
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-32 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-32">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-[10px] font-bold uppercase tracking-widest mb-8">
              <Sparkles size={14} />
              {lang === 'ar' ? 'شارك الأفضل' : 'Partner with the Best'}
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-zinc-900 dark:text-white leading-[0.9] mb-8 uppercase">
              {lang === 'ar' ? 'افتح إمكانيات' : 'Unlock the Rental'} <br />
              <span className="text-brand italic text-4xl md:text-7xl">{lang === 'ar' ? 'عقارك الإيجارية' : 'Potential of Your Property'}</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
              {lang === 'ar' ? 'اكتشف مزايا الإيجارات قصيرة الأجل مقارنة بالإيجار السنوي التقليدي وارتقِ باستثمارك العقاري مع أوثينتيك هوليداي هومز.' : 'Discover the advantages of short-term rentals over traditional yearly leasing and elevate your property investment to new heights with Authentic Holiday Homes.'}
            </p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
            >
              <img 
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000" 
                alt="Luxury Property" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50 rounded-[4rem] mx-4 mb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-20">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase mb-4">
                The Journey to <br />
                <span className="text-brand italic">Holiday Home Success</span>
              </h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">A transparent process from start to finish</p>
            </div>

            <div className="space-y-0">
              <Step 
                number="01" 
                title="Landlord Signs Contract" 
                text="The landlord initiates the process by signing a management contract with Authentic Holiday Homes LLC, outlining our partnership and shared goals." 
              />
              <div className="flex gap-6 md:gap-10">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-brand flex items-center justify-center text-brand font-bold text-lg shrink-0">02</div>
                  <div className="w-px h-full bg-zinc-200 dark:bg-zinc-800 my-4" />
                </div>
                <div className="pb-12 flex-1">
                  <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-tighter">DTCM Registration</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">We handle the DTCM (Dubai Tourism and Commerce Marketing) registration on your behalf. Permit is issued once the apartment matches professional standards.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: "Studio", fee: "AED 370" },
                      { type: "1 Bedroom", fee: "AED 370" },
                      { type: "2 Bedroom", fee: "AED 670" },
                      { type: "3 Bedroom", fee: "AED 970" }
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.type}</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.fee}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] text-zinc-400 uppercase tracking-widest italic font-medium">* Note: Permit requires furnishing according to DTCM standards.</p>
                </div>
              </div>
              <Step 
                number="03" 
                title="Property Transformation" 
                text="We arrange professional photography and videography to showcase your property in its best light across all global booking platforms." 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="container mx-auto px-4 mb-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase mb-4">
            Short-Term VS <br />
            <span className="text-brand italic">Yearly Rental</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card 
            icon={<TrendingUp size={24} />}
            title="Increased Revenue"
            text="Generate 15%-25% more revenue compared to yearly rentals, significantly boosting your overall investment returns."
          />
          <Card 
            icon={<Home size={24} />}
            title="Flexible Living"
            text="Move into your property whenever you desire. You maintain control and the ultimate flexibility over your own asset."
          />
          <Card 
            icon={<Wallet size={24} />}
            title="Consistent Returns"
            text="Experience consistent monthly income through our optimized booking management, providing financial stability."
          />
          <Card 
            icon={<ShieldCheck size={24} />}
            title="Expert Maintenance"
            text="Our management ensures your property stays in tiptop condition with regular inspections and professional cleaning."
          />
          <Card 
            icon={<Layout size={24} />}
            title="Sale at Any Time"
            text="Enjoy the freedom to sell your unit whenever you choose, without being tied down by a long-term lease agreement."
          />
          <Card 
            icon={<Calendar size={24} />}
            title="Real-time Insights"
            text="Access our exclusive web portal to track booking status and performance metrics in real-time, from anywhere."
          />
        </div>
      </section>

      {/* Commission Section */}
      <section className="py-24 bg-brand rounded-[4rem] mx-4 mb-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter uppercase leading-[0.9] mb-8">
              {lang === 'ar' ? 'نحن نهتم بـ' : 'We Take Care of'} <span className="text-zinc-900 italic">{lang === 'ar' ? 'كل شيء' : 'Everything'}</span>
            </h2>
            <p className="text-white/80 text-xl font-medium mb-12">
              Our comprehensive 15% commission covers the entire end-to-end management, so you can enjoy passive income without the hassle.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {[
                { title: "Property Marketing", text: "Promoting through high-quality photos/videos on global channels." },
                { title: "Linen Services", text: "Regular supply of fresh premium linens and bath towels." },
                { title: "Guest Management", text: "Full check-in/out services for a seamless guest experience." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
                  <CheckCircle2 className="text-white shrink-0" />
                  <div>
                    <h4 className="text-white font-bold uppercase tracking-tight mb-2">{item.title}</h4>
                    <p className="text-white/60 text-sm">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-10 tracking-tighter uppercase">{lang === 'ar' ? 'جاهز للبدء؟' : 'Ready to Start?'}</h2>
        <Link 
          to="/contact" 
          className="inline-flex items-center gap-3 px-10 py-5 bg-brand text-white rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl group"
        >
          {lang === 'ar' ? 'تواصل مع فريقنا' : 'Contact Our Team'} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </section>
    </div>
  );
}
