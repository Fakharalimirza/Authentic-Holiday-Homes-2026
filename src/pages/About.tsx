import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Quote, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const TeamCard = ({ name, role, image, small = false }: { name: string, role: string, image: string, small?: boolean }) => (
  <div className={`${small ? 'w-[200px]' : 'w-[280px]'} shrink-0 p-2`}>
    <div className="relative aspect-[3/4] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group">
      <img 
        src={image} 
        alt={name} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
        <p className={`${small ? 'text-sm' : 'text-lg'} text-white font-bold uppercase tracking-tight`}>{name}</p>
        <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium">{role}</p>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-12">
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
      <Sparkles size={12} />
      {subtitle}
    </div>
    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase">
      {title}
    </h2>
  </div>
);

const TeamCarousel = ({ members, speed = 30, small = false }: { members: any[], speed?: number, small?: boolean }) => {
  const { lang } = useSettings();
  const isRtl = lang === 'ar';
  
  // Double members for seamless loop
  const displayMembers = [...members, ...members, ...members, ...members];
  const carouselId = React.useId().replace(/:/g, '');
  
  return (
    <div className="relative overflow-hidden py-4">
      <style>{`
        @keyframes marquee-${carouselId} {
          from { transform: translateX(${isRtl ? '-50%' : '0%'}); }
          to { transform: translateX(${isRtl ? '0%' : '-50%'}); }
        }
        .marquee-${carouselId} {
          display: flex;
          width: fit-content;
          animation: marquee-${carouselId} ${speed}s linear infinite;
        }
        .marquee-${carouselId}:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className={`marquee-${carouselId}`}>
        {displayMembers.map((member, i) => (
          <TeamCard key={i} {...member} small={small} />
        ))}
      </div>
      {/* Decorative gradients for edges - lighter for smaller carousels */}
      <div className={`absolute inset-y-0 left-0 ${small ? 'w-16' : 'w-32'} bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none`} />
      <div className={`absolute inset-y-0 right-0 ${small ? 'w-16' : 'w-32'} bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none`} />
    </div>
  );
};

export default function About() {
  const { t, lang } = useSettings();
  const navigate = useNavigate();
  const leasingTeam = [
    { name: "Sarah J.", role: "Leasing Specialist", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
    { name: "Omar K.", role: "Leasing Consultant", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
    { name: "Elena V.", role: "Portfolio Manager", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" },
  ];

  const adminTeam = [
    { name: "Layla R.", role: "Operations Lead", image: "https://images.unsplash.com/photo-1598550874175-4d0fe4a2c90b?auto=format&fit=crop&q=80&w=400" },
    { name: "Ahmed F.", role: "Customer Excellence", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400" },
    { name: "Maria S.", role: "Property Coordinator", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400" },
    { name: "John D.", role: "Admin Support", image: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=400" },
    { name: "Sofia H.", role: "Billing Specialist", image: "https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&q=80&w=400" },
  ];

  const maintenanceTeam = [
    { name: "Staff 1", role: "Team Lead", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 2", role: "Specialist", image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 3", role: "Technician", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 4", role: "Expert", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 5", role: "Support", image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 6", role: "Coordinator", image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 7", role: "Property Care", image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=400" },
    { name: "Staff 8", role: "Maintenance", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-32 pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center overflow-hidden mb-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=2000" 
            alt="Dubai Skyline" 
            className="w-full h-full object-cover grayscale opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-zinc-950 dark:to-zinc-950" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <ShieldCheck size={14} />
              {t('emirati_hospitality')}
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900 dark:text-white leading-[0.9] mb-8 uppercase">
              Authentic <br />
              <span className="text-brand italic">Dubai</span> {lang === 'ar' ? 'تجربة' : 'Experience'}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl font-medium leading-relaxed">
              {t('redefining_luxury')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CEO Section */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] mx-4 mb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[3rem] overflow-hidden group shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" 
                alt="Ahmed Al Doulah - CEO" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-brand/10 mix-blend-overlay" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Quote size={48} className="text-brand opacity-20" />
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
                  {lang === 'ar' ? 'مرحباً، أنا' : 'Hello, it’s me,'} <br />
                  <span className="text-brand">Ahmed Al Doulah</span>
                </h2>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest italic">{t('ceo_title')}</p>
              </div>
              
              <div className="space-y-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                <p>Welcome to Authentic Holiday Homes! The local Emirati company. Me and my team are here to make sure that you have the perfect stay in Dubai.</p>
                <p>We aim to create a comfortable and beautiful luxurious new place for you, away from home. We feel proud to manage more than 200 properties across Dubai.</p>
                <p>We hope to see you soon so we can take care of you and make sure you have a wonderful stay. Always available for you, we’ll make sure that you have a memorable stay with us!</p>
              </div>
              
              <div className="pt-4">
                <p className="text-zinc-900 dark:text-white font-bold text-xl font-display italic">Thank You</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 mb-20">
        <div className="container mx-auto px-4">
          <SectionHeader 
            subtitle={t('our_commitment')} 
            title={t('why_choose_us')} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <ShieldCheck size={32} />, title: t('emirati_hospitality'), text: lang === 'ar' ? 'بصفتنا شركة إماراتية محلية، نقدم خدمات ضيافة موثوقة متجذرة في ثقافتنا.' : "As a local Emirati company, we provide reliable hospitality services rooted in our culture." },
              { icon: <Heart size={32} />, title: t('long_term_trust'), text: lang === 'ar' ? 'ملتزمون بعلاقات طويلة الأمد من خلال التركيز على التفاصيل وتوقعات عملائنا السعداء.' : "Committed to long term relationships by focusing on the details and expectations of our happy customers." },
              { icon: <Sparkles size={32} />, title: t('properties_count'), text: lang === 'ar' ? 'إعادة تعريف الفخامة منذ عام 2021 مع جو مجتمعي حصري في بيئات متخصصة.' : "Redefining luxury since 2021 with an exclusive community-feel atmosphere in specialized environments." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] hover:bg-brand/5 dark:hover:bg-brand/10 transition-colors border border-zinc-100 dark:border-zinc-800"
              >
                <div className="text-brand mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Manager Section */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] mx-4 mb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row-reverse gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square w-full lg:w-1/2 rounded-[3rem] overflow-hidden group shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800" 
                alt="Mohammad Al Doulah - Manager" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 space-y-8"
            >
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
                <span className="text-brand">Mohammad Al Doulah</span> <br />
                Managed by Passion
              </h2>
              <div className="space-y-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                <p>At Authentic Holiday Homes, we are committed to providing you with an exceptional and memorable stay. Our team is dedicated to ensuring your comfort and satisfaction.</p>
                <p>Whether you seek a tranquil retreat, a vibrant city break, or a family-friendly adventure, we invite you to discover the Authentic Dubai with us.</p>
                <p className="text-zinc-900 dark:text-white font-bold italic pt-4 text-xl">Thank you for choosing us.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Teams Section */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4 mb-16">
          <SectionHeader subtitle={lang === 'ar' ? 'جوهر خدمتنا' : "The Heart of our service"} title={t('our_teams')} />
        </div>

        <div className="container mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Leasing Team */}
            <div>
              <div className="flex justify-between items-end mb-4 px-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h3 className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase">{t('leasing_team')}</h3>
              </div>
              <TeamCarousel members={leasingTeam} speed={30} small={true} />
            </div>

            {/* Admin Team */}
            <div>
              <div className="flex justify-between items-end mb-4 px-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h3 className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase">{t('admin_team')}</h3>
              </div>
              <TeamCarousel members={adminTeam} speed={25} small={true} />
            </div>
          </div>
        </div>

        {/* Maintenance Team - Full Row Carousel */}
        <div className="mb-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-4 px-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-white uppercase">{t('maintenance_team')}</h3>
            </div>
          </div>
          <TeamCarousel members={maintenanceTeam} speed={50} />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 text-center mx-4 bg-brand rounded-[3rem] mb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 tracking-tighter uppercase leading-[0.9]">{t('ready_to_experience')}</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="tel:+971569969332" className="px-10 py-5 bg-white text-brand rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
              {t('call_us_today')}
            </a>
            <Link to="/contact" className="px-10 py-5 border-2 border-white/30 text-white rounded-full font-bold text-lg hover:bg-white hover:text-brand transition-all">
              {t('list_your_property')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
