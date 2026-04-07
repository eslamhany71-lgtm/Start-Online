import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, push, onValue, remove, update, get, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let currentUser = null, userRole = 'user', allProducts = {}, allUsers = {}, userWishlist = [];
let selectedMainCat = 'الكل', selectedSubCat = 'الكل';
const DEBT_LIMIT = 500;

let currentNotifLength = 0;
let userClearedNotifs = false;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userSnap = await get(ref(db, 'users/' + user.uid));
        if (userSnap.exists()) {
            const u = userSnap.val(); 
            userRole = u.role || 'user'; 
            userWishlist = u.wishlist || [];
            const debt = (u.wallet && u.wallet.debt) ? Number(u.wallet.debt) : 0;

            const userInfoEl = document.getElementById('userInfo');
            if (userInfoEl) userInfoEl.innerText = `${u.name} | ${userRole.toUpperCase()}`;
            
            if (userRole === 'admin') {
                document.getElementById('adminStats').classList.remove('hidden');
                document.getElementById('adminUsersPanel').classList.remove('hidden');
                document.getElementById('marketerRequestsPanel').classList.remove('hidden');
                loadAdminDashboard(); loadMarketerRequests(); window.loadUsers();
            }

            if (userRole === 'merchant' || userRole === 'admin') { 
                document.getElementById('controlPanel').classList.remove('hidden'); 
                if(userRole === 'merchant' && debt > DEBT_LIMIT) {
                    document.getElementById('debtAlert').classList.remove('hidden');
                    document.getElementById('publishForm').classList.add('hidden');
                    document.getElementById('lockMessage').classList.remove('hidden');
                }
            }
            
            loadNotifications(userRole, user.uid);
        }
        loadProducts(); updateCartUI();
    } else { window.location.href = "login.html"; }
});

window.clearNotifs = () => {
    userClearedNotifs = true;
    document.getElementById('notifList').innerHTML = `<p class="text-[10px] text-gray-500 text-center py-4">${t('notifs_cleared')}</p>`;
    document.getElementById('notifBadge').classList.add('hidden');
};

function loadNotifications(role, uid) {
    onValue(ref(db, 'orders'), (snap) => {
        const orders = snap.val() || {};
        let notificationsList = [];

        Object.keys(orders).reverse().forEach(key => {
            const o = orders[key];
            const isMyPurchase = (o.customerUid === uid) || (o.customerId === uid) || (o.buyerId === uid);
            const displayTotal = Number(o.total || o.totalPrice || 0);

            if(isMyPurchase && o.status === 'completed') notificationsList.push({text: `${t('msg_order_delivered')} ${o.productName}`, date: o.date, color: 'text-green-400', link: 'profile.html'});
            if(isMyPurchase && o.status === 'failed') notificationsList.push({text: `${t('msg_order_canceled')} ${o.productName}`, date: o.date, color: 'text-red-400', link: 'profile.html'});

            if(role === 'admin' || o.marketerId === uid) {
                if(!o.status || o.status === 'pending') notificationsList.push({text: `${t('msg_new_order')} ${o.productName} ${t('msg_with_amount')} ${displayTotal} ${t('currency')}`, date: o.date, color: 'text-yellow-400', link: 'profile.html'});
                if(o.status === 'completed') notificationsList.push({text: `${t('msg_profit_added')} ${o.productName} ${t('msg_to_wallet')}`, date: o.date, color: 'text-blue-400', link: 'profile.html'});
            }
        });

        if(notificationsList.length > currentNotifLength) { userClearedNotifs = false; }
        currentNotifLength = notificationsList.length;

        if(!userClearedNotifs) {
            const badge = document.getElementById('notifBadge');
            const list = document.getElementById('notifList');
            
            if(notificationsList.length > 0) {
                badge.innerText = notificationsList.length;
                badge.classList.remove('hidden');
                let notifsHtml = '';
                notificationsList.slice(0, 15).forEach(n => {
                    notifsHtml += `
                    <a href="${n.link}" class="block bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 hover:border-blue-500/30 transition cursor-pointer">
                        <p class="font-bold ${n.color} mb-1">${n.text}</p>
                        <p class="text-[8px] text-gray-500">${n.date}</p>
                    </a>`;
                });
                list.innerHTML = notifsHtml;
            } else {
                badge.classList.add('hidden');
                list.innerHTML = `<p class="text-gray-500 text-center py-4">${t('no_notifs')}</p>`;
            }
        }
    });
}

window.toggleNotif = () => {
    const drop = document.getElementById('notifDropdown');
    drop.classList.toggle('hidden');
    if(!drop.classList.contains('hidden')) document.getElementById('notifBadge').classList.add('hidden');
};

window.toggleCart = () => document.getElementById('cartDrawer').classList.toggle('open');
window.updateCartUI = () => {
    if(!currentUser) return;
    const cartKey = `carts/${currentUser.uid}`;
    onValue(ref(db, cartKey), (snap) => {
        const data = snap.val() || {};
        const list = document.getElementById('cartItemsList');
        const badge = document.getElementById('cartCountBadge');
        const totalEl = document.getElementById('cartTotal');
        const keys = Object.keys(data);
        if(badge) badge.innerText = keys.length; 
        let total = 0;
        let cartHtml = '';
        keys.forEach((key) => {
            const item = data[key];
            total += Number(item.price) * Number(item.qty);
            cartHtml += `<div class="glass p-3 rounded-2xl flex gap-3 items-center border border-white/5 animate-slide mb-3 text-right group">
                <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover">
                <div class="flex-1 font-bold">
                    <h4 class="text-[10px] text-white line-clamp-1">${item.name}</h4>
                    <p class="text-[8px] text-gray-500 italic">${item.color || ''} | ${item.size || ''} | س ${item.qty}</p>
                    <p class="text-blue-400 font-black text-xs mt-1">${item.price * item.qty} ${t('currency')}</p>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="removeFromCart('${key}')" class="text-red-500 hover:text-red-400 text-xs font-bold">✕</button>
                    <a href="order.html?id=${item.id}&name=${encodeURIComponent(item.name)}&price=${item.price}&qty=${item.qty}&color=${encodeURIComponent(item.color || '')}&size=${encodeURIComponent(item.size || '')}&image=${encodeURIComponent(item.image)}&owner=${item.owner || 'null'}" class="text-[8px] bg-blue-600 text-white p-1 rounded-lg text-center font-black hover:bg-blue-500 transition-colors">${t('btn_order')}</a>
                </div>
            </div>`;
        });
        if(list) list.innerHTML = cartHtml;
        if(totalEl) totalEl.innerText = total + " " + t('currency');
        if(keys.length === 0 && list) list.innerHTML = `<div class="flex flex-col items-center justify-center h-40 opacity-50"><span class="text-4xl mb-2">🛒</span><p class="text-[10px]">${t('cart_empty')}</p></div>`;
    });
};

window.removeFromCart = (key) => { if(confirm(t('msg_delete_cart'))) remove(ref(db, `carts/${currentUser.uid}/${key}`)); };

/* 👇 التعديل السحري لفصل الداتا بيز عن الترجمة 👇 */
// دي الكلمات اللي الفلتر هيستخدمها عشان يبحث في الداتا بيز (ثابتة بالعربي زي ما اتسجلت)
const dbCategories = {
    'all': 'الكل',
    'clothes': 'ملابس',
    'acc': 'إكسسوارات',
    'perfume': 'عطور',
    'beauty': 'صحة وجمال',
    'best': 'أكثر مبيعاً'
};

// هنا ربطنا الداتا بيز (dbVal) بمفتاح الترجمة (tKey) عشان تظهر مترجمة
const subData = {
    clothes: [{dbVal:'رجالي', tKey:'sub_men', i:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcq8MbpMpYi4h72YsWLGOu8L2bU7lNdq-3ZQ&s'}, {dbVal:'حريمي', tKey:'sub_women', i:'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=100'}],
    acc: [{dbVal:'رجالي', tKey:'sub_men', i:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHE6nx5A79B-M8Ptx1axoKtJyh__8fFnVf9Q&s'}, {dbVal:'حريمي', tKey:'sub_women', i:'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_2PO3OsO5EeG2It9AcKvUkfcraT1AzfcbFuB4c_RxtgsYzAPBUico99Z2PlxYnTKx4Rd0WlhLqoI6QpHR-IVSZsEXDQPij6CZY0eaoQ-tWvUO4PQrNOyYD_9CgZpLx6kUDFLBSBlP-f97/s1600/%D8%A7%D9%83%D8%B3%D8%B3%D9%88%D8%A7%D8%B1%D8%A7%D8%AA+%D9%85%D8%B3%D8%AA%D9%88%D8%B1%D8%AF%D8%A9+%D9%85%D9%86+%D8%A7%D9%84%D8%B5%D9%8A%D9%86.jpg'}],
    perfume: [{dbVal:'رجالي', tKey:'sub_men', i:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqYTBqAT9RJHsyFI4Pbp1btFlcsx3YVcowXw&s'}, {dbVal:'حريمي', tKey:'sub_women', i:'https://www.faces.eg/dw/image/v2/BJSM_PRD/on/demandware.static/-/Sites-faces-master-catalog/default/dw14914fb4/product/3614270175572/3614270175572.jpg?sw=800&sh=800'}],
    beauty: [{dbVal:'رجالي', tKey:'sub_men', i:'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100'}, {dbVal:'حريمي', tKey:'sub_women', i:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100'}]
};

window.showSubCats = (key, el) => {
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active')); el.classList.add('active');
    
    // بناخد القيمة الثابتة بتاعت الداتا بيز بدل ما نقرأ النص المترجم اللي على الشاشة
    selectedMainCat = dbCategories[key] || 'الكل'; 
    selectedSubCat = 'الكل'; 
    
    const area = document.getElementById('subCatsArea');
    if(key === 'all' || key === 'best') { area.style.display = 'none'; applyDualFilter(); return; }
    
    area.style.display = 'flex';
    // بنرسم الأقسام الفرعية وبنستخدم t(s.tKey) للترجمة، ولما الزبون يدوس بنبعت s.dbVal للفلتر
    area.innerHTML = subData[key].map(s => `<div class="sub-cat-item" onclick="filterBySub('${s.dbVal}', this)"><img src="${s.i}" loading="lazy"><span>${t(s.tKey)}</span></div>`).join('');
    
    applyDualFilter();
};

window.filterBySub = (sub, el) => {
    document.querySelectorAll('.sub-cat-item').forEach(i => i.classList.remove('active')); if(el) el.classList.add('active');
    selectedSubCat = sub; applyDualFilter();
};

window.filterProducts = () => applyDualFilter();

function applyDualFilter() {
    const f = {}; 
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    Object.keys(allProducts).forEach(k => {
        const p = allProducts[k];
        const matchMain = (selectedMainCat === 'الكل' || p.category === selectedMainCat);
        const matchSub = (selectedSubCat === 'الكل' || p.subCategory === selectedSubCat);
        const matchSearch = p.name.toLowerCase().includes(searchVal);
        if(matchMain && matchSub && matchSearch) f[k] = p;
    });
    renderGrid(f);
}

window.resetAllFilters = () => {
    selectedMainCat = 'الكل'; selectedSubCat = 'الكل';
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-cat="all"]').classList.add('active');
    document.getElementById('subCatsArea').style.display = 'none';
    renderGrid(allProducts);
};

function loadAdminDashboard() {
    onValue(ref(db, 'users'), (snap) => {
        allUsers = snap.val() || {}; const uArr = Object.values(allUsers);
        document.getElementById('totalUsers').innerText = uArr.length;
        document.getElementById('totalMerchants').innerText = uArr.filter(u => u.role === 'merchant').length;
        document.getElementById('totalMarketers').innerText = uArr.filter(u => u.role === 'marketer').length;
        document.getElementById('totalNormalUsers').innerText = uArr.filter(u => u.role === 'user' || u.role === 'customer').length;
    });
    onValue(ref(db, 'products'), (s) => document.getElementById('totalProducts').innerText = Object.keys(s.val() || {}).length);
    onValue(ref(db, 'reviews'), (s) => { let c = 0; const data = s.val() || {}; Object.values(data).forEach(r => c += Object.keys(r).length); document.getElementById('totalReviews').innerText = c; });
}

window.openUsersModal = (role) => {
    const m = document.getElementById('usersModal'); const l = document.getElementById('modalList');
    m.style.display = 'flex'; 
    let modalHtml = '';
    Object.keys(allUsers).forEach(uid => { 
        const u = allUsers[uid];
        if(role === 'all' || u.role === role || (role === 'user' && u.role === 'customer')) {
            modalHtml += `<div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center text-right font-bold hover:bg-white/10 transition-colors mb-2">
                <div>
                    <p class="text-white text-xs uppercase tracking-tighter">${u.name} <span class="text-[9px] text-blue-400">(${u.role})</span></p>
                    <p class="text-[10px] text-gray-500 mt-1 italic">${u.email}</p>
                </div>
                <button onclick="visitAccount('${uid}')" class="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black border border-blue-400/30 hover:bg-blue-600 hover:text-white transition-all">${t('btn_visit')}</button>
            </div>`; 
        }
    });
    l.innerHTML = modalHtml;
};

window.closeUsersModal = () => document.getElementById('usersModal').style.display = 'none';

function loadMarketerRequests() { 
    onValue(ref(db, 'marketer_requests'), (snap) => { 
        const list = document.getElementById('requestsList'); 
        const data = snap.val(); 
        if(data) {
            let reqHtml = '';
            Object.keys(data).forEach(uid => { 
                const r = data[uid]; 
                reqHtml += `<div class="glass p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center text-right font-bold animate-fade-in shadow-xl border border-white/5 gap-4">
                    <div><p class="text-sm text-white underline decoration-blue-500/30 tracking-widest">${r.name}</p><p class="text-[10px] text-gray-500">${r.email}</p></div>
                    <div class="flex gap-2 w-full md:w-auto">
                        <button onclick="viewRequestDetails('${uid}')" class="flex-1 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-600 hover:text-white transition-colors">${t('btn_req_details')}</button>
                    </div>
                </div>`; 
            });
            list.innerHTML = reqHtml;
        } else {
            list.innerHTML = `<p class="text-[10px] text-gray-500">${t('no_requests')}</p>`;
        }
    }); 
}

window.viewRequestDetails = async (uid) => {
    const snap = await get(ref(db, 'marketer_requests/' + uid));
    if(snap.exists()) {
        const r = snap.val();
        document.getElementById('reqModalBody').innerHTML = `
            <div class="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-gray-300 space-y-3">
                <p><strong class="text-blue-400">${t('lbl_name')}</strong> ${r.name}</p>
                <p><strong class="text-blue-400">${t('lbl_email')}</strong> ${r.email}</p>
                <p><strong class="text-blue-400">${t('lbl_phone')}</strong> <span class="font-mono">${r.phone || t('not_registered')}</span></p>
                <p><strong class="text-blue-400">${t('lbl_address')}</strong> ${r.address || t('not_registered')}</p>
                <div class="border-t border-white/10 pt-2 mt-2">
                    <strong class="text-blue-400 block mb-1">${t('prev_exp')}</strong>
                    <p class="bg-black/20 p-3 rounded-xl italic">${r.bio || t('no_exp')}</p>
                </div>
            </div>
        `;
        
        document.getElementById('reqModalActions').innerHTML = `
            <button onclick="approveMarketer('${uid}')" class="flex-1 bg-green-600 text-white py-3 rounded-xl text-[10px] font-black hover:bg-green-500 transition-colors shadow-lg btn-glow">${t('btn_accept_req')}</button>
            <button onclick="rejectMarketer('${uid}')" class="flex-1 bg-red-600/20 text-red-500 py-3 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-colors">${t('btn_reject_req')}</button>
            <button onclick="visitAccount('${uid}')" class="flex-1 bg-white/10 text-white py-3 rounded-xl text-[10px] font-black hover:bg-white/20 transition-colors">${t('btn_visit_profile')}</button>
        `;
        document.getElementById('requestDetailsModal').classList.remove('hidden');
    }
};

window.approveMarketer = async (uid) => { 
    await update(ref(db, 'users/' + uid), { role: 'marketer' }); 
    await remove(ref(db, 'marketer_requests/' + uid)); 
    document.getElementById('requestDetailsModal').classList.add('hidden');
    showToast(t('msg_accept_success')); 
};

window.rejectMarketer = async (uid) => {
    if(confirm(t('msg_reject_confirm'))) {
        await remove(ref(db, 'marketer_requests/' + uid));
        document.getElementById('requestDetailsModal').classList.add('hidden');
        showToast(t('msg_reject_success'));
    }
};

window.saveProduct = () => {
    const name = document.getElementById('pName').value, price = document.getElementById('pPrice').value;
    if(name && price) { 
        push(ref(db, 'products'), { 
            name, price, 
            oldPrice: document.getElementById('pOldPrice').value, 
            category: document.getElementById('pCategory').value, 
            subCategory: document.getElementById('pSubCategory').value, 
            model: document.getElementById('pModel').value, 
            material: document.getElementById('pMaterial').value, 
            colors: document.getElementById('pColors').value, 
            sizes: document.getElementById('pSizes').value, 
            desc: document.getElementById('pDesc').value, 
            image: document.getElementById('pImage').value || 'https://placehold.co/400x400/1e293b/3b82f6?text=Start+Online', 
            extraImages: document.getElementById('pExtraImages').value, 
            owner: currentUser.uid, 
            likes: 0 
        }); 
        showToast(t('msg_publish_success')); 
        ["pName", "pPrice", "pOldPrice", "pColors", "pSizes", "pDesc", "pImage", "pExtraImages", "pMaterial", "pModel"].forEach(id => document.getElementById(id).value = ""); 
    } else {
        showToast(t('msg_fill_required'));
    }
};

window.editProduct = async (id, oldN, oldP, oldI, oldComm) => { 
    const nn = prompt(t('prompt_new_name'), oldN); 
    const np = prompt(t('prompt_new_price'), oldP); 
    const nComm = prompt(t('prompt_new_comm'), oldComm !== 'undefined' && oldComm !== 'null' ? oldComm : '');
    const ni = prompt(t('prompt_new_img'), oldI); 
    if(nn && np) { 
        await update(ref(db, 'products/' + id), { name: nn, price: np, oldPrice: nComm, image: ni }); 
        showToast(t('msg_update_success')); 
    } 
};

function loadProducts() { onValue(ref(db, 'products'), (s) => { allProducts = s.val() || {}; renderGrid(allProducts); }); }

function renderGrid(products) {
    const grid = document.getElementById('productsGrid'); 
    const noRes = document.getElementById('noResults');
    if(!grid) return;
    const keys = Object.keys(products);
    if(keys.length === 0) { noRes.classList.remove('hidden'); grid.innerHTML = ''; return; }
    noRes.classList.add('hidden');

    let gridHtml = '';
    keys.forEach(key => {
        const p = products[key], isSaved = userWishlist.includes(key);
        const canManage = (userRole === 'admin') || (userRole === 'merchant' && p.owner === currentUser.uid);
        const safeName = (p.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');

        gridHtml += `<div class="product-card glass p-5 rounded-[35px] animate-fade-in shadow-xl text-right flex flex-col justify-between h-full">
            <div class="relative">
                <div class="absolute top-0 left-0 flex flex-col items-center gap-1 z-10">
                    <button onclick="toggleWishlist('${key}')" class="p-2.5 rounded-full backdrop-blur-md ${isSaved ? 'text-pink-500 bg-pink-500/20' : 'text-gray-400 bg-black/30'} transition-all hover:scale-110 active:scale-90">❤</button>
                    <span class="text-[10px] font-black text-gray-400">${p.likes || 0}</span>
                </div>
                <div class="w-full h-48 md:h-52 rounded-[25px] overflow-hidden mb-5 shadow-2xl border border-white/5">
                    <img src="${p.image}" class="w-full h-full object-cover" loading="lazy" alt="${safeName}">
                </div>
            </div>
            <div>
                <h3 class="font-black text-base md:text-lg mb-2 text-white italic tracking-tighter uppercase line-clamp-1">${p.name}</h3>
                <div class="flex justify-between items-center mb-5">
                    <div class="flex flex-col">
                        <span class="text-blue-400 font-black text-xl md:text-2xl tracking-tighter">${p.price} ${t('currency')}</span>
                        ${p.oldPrice ? `<span class="text-green-400 font-black text-[11px] mt-1"><span>${t('p_commission')}</span>: ${p.oldPrice} ${t('currency')}</span>` : ''}
                    </div>
                    ${canManage ? `<div class="flex gap-2">
                        <button onclick="editProduct('${key}', '${safeName}', '${p.price}', '${p.image}', '${p.oldPrice || ''}')" class="text-yellow-500 text-[10px] font-bold italic border-b border-yellow-500/30">${t('btn_edit')}</button>
                        <button onclick="deleteProduct('${key}')" class="text-red-500 text-[10px] font-bold italic border-b border-red-500/30">${t('btn_delete')}</button>
                    </div>` : ''}
                </div>
                <button onclick="viewDetails('${key}', '${safeName}', '${p.price}', '${p.image}')" class="w-full bg-white/5 hover:bg-blue-600 hover:text-white py-4 rounded-[20px] text-[10px] font-black uppercase transition-all shadow-xl border border-white/5 tracking-widest active:scale-95">${t('btn_details')}</button>
            </div>
        </div>`;
    });
    grid.innerHTML = gridHtml;
}

window.loadUsers = function() { 
    onValue(ref(db, 'users'), (snapshot) => { 
        const users = snapshot.val(); const list = document.getElementById('usersList'); 
        if(!list) return;
        let usersHtml = ''; 
        if(users) Object.keys(users).forEach(uid => { 
            const u = users[uid]; 
            usersHtml += `<div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 font-bold text-right animate-slide">
                <div class="flex justify-between items-start">
                    <p class="text-sm text-white">${u.name}</p>
                    <span class="text-[8px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-black uppercase border border-blue-500/20">${u.role}</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    <button onclick="changeRole('${uid}', 'merchant')" class="w-full text-[8px] border border-green-500/20 rounded-lg p-2 hover:bg-green-500 hover:text-white text-green-400 transition-all font-black uppercase">تاجر</button>
                    <button onclick="changeRole('${uid}', 'marketer')" class="w-full text-[8px] border border-blue-500/20 rounded-lg p-2 hover:bg-blue-500 hover:text-white text-blue-400 transition-all font-black uppercase">${t('btn_role_marketer')}</button>
                    <button onclick="changeRole('${uid}', 'admin')" class="w-full text-[8px] border border-yellow-500/20 rounded-lg p-2 hover:bg-yellow-500 hover:text-white text-yellow-500 transition-all font-black uppercase">${t('btn_role_admin')}</button>
                    <button onclick="changeRole('${uid}', 'user')" class="w-full text-[8px] bg-white/5 rounded-lg p-2 text-white hover:bg-white/20 transition-all font-black uppercase">${t('guest')}</button>
                </div>
                <button onclick="visitAccount('${uid}')" class="w-full bg-blue-600/20 text-blue-400 py-2 rounded-xl text-[10px] font-black border border-blue-400/30 hover:bg-blue-600 hover:text-white transition-all shadow-xl">${t('btn_visit_user')}</button>
            </div>`; 
        }); 
        list.innerHTML = usersHtml;
    }); 
}

window.setLanguage = (lang) => { localStorage.setItem('lang', lang); location.reload(); };
window.changeRole = (uid, r) => { if(confirm(t('msg_role_confirm'))) { update(ref(db, 'users/' + uid), { role: r }); showToast(t('msg_role_success')); } };

window.toggleWishlist = async (id) => { 
    if(!currentUser) return;
    const idx = userWishlist.indexOf(id); 
    const rp = ref(db, `products/${id}/likes`); 
    if (idx > -1) { 
        userWishlist.splice(idx, 1); 
        runTransaction(rp, (c) => (c || 1) - 1); 
    } else { 
        userWishlist.push(id); 
        runTransaction(rp, (c) => (c || 0) + 1); 
    } 
    await update(ref(db, 'users/' + currentUser.uid), { wishlist: userWishlist }); 
};

window.visitAccount = (uid) => {
    showToast(t('msg_redirect_profile'));
    window.location.href = `profile.html?uid=${uid}`; 
};

window.deleteProduct = (id) => confirm(t('msg_delete_confirm')) && remove(ref(db, 'products/' + id)) && showToast(t('msg_delete_success'));
window.viewDetails = (id, n, p, i) => window.location.href = `details.html?id=${id}&name=${encodeURIComponent(n)}&price=${p}&image=${encodeURIComponent(i)}`;
window.loadWishlistOnly = () => { const f = {}; Object.keys(allProducts).forEach(k => { if(userWishlist.includes(k)) f[k] = allProducts[k]; }); renderGrid(f); };
window.showToast = (m) => { const tst = document.getElementById('toast'); tst.innerText = m; tst.style.opacity = '1'; setTimeout(() => tst.style.opacity = '0', 3000); };
window.logout = () => confirm(t('msg_logout_confirm')) && signOut(auth).then(() => window.location.href = "login.html");
