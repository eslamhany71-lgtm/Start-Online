const translations = {
    ar: {
        nav_home: "الرئيسية",
        nav_store: "المتجر",
        nav_profile: "حسابي",
        nav_start: "ابدأ الآن",
        nav_dashboard: "لوحة التحكم",
        logout: "خروج",
        lang_btn: "English",
        hero_title: "مستقبلك الرقمي <br> يبدأ بلمسة",
        hero_desc: "انضم لأكبر منصة عربية للمنتجات الرقمية. ابدأ رحلتك الاحترافية اليوم.",
        btn_browse: "تصفح المتجر",
        btn_marketer: "لوحة المسوقين",
        btn_be_marketer: "كن مسوقاً معنا",
        wallet_title: "المحفظة الذكية",
        wallet_balance: "أرباحي المستحقة:",
        wallet_debt: "عمولة المنصة (10%):",
        admin_panel_title: "إدارة المسوقين والديون",
        th_marketer: "المسوق",
        th_debt: "المديونية",
        th_action: "الإجراء",
        btn_settle: "تم الاستحقاق",
        orders_track: "طلباتي المشترية",
        orders_incoming: "الطلبات الواردة",
        order_details_btn: "تفاصيل",
        order_status_pending: "قيد الانتظار",
        order_status_completed: "تم التسليم",
        order_status_failed: "ملغاة",
        dir: "rtl",
        font: "'Cairo', sans-serif"
    },
    en: {
        nav_home: "Home",
        nav_store: "Store",
        nav_profile: "Profile",
        nav_start: "Start Now",
        nav_dashboard: "Dashboard",
        logout: "Logout",
        lang_btn: "العربية",
        hero_title: "Your Digital Future <br> Starts Here",
        hero_desc: "Join the largest Arabic digital products platform. Start your career today.",
        btn_browse: "Browse Store",
        btn_marketer: "Marketer Hub",
        btn_be_marketer: "Become a Marketer",
        wallet_title: "Smart Wallet",
        wallet_balance: "Net Earnings:",
        wallet_debt: "Platform Fee (10%):",
        admin_panel_title: "Marketer Management",
        th_marketer: "Marketer",
        th_debt: "Debt",
        th_action: "Action",
        btn_settle: "Settle",
        orders_track: "My Purchases",
        orders_incoming: "Incoming Orders",
        order_details_btn: "Details",
        order_status_pending: "Pending",
        order_status_completed: "Completed",
        order_status_failed: "Failed",
        dir: "ltr",
        font: "'Inter', sans-serif"
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
    const langLabel = document.getElementById('langLabel');
    if(langLabel) langLabel.innerText = t.lang_btn;
}

window.setLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'ar';
    applyLanguage(savedLang);
});
