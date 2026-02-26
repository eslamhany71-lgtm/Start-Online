const translations = {
    ar: {
        // Navbar
        nav_home: "الرئيسية",
        nav_shop: "المتجر",
        nav_profile: "حسابي",
        nav_login: "دخول / انضم إلينا",
        nav_logout: "خروج",
        // Login Page
        login_title: "START ONLINE",
        login_welcome: "سجل دخولك للوصول إلى لوحة التحكم",
        login_email: "البريد الإلكتروني",
        login_pass: "كلمة المرور",
        login_btn: "دخول",
        register_link: "إنشاء حساب جديد",
        // Products Page
        shop_title: "المعرض الرقمي",
        search_placeholder: "ابحث عن منتج...",
        btn_details: "التفاصيل والتقييمات",
        // Global
        dir: "rtl"
    },
    en: {
        // Navbar
        nav_home: "Home",
        nav_shop: "Shop",
        nav_profile: "My Profile",
        nav_login: "Login / Join Us",
        nav_logout: "Logout",
        // Login Page
        login_title: "START ONLINE",
        login_welcome: "Login to access your dashboard",
        login_email: "Email Address",
        login_pass: "Password",
        login_btn: "Login",
        register_link: "Create New Account",
        // Products Page
        shop_title: "Digital Marketplace",
        search_placeholder: "Search for a product...",
        btn_details: "Details & Reviews",
        // Global
        dir: "ltr"
    }
};

// وظيفة تطبيق الترجمة
function applyLanguage(lang) {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            if (el.tagName === "INPUT") {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });
    // تغيير اتجاه الموقع
    document.documentElement.dir = translations[lang].dir;
    document.documentElement.lang = lang;
}

// عند تحميل أي صفحة
document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem("lang") || "ar";
    applyLanguage(savedLang);
});

// وظيفة تبديل اللغة
window.setLanguage = (lang) => {
    localStorage.setItem("lang", lang);
    location.reload(); // إعادة تحميل لتطبيق التغييرات في كل مكان
};
