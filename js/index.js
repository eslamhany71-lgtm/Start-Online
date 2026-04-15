import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.currentJoinType = 'marketer';

onAuthStateChanged(auth, async (user) => {
    const navBtn = document.getElementById('navBtn');
    if (user) {
        navBtn.innerHTML = `<span class="relative z-10">${t('logout') || 'خروج'}</span>`;
        navBtn.classList.replace('bg-blue-600', 'bg-red-600/20');
        navBtn.classList.add('text-red-500', 'border', 'border-red-600/30', 'hover:bg-red-600', 'hover:text-white');
        navBtn.classList.remove('btn-glow');
        navBtn.href = "#";
        navBtn.onclick = (e) => {
            e.preventDefault();
            signOut(auth).then(() => location.reload());
        };
    }
});

// فتح نافذة الطلب وتحديد نوع الطلب (تاجر/مسوق)
window.openJoinModal = async (type) => {
    if (!auth.currentUser) {
        alert("يجب تسجيل الدخول أو إنشاء حساب أولاً لتقديم الطلب!");
        window.location.href = "login.html";
        return;
    }
    
    // التأكد إن مفيش طلب قيد المراجعة
    const snap = await get(ref(db, 'marketer_requests/' + auth.currentUser.uid));
    if(snap.exists()){
        alert("لديك طلب قيد المراجعة بالفعل! يرجى انتظار رد الإدارة.");
        return;
    }

    // التأكد إنه مش واخد رتبة أصلاً
    const userSnap = await get(ref(db, 'users/' + auth.currentUser.uid));
    if(userSnap.exists()){
        const role = userSnap.val().role;
        if(role === 'merchant' || role === 'marketer' || role === 'admin'){
            alert("أنت بالفعل تمتلك صلاحيات في المنصة!");
            return;
        }
    }

    window.currentJoinType = type;
    const title = type === 'merchant' ? 'طلب انضمام كـ تاجر 🏪' : 'طلب انضمام كـ مسوق 🚀';
    document.getElementById('joinModalTitle').innerText = title;
    document.getElementById('joinModal').classList.remove('hidden');
};

// إرسال الطلب لقاعدة البيانات
window.submitJoinRequest = async () => {
    const phone = document.getElementById('reqPhone').value;
    const address = document.getElementById('reqAddress').value;
    const bio = document.getElementById('reqBio').value;

    if(!phone || !address) {
        alert("يرجى إدخال رقم الموبايل والعنوان بالتفصيل");
        return;
    }

    const btn = document.getElementById('submitReqBtn');
    btn.innerText = "جاري الإرسال...";
    btn.disabled = true;

    const uid = auth.currentUser.uid;
    const userSnap = await get(ref(db, 'users/' + uid));
    const userData = userSnap.exists() ? userSnap.val() : { name: 'مجهول', email: auth.currentUser.email };

    // تخزين الطلب بنوعه
    const requestData = {
        uid: uid,
        name: userData.name,
        email: userData.email,
        phone: phone,
        address: address,
        bio: bio,
        requestType: window.currentJoinType, // 'marketer' or 'merchant'
        date: new Date().toLocaleString('ar-EG')
    };

    try {
        await set(ref(db, 'marketer_requests/' + uid), requestData);
        await update(ref(db, 'users/' + uid), { phone: phone }); // تحديث رقم الموبايل في حسابه عشان ميبقاش فاضي
        alert("تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة قريباً.");
        document.getElementById('joinModal').classList.add('hidden');
    } catch (error) {
        alert("حدث خطأ أثناء الإرسال: " + error.message);
    } finally {
        btn.innerText = "إرسال الطلب الآن";
        btn.disabled = false;
    }
};

window.setLanguage = (lang) => { 
    localStorage.setItem('lang', lang); 
    location.reload(); 
};

// حركة توهج الماوس
const glow = document.getElementById('mouseGlow');
window.addEventListener('mousemove', (e) => {
    requestAnimationFrame(() => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
});

// كود الإغلاق الذكي الموحد
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});
