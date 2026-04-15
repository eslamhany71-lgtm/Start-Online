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

window.openJoinModal = async (type) => {
    if (!auth.currentUser) {
        alert(t('msg_must_login'));
        window.location.href = "login.html";
        return;
    }
    
    const snap = await get(ref(db, 'marketer_requests/' + auth.currentUser.uid));
    if(snap.exists()){
        alert(t('msg_req_pending'));
        return;
    }

    const userSnap = await get(ref(db, 'users/' + auth.currentUser.uid));
    if(userSnap.exists()){
        const role = userSnap.val().role;
        if(role === 'merchant' || role === 'marketer' || role === 'admin'){
            alert(t('msg_already_role'));
            return;
        }
    }

    window.currentJoinType = type;
    const title = type === 'merchant' ? t('title_join_merchant') : t('title_join_marketer');
    document.getElementById('joinModalTitle').innerText = title;
    document.getElementById('joinModal').classList.remove('hidden');
};

window.submitJoinRequest = async () => {
    const phone = document.getElementById('reqPhone').value;
    const address = document.getElementById('reqAddress').value;
    const bio = document.getElementById('reqBio').value;

    if(!phone || !address) {
        alert(t('msg_missing_name_phone'));
        return;
    }

    const btn = document.getElementById('submitReqBtn');
    btn.innerText = t('msg_sending');
    btn.disabled = true;

    const uid = auth.currentUser.uid;
    const userSnap = await get(ref(db, 'users/' + uid));
    const userData = userSnap.exists() ? userSnap.val() : { name: t('guest'), email: auth.currentUser.email };

    const requestData = {
        uid: uid,
        name: userData.name,
        email: userData.email,
        phone: phone,
        address: address,
        bio: bio,
        requestType: window.currentJoinType, 
        date: new Date().toLocaleString('ar-EG')
    };

    try {
        await set(ref(db, 'marketer_requests/' + uid), requestData);
        await update(ref(db, 'users/' + uid), { phone: phone }); 
        alert(t('msg_req_success'));
        document.getElementById('joinModal').classList.add('hidden');
    } catch (error) {
        alert(t('msg_send_error') + error.message);
    } finally {
        btn.innerText = t('btn_send_now');
        btn.disabled = false;
    }
};

window.setLanguage = (lang) => { 
    localStorage.setItem('lang', lang); 
    location.reload(); 
};

const glow = document.getElementById('mouseGlow');
window.addEventListener('mousemove', (e) => {
    requestAnimationFrame(() => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});
