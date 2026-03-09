const translations = {
    ar: {
        nav_home: "الرئيسية",
        nav_store: "المتجر",
        nav_profile: "حسابي",
        nav_start: "ابدأ الآن",
        nav_dashboard: "لوحة التحكم",
        hero_title: "مستقبلك الرقمي <br> يبدأ بلمسة",
        hero_desc: "انضم لأكبر منصة عربية لعرض وبيع المنتجات الرقمية. نحن نوفر لك لوحة تحكم ذكية مدعومة بتقنيات السحاب، لتُبدع في عالمك الخاص.",
        btn_browse: "تصفح المتجر",
        btn_marketer: "لوحة المسوقين",
        btn_be_marketer: "كن مسوقاً معنا",
        dir: "rtl",
        font: "'Cairo', sans-serif"
    },
    en: {
        nav_home: "Home",
        nav_store: "Store",
        nav_profile: "Profile",
        nav_start: "Start Now",
        nav_dashboard: "Dashboard",
        hero_title: "Your Digital Future <br> Starts with a Touch",
        hero_desc: "Join the largest platform for digital products. We provide a smart cloud-powered dashboard to help you excel in your own world.",
        btn_browse: "Browse Shop",
        btn_marketer: "Marketer Hub",
        btn_be_marketer: "Become a Marketer",
        dir: "ltr",
        font: "'Inter', sans-serif" // ممكن تستخدم خط أجنبي أنحف
    }
};

function applyLanguage(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (t[key]) {
            if (el.tagName === 'INPUT') el.placeholder = t[key];
            else el.innerHTML = t[key];
        }
    });
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    document.body.style.fontFamily = t.font;
}

window.setLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    location.reload(); // إعادة التحميل لضبط الاتجاهات والخطوط بشكل سليم
};

// تشغيل اللغة المختارة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'ar';
    applyLanguage(savedLang);
});
// أضف هذه المفاتيح لملف الترجمة القديم
translations.ar = {
    ...translations.ar, // يحافظ على القديم
    shop_title: "المتجر الذكي",
    search_placeholder: "ابحث عن منتجك المفضل...",
    cat_all: "الكل",
    cat_clothes: "ملابس",
    cat_acc: "إكسسوارات",
    cat_perfume: "عطور",
    cat_beauty: "صحة وجمال",
    cat_best: "أكثر مبيعاً",
    cart_title: "سلة المشتريات",
    cart_total: "الإجمالي التقديري:",
    btn_details: "التفاصيل والتقييمات",
    publish_title: "نشر إبداع جديد",
    logout: "خروج"
};

translations.en = {
    ...translations.en,
    shop_title: "Smart Store",
    search_placeholder: "Search for your favorite product...",
    cat_all: "All",
    cat_clothes: "Clothes",
    cat_acc: "Accessories",
    cat_perfume: "Perfumes",
    cat_beauty: "Beauty",
    cat_best: "Best Sellers",
    cart_title: "Shopping Cart",
    cart_total: "Estimated Total:",
    btn_details: "Details & Reviews",
    publish_title: "Publish New Product",
    logout: "Logout"
};
