import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ar';
type Theme = 'light' | 'dark';

interface SettingsContextType {
  lang: Language;
  theme: Theme;
  setLang: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    hero_title: "Discover the Extraordinary",
    hero_subtitle: "Curated collection of Dubai's most prestigious holiday residences.",
    search_placeholder: "Search Dubai neighborhoods...",
    search_btn: "Search",
    book_now: "Book Now",
    wishlist: "Wishlist",
    my_bookings: "My Bookings",
    admin_panel: "Admin Panel",
    sign_in: "Sign In",
    sign_out: "Sign Out",
    night: "Dirham",
    total: "Total",
    reviews: "Reviews",
    amenities: "Amenities",
    description: "Description",
    location: "Location",
    availability: "Availability",
    chat: "Chat with Host",
    no_results: "No properties found in Dubai.",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",
    english: "English",
    arabic: "Arabic",
    properties: "Properties",
    about: "About Us",
    contact: "Contact Us",
    list_your_property: "List Your Property",
    explore_all: "Explore All",
    featured_collection: "Featured Collection",
    curated_homes: "Curated Holiday Homes",
    emirati_hospitality: "Emirati Hospitality",
    authentic_dubai_exp: "Authentic Dubai Experience",
    redefining_luxury: "Redefining luxury since 2021 as a home-grown Emirati company committed to excellence.",
    ceo_title: "CEO, Authentic Holiday Homes",
    why_choose_us: "Why Choose Us",
    our_commitment: "Our Commitment",
    long_term_trust: "Long-term Trust",
    properties_count: "200+ Properties",
    our_teams: "Our Teams",
    leasing_team: "Leasing Team",
    admin_team: "Admin Team",
    maintenance_team: "Maintenance & Cleaning",
    ready_to_experience: "Ready to experience the authentic Dubai?",
    call_us_today: "Call Us Today",
    get_in_touch: "Get in Touch",
    support_msg: "Our team is dedicated to providing you with 24/7 premium support.",
    email_us: "Email Us",
    call_us: "Call Us",
    visit_us: "Visit Us",
    write_review: "Write a Review",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    message: "Message",
    send_inquiry: "Send Inquiry",
    maximize_revenue: "Maximize Your Property Revenue",
    property_owners_msg: "Join Dubai's most prestigious holiday home network and let our experts handle everything.",
    onboarding: "Onboarding",
    distribution: "Distribution",
    optimization: "Optimization"
  },
  ar: {
    hero_title: "اكتشف الاستثنائي",
    hero_subtitle: "مجموعة منسقة من أرقى مساكن العطلات في دبي.",
    search_placeholder: "ابحث في أحياء دبي...",
    search_btn: "بحث",
    book_now: "احجز الآن",
    wishlist: "قائمة الرغبات",
    my_bookings: "حجوزاتي",
    admin_panel: "لوحة التحكم",
    sign_in: "تسجيل الدخول",
    sign_out: "تسجيل الخروج",
    night: "درهم",
    total: "إجمالي",
    reviews: "التقييمات",
    amenities: "المرافق",
    description: "الوصف",
    location: "الموقع",
    availability: "التوافر",
    chat: "تحدث مع المضيف",
    no_results: "لم يتم العثور على عقارات في دبي.",
    dark_mode: "الوضع المظلم",
    light_mode: "الوضع المضيء",
    english: "الإنجليزية",
    arabic: "العربية",
    properties: "العقارات",
    about: "من نحن",
    contact: "اتصل بنا",
    list_your_property: "اعرض عقارك",
    explore_all: "استكشف الكل",
    featured_collection: "المجموعة المختارة",
    curated_homes: "منازل عطلات مميزة",
    emirati_hospitality: "ضيافة إماراتية",
    authentic_dubai_exp: "تجربة دبي الأصيلة",
    redefining_luxury: "إعادة تعريف الفخامة منذ عام 2021 كشركة إماراتية محلية ملتزمة بالتميز.",
    ceo_title: "الرئيس التنفيذي، أوثينتيك هوليداي هومز",
    why_choose_us: "لماذا تختارنا",
    our_commitment: "التزامنا",
    long_term_trust: "ثقة طويلة الأمد",
    properties_count: "أكثر من 200 عقار",
    our_teams: "فرق عملنا",
    leasing_team: "فريق التأجير",
    admin_team: "الفريق الإداري",
    maintenance_team: "الصيانة والتنظيف",
    ready_to_experience: "مستعد لتجربة دبي الأصيلة؟",
    call_us_today: "اتصل بنا اليوم",
    get_in_touch: "تواصل معنا",
    support_msg: "فريقنا مخصص لتزويدك بدعم متميز على مدار الساعة طوال أيام الأسبوع.",
    email_us: "راسلنا بالبريد",
    call_us: "اتصل بنا",
    visit_us: "زورونا",
    write_review: "اكتب تقييماً",
    first_name: "الاسم الأول",
    last_name: "اسم العائلة",
    email: "البريد الإلكتروني",
    message: "الرسالة",
    send_inquiry: "إرسال الاستفسار",
    maximize_revenue: "عظم عوائد عقارك",
    property_owners_msg: "انضم إلى أرقى شبكة لمنازل العطلات في دبي ودع خبراؤنا يتولون كل شيء.",
    onboarding: "الانضمام",
    distribution: "التوزيع",
    optimization: "التحسين"
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  const t = (key: string) => translations[lang][key] || key;

  return (
    <SettingsContext.Provider value={{ lang, theme, setLang, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
