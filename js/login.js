import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// لاحظ هنا إحنا ضفنا get و remove عشان نقرأ من دعوات الإكسيل ونمسحها
import { ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const googleProvider = new GoogleAuthProvider();
let isLogin = true;

// دالة التنبيهات عشان الإيرورات تطلع بشكل شيك
window.showToast = (m) => { 
    const tst = document.getElementById('toast'); 
    tst.innerText = m; 
    tst.style.opacity = '1'; 
    tst.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => { 
        tst.style.opacity = '0'; 
        tst.style.transform = 'translate(-50%, 0)';
    }, 3000); 
};

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
    
    if(window.applyLanguage) {
        const currentLang = localStorage.getItem('lang') || 'ar';
        window.applyLanguage(currentLang);
    }
};

window.handleForgotPassword = async () => {
    const email = document.getElementById('userEmail').value;
    if (!email) { showToast(t('msg_enter_email_first')); return; }
    try {
        await sendPasswordResetEmail(auth, email);
        showToast(t('msg_reset_sent'));
    } catch (err) { showToast("Error: " + err.message); }
};

window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email;
        let userRole = 'user';
        
        // فحص هل إيميل جوجل ده مرفوع من شيت الإكسيل كدعوة؟
        const emailKey = email.replace(/\./g, ','); 
        const preInvitedSnap = await get(ref(db, 'invited_users/' + emailKey));
        
        if(preInvitedSnap.exists()) {
            userRole = preInvitedSnap.val().role || 'user';
            await remove(ref(db, 'invited_users/' + emailKey)); // نمسح الدعوة
        }

        // تسجيل الداتا (بناءً على جوجل، الموبايل ممكن يكون مش موجود فهنحط فاضي مؤقتاً)
        await set(ref(db, 'users/' + result.user.uid), { 
            name: result.user.displayName, 
            email: email,
            phone: result.user.phoneNumber || '', 
            role: userRole 
        });
        window.location.href = "index.html";
    } catch (err) { showToast(t('msg_google_fail') + err.message); }
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
            // --- في حالة التسجيل الجديد ---
            const name = document.getElementById('userName').value;
            const phone = document.getElementById('userPhoneReg').value;
            
            if (!name || !phone) {
                showToast("يرجى إدخال الاسم ورقم الموبايل");
                throw new Error("missing_data");
            }

            // هنا فايربيز بيحاول يعمل الحساب
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            
            let userRole = 'user';
            const emailKey = email.replace(/\./g, ',');
            const preInvitedSnap = await get(ref(db, 'invited_users/' + emailKey));
            
            if(preInvitedSnap.exists()) {
                userRole = preInvitedSnap.val().role || 'user';
                await remove(ref(db, 'invited_users/' + emailKey)); 
            }

            await set(ref(db, 'users/' + res.user.uid), { name, email, phone, role: userRole });
        } else {
            // --- في حالة الدخول العادي ---
            await signInWithEmailAndPassword(auth, email, pass);
        }
        window.location.href = "index.html";
    } catch (err) {
        // إخفاء اللودر وإرجاع زرار الدخول
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        
        if (err.message === "missing_data") return;
        
        // === هنا سحر ترجمة أخطاء فايربيز للعربي للزبون ===
        let errorMsg = "حدث خطأ، يرجى المحاولة مرة أخرى."; 
        
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            errorMsg = "بيانات الدخول (الإيميل أو كلمة المرور) غير صحيحة ❌";
        } else if (err.code === 'auth/user-not-found') {
            errorMsg = "هذا الحساب غير موجود لدينا 🔍";
        } else if (err.code === 'auth/email-already-in-use') {
            errorMsg = "هذا الإيميل مسجل به حساب بالفعل! ⚠️";
        } else if (err.code === 'auth/weak-password') {
            errorMsg = "كلمة المرور ضعيفة! (يجب أن تكون 6 أحرف أو أرقام على الأقل) 🔒";
        } else if (err.code === 'auth/invalid-email') {
            errorMsg = "صيغة البريد الإلكتروني غير صحيحة! (يجب أن يحتوي على @) 📧";
        }

        // عرض الخطأ للزبون
        showToast(errorMsg);
    }
};
