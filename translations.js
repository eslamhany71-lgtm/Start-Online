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
        font: "'Cairo', sans-serif",
        // قيم صفحة الدخول
        login_btn: "دخول",
        signup_btn: "إنشاء حساب",
        signup_link: "إنشاء حساب",
        login_link: "تسجيل دخول",
        no_account: "ليس لديك حساب؟",
        have_account: "لديك حساب بالفعل؟",
        name_placeholder: "الاسم الكامل",
        email_placeholder: "البريد الإلكتروني",
        pass_placeholder: "كلمة المرور",
        forgot_pass: "نسيت كلمة المرور؟",
        google_btn: "سجل بواسطة جوجل",
        or_via: "أو عبر",
        // داخل translations.ar
        btn_community: "انضم لمجتمعنا",
        logout: "خروج",
                // أضف هذه للقسم العربي ar
        shop_title: "المتجر الذكي",
        cart_title: "سلة المشتريات",
        cart_total: "الإجمالي:",
        btn_shopping: "استكمال التسوق",
        stat_users: "المستخدمين",
        stat_prods: "المنتجات",
        stat_marketers: "المسوقين",
        stat_customers: "العملاء",
        stat_reviews: "التقييمات",
        admin_panel_members: "إدارة كافة الأعضاء",
        marketer_requests_title: "طلبات انضمام مسوقين جدد",
        search_placeholder: "ابحث عن منتجك المفضل...",
        btn_my_wishlist: "مفضلاتي ❤",
        btn_show_all: "عرض الكل",
        publish_title: "نشر إبداع جديد",
        lock_message: "🚫 عذراً، خاصية النشر معطلة حالياً بسبب ارتفاع المديونية.",
        p_name: "اسم المنتج",
        p_price: "السعر النهائي",
        p_commission: "عمولتك",
        p_model: "الموديل",
        btn_publish: "نشر المنتج الآن",
        btn_visit: "زيارة",
        btn_details: "التفاصيل والتقييمات",
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
        font: "'Inter', sans-serif",
        // Login page values
        login_btn: "Login",
        signup_btn: "Sign Up",
        signup_link: "Create Account",
        login_link: "Sign In",
        no_account: "Don't have an account?",
        have_account: "Already have an account?",
        name_placeholder: "Full Name",
        email_placeholder: "Email Address",
        pass_placeholder: "Password",
        forgot_pass: "Forgot Password?",
        google_btn: "Sign in with Google",
        or_via: "OR VIA",
        // داخل translations.en
        btn_community: "Join Community",
        logout: "Logout",
        // أضف هذه للقسم الإنجليزي en
        shop_title: "Smart Store",
        cart_title: "Shopping Cart",
        cart_total: "Total:",
        btn_shopping: "Continue Shopping",
        stat_users: "Users",
        stat_prods: "Products",
        stat_marketers: "Marketers",
        stat_customers: "Customers",
        stat_reviews: "Reviews",
        admin_panel_members: "All Members Management",
        marketer_requests_title: "New Marketer Requests",
        search_placeholder: "Search your favorite product...",
        btn_my_wishlist: "My Wishlist ❤",
        btn_show_all: "Show All",
        publish_title: "Publish New Creation",
        lock_message: "🚫 Sorry, publishing is disabled due to high debt.",
        p_name: "Product Name",
        p_price: "Final Price",
        p_commission: "Commission",
        p_model: "Model",
        btn_publish: "Publish Product Now",
        btn_visit: "Visit",
        btn_details: "Details & Reviews"
                }
        };

function applyLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (t[key]) {
            // ترجمة الـ Placeholder إذا كان العنصر Input
            if (el.tagName === 'INPUT') {
                el.placeholder = t[key];
            } else {
                el.innerHTML = t[key];
            }
        }
    });

    // ضبط الاتجاه واللغة والخط
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    document.body.style.fontFamily = t.font;

    // تحديث نص زر اللغة إذا كان موجوداً
    const langLabel = document.getElementById('langLabel');
    if (langLabel) langLabel.innerText = t.lang_btn;
}

window.setLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'ar';
    applyLanguage(savedLang);
});
