import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const googleProvider = new GoogleAuthProvider();
let isLogin = true;

// دالة لتغيير اللغة من صفحة الدخول
window.setLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    if(window.applyLanguage) window.applyLanguage(lang);
    location.reload();
};

window.togglePassword = () => {
    const passInput = document.getElementById('userPass');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

window.toggleAuth = () => {
    isLogin = !isLogin;
    const regFields = document.getElementById('registerFields');
    const forgotPass = document.getElementById('forgotPasswordContainer');
    const btnText = document.getElementById('btnText');
    const toggleText = document.getElementById('toggleText');
    const toggleBtn = document.getElementById('toggleBtn');

    regFields.classList.toggle('hidden');
    regFields.classList.add('fade-in');
    forgotPass.classList.toggle('hidden');
    
    if (isLogin) {
        btnText.setAttribute('data-key', 'login_btn');
        toggleText.setAttribute('data-key', 'no_account');
        toggleBtn.setAttribute('data-key', 'signup_link');
    } else {
        btnText.setAttribute('data-key', 'signup_btn');
        toggleText.setAttribute('data-key', 'have_account');
        toggleBtn.setAttribute('data-key', 'login_link');
    }
    
    // إعادة تطبيق الترجمة فوراً عند التبديل
    if(window.applyLanguage) {
        const currentLang = localStorage.getItem('lang') || 'ar';
        window.applyLanguage(currentLang);
    }
};

window.handleForgotPassword = async () => {
    const email = document.getElementById('userEmail').value;
    if (!email) { alert(t('msg_enter_email_first')); return; }
    try {
        await sendPasswordResetEmail(auth, email);
        alert(t('msg_reset_sent'));
    } catch (err) { alert("Error: " + err.message); }
};

window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await set(ref(db, 'users/' + result.user.uid), { 
            name: result.user.displayName, 
            email: result.user.email, 
            role: 'user' 
        });
        window.location.href = "index.html";
    } catch (err) { alert(t('msg_google_fail') + err.message); }
};

document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const pass = document.getElementById('userPass').value;
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    try {
        if (!isLogin) {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            const name = document.getElementById('userName').value;
            await set(ref(db, 'users/' + res.user.uid), { name, email, role: 'user' });
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
        window.location.href = "index.html";
    } catch (err) {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        let errorMsg = err.message;
        if (err.code === 'auth/wrong-password') errorMsg = t('msg_invalid_pass');
        else if (err.code === 'auth/user-not-found') errorMsg = t('msg_user_not_found');
        alert(errorMsg);
    }
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
