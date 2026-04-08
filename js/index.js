import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// تحديث حالة الأزرار عند تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
    const navBtn = document.getElementById('navBtn');
    if (user) {
        // تحويل الزر العلوي لزر خروج وإعطائه القيمة المترجمة فوراً
        navBtn.innerHTML = `<span class="relative z-10">${t('logout')}</span>`;
        navBtn.classList.replace('bg-blue-600', 'bg-red-600/20');
        navBtn.classList.add('text-red-500', 'border', 'border-red-600/30', 'hover:bg-red-600', 'hover:text-white');
        navBtn.classList.remove('btn-glow');
        navBtn.href = "#";
        navBtn.onclick = (e) => {
            e.preventDefault();
            signOut(auth).then(() => location.reload());
        };

        // تحديث زر المجتمع ليكون "لوحة التحكم" ومترجم
        const snapshot = await get(ref(db, 'users/' + user.uid));
        if (snapshot.exists()) {
            const marketerBtn = document.getElementById('marketerBtn');
            marketerBtn.innerHTML = `<span>📊</span> <span>${t('dashboard')}</span>`;
            marketerBtn.href = "profile.html";
        }
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

// تغيير اللغة من الرئيسية
window.setLanguage = (lang) => { 
    localStorage.setItem('lang', lang); 
    location.reload(); 
};

// ==========================================
// سحر إغلاق النوافذ عند الضغط في أي مكان فاضي
// ==========================================
window.addEventListener('click', (e) => {
    // 1. إغلاق النوافذ المنبثقة (Modals)
    // الكود بيتعرف على الخلفية السودة من خلال كلاسات التيلويند (fixed inset-0)
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        e.target.classList.add('hidden');
    }
    
    // 2. إغلاق قائمة الإشعارات لو ضغطت براها (بونص شياكة)
    const notifDropdown = document.getElementById('notifDropdown');
    const clickedOnNotifBtn = e.target.closest('button[onclick="toggleNotif()"]');
    
    if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
        // لو الضغطة مكانتش جوه القائمة، ومكانتش على زرار الجرس نفسه.. اخفي القائمة
        if (!notifDropdown.contains(e.target) && !clickedOnNotifBtn) {
            notifDropdown.classList.add('hidden');
        }
    }
});
