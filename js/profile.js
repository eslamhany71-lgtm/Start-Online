import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, set, update, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let myUid = null; let myRole = 'user'; let currentOrdersData = {};
let salesChartInstance = null; 

window.newProfileBase64 = null;

// دالة ضغط الصورة للبروفايل
window.processImageUpload = (event, previewId, callback) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500; const MAX_HEIGHT = 500;
            let width = img.width; let height = img.height;

            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
            else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }

            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const previewElem = document.getElementById(previewId);
            if(previewElem) { previewElem.src = dataUrl; previewElem.classList.remove('hidden'); }
            callback(dataUrl);
        };
    };
};

// وظيفة الأكورديون للداش بورد
window.toggleDashboardTab = (tabId) => {
    ['salesChartContainer', 'successOrdersContainer', 'failedOrdersContainer'].forEach(id => {
        const el = document.getElementById(id);
        if(id === tabId) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const urlParams = new URLSearchParams(window.location.search);
        const visitedUid = urlParams.get('uid');
        myUid = visitedUid ? visitedUid : user.uid;
        
        if(visitedUid === user.uid) window.history.replaceState({}, document.title, "profile.html");

        const snap = await get(ref(db, 'users/' + myUid));
        if (snap.exists()) {
            const u = snap.val();
            const currentUserSnap = await get(ref(db, 'users/' + user.uid));
            const realRole = currentUserSnap.val().role || 'user';
            
            myRole = u.role || 'user';
            
            document.getElementById('userName').innerText = u.name;
            document.getElementById('userEmail').innerText = u.email;
            document.getElementById('userRoleBadge').innerText = t('btn_role_' + myRole) || myRole.toUpperCase();
            document.getElementById('userImg').src = u.photo || `https://ui-avatars.com/api/?name=${u.name}&background=3b82f6&color=fff`;
            document.getElementById('userPhoneDisplay').innerText = u.phone || t('no_phone_registered');
            
            if(myRole === 'admin') {
                document.getElementById('adminMarketerPanel').classList.remove('hidden');
                loadMarketersForAdmin();
                document.getElementById('debtRow').style.display = 'none';
                document.getElementById('walletBalanceLabel').innerText = t('platform_profits');
                document.getElementById('walletBalanceLabel').removeAttribute('data-key');
            }

            if(['admin', 'merchant', 'marketer'].includes(myRole)) {
                if(user.uid === myUid || realRole === 'admin') {
                    document.querySelectorAll('#marketerSettings, #insightsDashboard, #walletBox').forEach(el => el.classList.remove('hidden'));
                    loadPaymentDetails();
                } else {
                    document.querySelectorAll('#insightsDashboard').forEach(el => el.classList.remove('hidden'));
                }
                
                if(['admin', 'merchant'].includes(myRole)) {
                    if(user.uid === myUid || realRole === 'admin') {
                        document.getElementById('ordersSection').classList.remove('hidden');
                        document.getElementById('myProductsSection').classList.remove('hidden');
                        document.getElementById('marketerStatsBox').classList.remove('hidden');
                    }
                }

                if(['merchant', 'marketer'].includes(myRole)) {
                    onValue(ref(db, `users/${myUid}/wallet`), (s) => {
                        const w = s.val() || { balance: 0, debt: 0 };
                        document.getElementById('walletBalance').innerText = (Number(w.balance) || 0).toFixed(2) + " " + t('currency');
                        document.getElementById('walletDebt').innerText = (Number(w.debt) || 0).toFixed(2) + " " + t('currency');
                    });
                }
            } else {
                if(user.uid === myUid) checkIfRequestActive();
            }
            
            loadOrders(myRole);
            loadContent(myUid, u.wishlist || []);
        }
    } else { window.location.href = "login.html"; }
});

async function loadPaymentDetails() {
    const snap = await get(ref(db, `users/${myUid}/paymentMethods`));
    if(snap.exists()){
        const d = snap.val();
        document.getElementById('vodaPay').value = d.vodafone || '';
        document.getElementById('etiPay').value = d.etisalat || '';
        document.getElementById('orangePay').value = d.orange || '';
        document.getElementById('instaPay').value = d.instapay || '';
    }
}

window.updateDetailedPayment = async () => {
    const p = { vodafone: document.getElementById('vodaPay').value, etisalat: document.getElementById('etiPay').value, orange: document.getElementById('orangePay').value, instapay: document.getElementById('instaPay').value };
    await set(ref(db, `users/${myUid}/paymentMethods`), p); showToast(t('msg_wallets_updated'));
};

window.updateOrderStatus = async (orderId, status, amount) => {
    try {
        const orderSnap = await get(ref(db, 'orders/' + orderId));
        const orderData = orderSnap.val();
        let finalAmount = parseFloat(amount) || 0;

        if (status === 'completed' && finalAmount > 0) {
            const commission = finalAmount * 0.10;
            const merchantRef = ref(db, `users/${orderData.ownerId || orderData.marketerId}/wallet`);
            const mSnap = await get(merchantRef);
            const m = mSnap.val() || { balance: 0, debt: 0 };
            
            await update(merchantRef, {
                balance: (Number(m.balance) || 0) + finalAmount,
                debt: (Number(m.debt) || 0) + commission
            });
        }
        await update(ref(db, 'orders/' + orderId), { status: status });
        closeOrderModal(); showToast(t('msg_status_updated'));
    } catch (e) { showToast(t('msg_error_conn')); }
};

function loadOrders(role) {
    onValue(ref(db, 'orders'), (snap) => {
        currentOrdersData = snap.val() || {};
        const incomingList = document.getElementById('ordersList');
        const myPurchaseList = document.getElementById('myPurchasesList');
        const successListInner = document.getElementById('successListInner');
        const failedListInner = document.getElementById('failedListInner');
        
        let rev = 0, succ = 0, fail = 0;
        let adminPlatformProfit = 0; 
        let dailyRevData = {}; 
        let notificationsHtml = ''; 
        let notifCount = 0;

        let myPurchaseHtml = '';
        let incomingHtml = '';
        let successHtml = '';
        let failedHtml = '';

        let todayStr = new Date().toLocaleString('ar-EG').split(',')[0];
        const keys = Object.keys(currentOrdersData).reverse();
        
        keys.forEach(key => {
            const o = currentOrdersData[key];
            const displayTotal = Number(o.total || o.totalPrice || 0);
            const isMyPurchase = (o.customerUid === myUid) || (o.customerId === myUid) || (o.buyerId === myUid) || (o.userId === myUid) || (o.uid === myUid);
            const isMySale = (role === 'admin' || o.marketerId === myUid || o.ownerId === myUid);
            const dateStr = o.date ? o.date.split(',')[0] : 'أخرى'; 
            
            let statusText = t('status_pending');
            let badgeClass = "status-pending";
            if(o.status === 'completed') { statusText = t('status_completed'); badgeClass = "status-completed"; }
            else if(o.status === 'failed') { statusText = t('status_failed'); badgeClass = "status-failed"; }

            if(isMyPurchase && o.status === 'completed') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-green-400 mb-1">${t('msg_order_delivered')} ${o.productName}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }
            if(isMyPurchase && o.status === 'failed') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-red-400 mb-1">${t('msg_order_canceled')} ${o.productName}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }

            if(isMyPurchase) {
                myPurchaseHtml += `<div class="glass p-5 rounded-2xl flex justify-between items-center border border-white/5 animate-slide mb-2 list-item-fast"><div><h4 class="text-[10px] font-black text-blue-400 uppercase">${o.productName || t('order_product')}</h4><p class="text-[8px] text-gray-500 mt-1">${o.date || ''}</p></div><span class="status-badge ${badgeClass}">${statusText}</span></div>`;
            }

            if(isMySale) {
                if(!o.status || o.status === 'pending') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-yellow-400 mb-1">${t('msg_new_order')} ${o.productName} ${t('msg_with_amount')} ${displayTotal} ${t('currency')}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }
                if(o.status === 'completed') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-blue-400 mb-1">${t('msg_profit_added')} ${o.productName}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }

                if(o.status === 'completed') {
                    rev += displayTotal;
                    adminPlatformProfit += (displayTotal * 0.10);
                    succ++;
                    if(!dailyRevData[dateStr]) dailyRevData[dateStr] = 0;
                    dailyRevData[dateStr] += displayTotal;
                    
                    successHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center"><p class="text-[10px] font-bold text-white">${o.productName}</p><p class="text-xs font-black text-green-400">${displayTotal} ${t('currency')}</p></div>`;
                } else if(o.status === 'failed') { 
                    fail++; 
                    failedHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center"><p class="text-[10px] font-bold text-white">${o.productName}</p><p class="text-xs font-black text-red-400">${displayTotal} ${t('currency')}</p></div>`;
                }

                if(!o.status || o.status === 'pending') {
                    if(['admin', 'merchant'].includes(role)) {
                        incomingHtml += `
                        <div class="glass p-6 rounded-3xl border border-white/10 space-y-4 animate-slide mb-3 list-item-fast">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-black text-blue-400">${o.productName || t('order_product')}</h4>
                                    <p class="text-[10px] text-white mt-1">${t('order_client_name')}: ${o.customerName || t('lbl_unknown')} | ${t('lbl_qty')}: ${o.qty || o.quantity || 1}</p>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <button onclick="viewOrderDetails('${key}')" class="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-[9px] font-black hover:bg-blue-600 hover:text-white transition">${t('btn_order_details')}</button>
                                </div>
                            </div>
                            <div class="flex justify-between items-center border-t border-white/5 pt-4">
                                <p class="text-white font-black text-xs">${t('order_amount')}: ${displayTotal} ${t('currency')}</p>
                                <span class="status-badge status-pending">${t('status_pending')}</span>
                            </div>
                        </div>`;
                    }
                }
            }
        });

        if(myPurchaseList) myPurchaseList.innerHTML = myPurchaseHtml || `<p class="text-[10px] text-gray-500 text-center py-4">${t('no_my_orders')}</p>`;
        if(incomingList) incomingList.innerHTML = incomingHtml || `<p class="text-[10px] text-gray-500 text-center py-4">${t('no_new_orders')}</p>`;
        if(successListInner) successListInner.innerHTML = successHtml || `<p class="text-[10px] text-gray-500 text-center py-2">لا توجد طلبات ناجحة</p>`;
        if(failedListInner) failedListInner.innerHTML = failedHtml || `<p class="text-[10px] text-gray-500 text-center py-2">لا توجد طلبات ملغاة</p>`;

        document.getElementById('totalRevenue').innerText = rev.toFixed(2) + " " + t('currency');
        document.getElementById('successOrdersCount').innerText = succ;
        document.getElementById('failedOrdersCount').innerText = fail;

        if (role === 'admin') {
            const adminWallet = document.getElementById('walletBalance');
            if(adminWallet) adminWallet.innerText = adminPlatformProfit.toFixed(2) + " " + t('currency');
        }
        
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        if(notifCount > 0) {
            badge.innerText = notifCount;
            badge.classList.remove('hidden');
            list.innerHTML = notificationsHtml;
        } else {
            badge.classList.add('hidden');
            list.innerHTML = `<p class="text-gray-500 text-center py-4">${t('no_notifs')}</p>`;
        }
        
        if(['admin', 'merchant', 'marketer'].includes(role)) {
            let todayTotal = dailyRevData[todayStr] || 0;
            document.getElementById('todaySalesValue').innerText = todayTotal + " " + t('currency');
            renderSalesChart(dailyRevData);
        }
    });
}

window.toggleNotif = () => {
    const drop = document.getElementById('notifDropdown');
    drop.classList.toggle('hidden');
    if(!drop.classList.contains('hidden')) document.getElementById('notifBadge').classList.add('hidden');
};

function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart');
    if(!ctx) return;
    if(salesChartInstance) { salesChartInstance.destroy(); }

    const labels = Object.keys(data).reverse(); 
    const values = Object.values(data).reverse(); 

    if(labels.length === 1) { labels.unshift("أمس"); values.unshift(0); }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : [t('val_unavailable')],
            datasets: [{
                label: t('stat_total_sales'),
                data: values.length ? values : [0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } } }
            }
        }
    });
}

function loadMarketersForAdmin() {
    onValue(ref(db, 'users'), (snap) => {
        const users = snap.val();
        const tbody = document.getElementById('marketersTableBody');
        let tableHtml = '';
        
        Object.keys(users).forEach(uid => {
            const u = users[uid];
            if(u.role === 'merchant') {
                const debt = u.wallet?.debt || 0;
                const phone = u.phone || u.phoneNumber || `<span class="text-gray-600">${t('not_registered')}</span>`;
                tableHtml += `<tr class="hover:bg-white/5 transition list-item-fast">
                    <td class="p-4 font-bold text-white">${u.name}</td>
                    <td class="p-4 text-gray-400 text-[10px] font-mono tracking-widest">${phone}</td>
                    <td class="p-4 text-red-500 font-black">${debt.toFixed(2)} ${t('currency')}</td>
                    <td class="p-4"><button onclick="settleDebt('${uid}')" class="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg font-black hover:bg-blue-600 hover:text-white transition text-[9px]">${t('btn_settle')}</button></td>
                </tr>`;
            }
        });
        tbody.innerHTML = tableHtml || `<tr><td colspan="4" class="text-center p-4 text-gray-500 text-[10px]">${t('val_unavailable')}</td></tr>`;
    });
}

window.settleDebt = async (merchantUid) => {
    if(confirm(t('msg_settle_confirm'))) {
        try { await update(ref(db, `users/${merchantUid}/wallet`), { debt: 0 }); showToast(t('msg_debt_zeroed')); } catch(e) { showToast(t('msg_failed')); }
    }
};

window.viewOrderDetails = (id) => {
    const o = currentOrdersData[id];
    const displayTotal = o.total || o.totalPrice || 0;
    const body = document.getElementById('orderModalBody');
    const actions = document.getElementById('orderModalActions');
    
    body.innerHTML = `
    <div class="space-y-4">
        <div><label class="text-gray-500 text-[10px] block">${t('order_client_name')}</label><p class="text-white font-bold">${o.customerName || t('val_unavailable')}</p></div>
        <div><label class="text-gray-500 text-[10px] block">${t('order_client_phone')}</label><p class="text-white font-bold font-mono">${o.phone || t('val_unavailable')}</p></div>
        <div><label class="text-gray-500 text-[10px] block">${t('order_client_address')}</label><p class="text-white font-bold">${o.address || t('val_unavailable')}</p></div>
    </div>
    <div class="space-y-4">
        <div><label class="text-gray-500 text-[10px] block">${t('order_product')}</label><p class="text-blue-400 font-bold">${o.productName || t('val_unavailable')}</p></div>
        <div class="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <div><label class="text-gray-500 text-[9px] block">${t('lbl_color')}</label><p class="text-white font-black text-xs">${o.color || t('val_default')}</p></div>
            <div><label class="text-gray-500 text-[9px] block">${t('lbl_size')}</label><p class="text-white font-black text-xs">${o.size || t('val_default')}</p></div>
            <div><label class="text-gray-500 text-[9px] block">${t('lbl_qty')}</label><p class="text-white font-black text-xs">${o.qty || o.quantity || 1}</p></div>
        </div>
        <div><label class="text-gray-500 text-[10px] block">${t('order_amount')}</label><p class="text-green-400 font-black text-xl">${displayTotal} ${t('currency')}</p></div>
        <div><button onclick="viewReceipt('${o.receipt || ''}')" class="text-blue-400 underline text-xs font-bold hover:text-white transition">${t('btn_view_receipt')}</button></div>
    </div>`;
    
    actions.innerHTML = `<button onclick="updateOrderStatus('${id}', 'completed', ${displayTotal})" class="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-green-500 transition shadow-lg btn-glow">${t('btn_delivered')}</button><button onclick="updateOrderStatus('${id}', 'failed', 0)" class="flex-1 bg-red-600/20 text-red-500 py-3 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition">${t('btn_cancel')}</button>`;
    document.getElementById('orderFullDetailsModal').classList.remove('hidden');
};

function loadContent(uId, wishlist) {
    onValue(ref(db, 'products'), (snap) => {
        const prods = snap.val() || {};
        allProducts = prods;
        const wishGrid = document.getElementById('wishlistGrid');
        const myGrid = document.getElementById('myProductsGrid');
        
        let wishHtml = '';
        let myHtml = '';
        let myCount = 0;
        
        Object.keys(prods).forEach(key => {
            const p = prods[key];
            if(wishlist.includes(key)) {
                wishHtml += `<div class="glass p-4 rounded-3xl border border-white/5 flex gap-4 items-center animate-slide list-item-fast"><img src="${p.image}" loading="lazy" class="w-12 h-12 rounded-xl object-cover shadow-lg"><div class="flex-1 font-bold text-[10px]"><h4 class="text-white line-clamp-1">${p.name}</h4><p class="text-blue-400 mt-1">${p.price} ${t('currency')}</p></div><a href="details.html?id=${key}" class="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition rounded-xl text-[9px] font-black shadow-md">${t('btn_details')}</a></div>`;
            }
            if(p.owner === uId) { 
                myHtml += `<div class="glass p-4 rounded-3xl border border-white/5 flex gap-4 items-center animate-slide list-item-fast">
                    <img src="${p.image}" loading="lazy" class="w-12 h-12 rounded-xl object-cover shadow-lg">
                    <div class="flex-1 font-bold text-[10px]">
                        <h4 class="text-white line-clamp-1">${p.name}</h4>
                        <p class="text-blue-400 mt-1">${p.price} ${t('currency')}</p>
                        ${p.oldPrice ? `<p class="text-green-400 mt-1">${t('p_commission')} ${p.oldPrice} ${t('currency')}</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-1">
                        <a href="details.html?id=${key}" class="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition rounded-lg text-[9px] font-black shadow-md text-center">${t('btn_details')}</a>
                        <button onclick="deleteProduct('${key}')" class="px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition rounded-lg text-[9px] font-black shadow-md">${t('btn_delete')}</button>
                    </div>
                </div>`;
                myCount++; 
            }
        });

        wishGrid.innerHTML = wishHtml || `<p class="text-[10px] text-gray-500 col-span-full text-center py-4">${t('no_favorites')}</p>`;
        if(myGrid) myGrid.innerHTML = myHtml || `<p class="text-[10px] text-gray-500 col-span-full text-center py-4">${t('no_my_products')}</p>`;
        
        document.getElementById('wishCount').innerText = wishlist.length;
        if(document.getElementById('prodCount')) document.getElementById('prodCount').innerText = myCount;
    });
}

window.deleteProduct = (id) => confirm(t('msg_delete_confirm')) && remove(ref(db, 'products/' + id)) && showToast(t('msg_delete_success'));

window.showJoinForm = () => { document.getElementById('requestStatic').classList.add('hidden'); document.getElementById('joinForm').classList.remove('hidden'); };

window.sendFullMarketerRequest = async () => {
    const phone = document.getElementById('reqPhone').value; const address = document.getElementById('reqAddress').value;
    if(!phone || !address) return showToast(t('msg_data_incomplete'));
    
    await set(ref(db, 'marketer_requests/' + myUid), { uid: myUid, name: document.getElementById('userName').innerText, email: document.getElementById('userEmail').innerText, phone, address, bio: document.getElementById('reqBio').value, date: new Date().toLocaleString('ar-EG') });
    await update(ref(db, 'users/' + myUid), { phone: phone }); 
    showToast(t('msg_req_sent_success'));
    setTimeout(() => location.reload(), 2000);
};

async function checkIfRequestActive() {
    const reqSnap = await get(ref(db, 'marketer_requests/' + myUid));
    if(reqSnap.exists()) document.getElementById('requestMarketerSection').classList.add('hidden');
    else document.getElementById('requestMarketerSection').classList.remove('hidden');
}

window.updateProfile = async () => {
    const u = {};
    if(document.getElementById('newName').value) u.name = document.getElementById('newName').value;
    if(document.getElementById('newPhone').value) u.phone = document.getElementById('newPhone').value; 
    if(window.newProfileBase64) u.photo = window.newProfileBase64; 
    
    if(Object.keys(u).length > 0) {
        await update(ref(db, 'users/' + myUid), u); 
        showToast(t('msg_update_success'));
        setTimeout(() => location.reload(), 1500);
    } else showToast(t('msg_no_data_update'));
};

window.viewReceipt = (v) => { 
    if(!v) return showToast(t('msg_no_receipt'));
    if(v.startsWith('http') || v.startsWith('data:image')) {
        const w = window.open("");
        w.document.write(`<img src="${v}" style="width:100%;max-width:600px;margin:auto;display:block;">`);
    } 
    else { document.getElementById('receiptContent').innerText = v; document.getElementById('receiptModal').classList.remove('hidden'); } 
};

window.setLanguage = (lang) => { localStorage.setItem('lang', lang); location.reload(); };
window.closeOrderModal = () => document.getElementById('orderFullDetailsModal').classList.add('hidden');
window.closeReceipt = () => document.getElementById('receiptModal').classList.add('hidden');
window.toggleSettingsModal = () => document.getElementById('settingsModal').classList.toggle('hidden');
window.showToast = (m) => { const t = document.getElementById('toast'); t.innerText = m; t.style.opacity = '1'; setTimeout(() => t.style.opacity = '0', 3000); };
window.logout = () => confirm(t('msg_logout_confirm')) && signOut(auth).then(() => window.location.href = "login.html");
