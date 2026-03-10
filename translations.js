const translations = {
    ar: {
        // Navbar & General
        nav_home: "الرئيسية",
        nav_store: "المتجر",
        nav_profile: "حسابي",
        nav_start: "ابدأ الآن",
        nav_dashboard: "لوحة التحكم",
        logout: "خروج",
        lang_btn: "English",

        // Hero Section (Index)
        hero_title: "مستقبلك الرقمي <br> يبدأ بلمسة",
        hero_desc: "انضم لأكبر منصة عربية لعرض وبيع المنتجات الرقمية. نحن نوفر لك لوحة تحكم ذكية مدعومة بتقنيات السحاب.",
        btn_browse: "تصفح المتجر",
        btn_marketer: "لوحة المسوقين",
        btn_be_marketer: "كن مسوقاً معنا",

        // Profile & Wallet
        wallet_title: "المحفظة الذكية",
        wallet_balance: "أرباحي المستحقة:",
        wallet_debt: "عمولة المنصة (10%):",
        payment_methods_title: "وسائل استلام الأرباح",
        save_wallets: "حفظ المحافظ",
        edit_profile: "تعديل البروفايل",
        wishlist_count: "المفضلة",
        my_products_count: "منتجاتي",

        // Admin Dashboard
        admin_panel_title: "إدارة المسوقين والديون",
        th_marketer: "المسوق",
        th_debt: "المديونية (10%)",
        th_action: "الإجراء",
        btn_settle: "تم الاستحقاق",
        platform_revenue: "أرباح المنصة (10%)",

        // Orders
        orders_track: "تتبع طلباتي المشترية",
        orders_incoming: "إدارة الطلبات الواردة",
        order_details_btn: "تفاصيل",
        order_status_pending: "قيد الانتظار",
        order_status_completed: "تم التسليم",
        order_status_failed: "ملغاة",
        
        // Marketer Request
        join_title: "ابدأ الربح معنا اليوم!",
        join_desc: "كن مسوقاً معتمداً وابدأ بعرض منتجاتك والحصول على دخل إضافي.",
        btn_send_request: "إرسال الطلب الآن",
        placeholder_phone: "رقم الموبايل",
        placeholder_address: "العنوان بالتفصيل",

        dir: "rtl",
        font: "'Cairo', sans-serif"
    },
    en: {
        // Navbar & General
        nav_home: "Home",
        nav_store: "Store",
        nav_profile: "Profile",
        nav_start: "Start Now",
        nav_dashboard: "Dashboard",
        logout: "Logout",
        lang_btn: "العربية",

        // Hero Section (Index)
        hero_title: "Your Digital Future <br> Starts with a Touch",
        hero_desc: "Join the largest Arab platform for digital products. We provide a smart cloud-powered dashboard.",
        btn_browse: "Browse Shop",
        btn_marketer: "Marketer Hub",
        btn_be_marketer: "Become a Marketer",

        // Profile & Wallet
        wallet_title: "Smart Wallet",
        wallet_balance: "Net Earnings:",
        wallet_debt: "Platform Fee (10%):",
        payment_methods_title: "Withdrawal Methods",
        save_wallets: "Save Wallets",
        edit_profile: "Edit Profile",
        wishlist_count: "Favorites",
        my_products_count: "My Products",

        // Admin Dashboard
        admin_panel_title: "Marketers & Debts Management",
        th_marketer: "Marketer",
        th_debt: "Debt (10%)",
        th_action: "Action",
        btn_settle: "Settle Debt",
        platform_revenue: "Platform Profit (10%)",

        // Orders
        orders_track: "Track My Purchases",
        orders_incoming: "Manage Incoming Orders",
        order_details_btn: "Details",
        order_status_pending: "Pending",
        order_status_completed: "Completed",
        order_status_failed: "Failed",

        // Marketer Request
        join_title: "Start Earning Today!",
        join_desc: "Become a certified marketer and start showcasing your products.",
        btn_send_request: "Send Request",
        placeholder_phone: "Phone Number",
        placeholder_address: "Detailed Address",

        dir: "ltr",
        font: "'Inter', sans-serif"
    }
};

function applyLanguage(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else {
                el.innerHTML = t[key];
            }
        }
    });
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    document.body.style.fontFamily = t.font;
    
    // تحديث نص زر اللغة إذا وجد
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
