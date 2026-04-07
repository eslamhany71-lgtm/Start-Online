import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// تحديث حالة الأزرار عند تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
    const navBtn = document.getElementById('navBtn');
    if (user) {
        // تحويل الزر العلوي لزر خروج وإضافة data-key
        navBtn.innerHTML = `<span class="relative z-10" data-key="logout">خروج</span>`;
        navBtn.classList.replace('bg-blue-600', 'bg-red-600/20');
        navBtn.classList.add('text-red-500', 'border', 'border-red-600/30', 'hover:bg-red-600', 'hover:text-white');
        navBtn.classList.remove('btn-glow');
        navBtn.href = "#";
        navBtn.onclick = (e) => {
            e.preventDefault();
            signOut(auth).then(() => location.reload());
        };

        // تحديث زر المجتمع ليكون "لوحة التحكم"
        const snapshot = await get(ref(db, 'users/' + user.uid));
        if (snapshot.exists()) {
            const marketerBtn = document.getElementById('marketerBtn');
            marketerBtn.innerHTML = `<span>📊</span> <span data-key="dashboard">لوحة التحكم</span>`;
            marketerBtn.href = "profile.html";
        }
        
        // إعادة تشغيل الترجمة عشان تترجم الأزرار الجديدة
        if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
    }
});

// حركة توهج الماوس (Smoother)
const glow = document.getElementById('mouseGlow');
window.addEventListener('mousemove', (e) => {
    requestAnimationFrame(() => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
});

// لغة وافتراضيات
const currentLang = localStorage.getItem('lang') || 'ar';
const langLabel = document.getElementById('langLabel');
if(langLabel) langLabel.innerText = currentLang === 'ar' ? 'English' : 'العربية';

// تشغيل الترجمة بمجرد فتح الصفحة
if(window.applyLanguage) applyLanguage(currentLang);

window.setLanguage = (lang) => { 
    localStorage.setItem('lang', lang); 
    location.reload(); 
};
