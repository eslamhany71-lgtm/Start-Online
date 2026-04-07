import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyCyypXt8LnHiVBR2Ka0Mb8ntXu6dJH9N-w", authDomain: "start-online-6f460.firebaseapp.com", projectId: "start-online-6f460", databaseURL: "https://start-online-6f460-default-rtdb.firebaseio.com/" };
const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getDatabase(app);

let myUid = null; let myRole = 'user'; let currentOrdersData = {};
let salesChartInstance = null; 

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
            document.getElementById('userRoleBadge').innerText = myRole.toUpperCase();
            document.getElementById('userImg').src = u.photo || `https://ui-avatars.com/api/?name=${u.name}&background=3b82f6&color=fff`;
            document.getElementById('userPhoneDisplay').innerText = u.phone || "لم يتم تسجيل رقم هاتف";
            
            if(myRole === 'admin') {
                document.getElementById('adminMarketerPanel').classList.remove('hidden');
                loadMarketersForAdmin();
                document.getElementById('debtRow').style.display = 'none';
                document.getElementById('walletBalanceLabel').innerText = "أرباح المنصة (10%):";
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
                        document.getElementById('walletBalance').innerText = (Number(w.balance) || 0).toFixed(2) + " ج.م";
                        document.getElementById('walletDebt').innerText = (Number(w.debt) || 0).toFixed(2) + " ج.م";
                    });
                }
            } else {
                if(user.uid === myUid) checkIfRequestActive();
            }
            
            loadOrders(myRole);
            loadContent(myUid, u.wishlist || []);
        }
        if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
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
    await set(ref(db, `users/${myUid}/paymentMethods`), p); showToast("تم تحديث كافة المحافظ ✅");
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
        closeOrderModal(); showToast("تم تحديث الحالة ✅");
    } catch (e) { showToast("خطأ في الاتصال!"); }
};

function loadOrders(role) {
    onValue(ref(db, 'orders'), (snap) => {
        currentOrdersData = snap.val() || {};
        const incomingList = document.getElementById('ordersList');
        const myPurchaseList = document.getElementById('myPurchasesList');
        
        let rev = 0, succ = 0, fail = 0;
        let adminPlatformProfit = 0; 
        let dailyRevData = {}; 
        let notificationsHtml = ''; 
        let notifCount = 0;

        let myPurchaseHtml = '';
        let incomingHtml = '';

        let todayStr = new Date().toLocaleString('ar-EG').split(',')[0];
        const keys = Object.keys(currentOrdersData).reverse();
        
        keys.forEach(key => {
            const o = currentOrdersData[key];
            const displayTotal = Number(o.total || o.totalPrice || 0);
            const isMyPurchase = (o.customerUid === myUid) || (o.customerId === myUid) || (o.buyerId === myUid) || (o.userId === myUid) || (o.uid === myUid);
            const dateStr = o.date ? o.date.split(',')[0] : 'أخرى'; 
            
            let statusKey = "order_status_pending";
            let statusText = "قيد الانتظار";
            if(o.status === 'completed') { statusKey = "order_status_completed"; statusText = "تم التسليم"; }
            else if(o.status === 'failed') { statusKey = "order_status_failed"; statusText = "ملغاة"; }

            if(isMyPurchase && o.status === 'completed') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-green-400 mb-1">تم تسليم طلبك: ${o.productName}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }
            if(isMyPurchase && o.status === 'failed') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-red-400 mb-1">تم إلغاء طلبك: ${o.productName}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }

            if(isMyPurchase) {
                myPurchaseHtml += `<div class="glass p-5 rounded-2xl flex justify-between items-center border border-white/5 animate-slide mb-2 list-item-fast"><div><h4 class="text-[10px] font-black text-blue-400 uppercase">${o.productName || 'طلب مشتريات'}</h4><p class="text-[8px] text-gray-500 mt-1">${o.date || ''}</p></div><span class="status-badge status-${o.status || 'pending'}" data-key="${statusKey}">${statusText}</span></div>`;
            }

            if(role === 'admin' || o.marketerId === myUid || o.ownerId === myUid) {
                if(!o.status || o.status === 'pending') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-yellow-400 mb-1">طلب جديد: ${o.productName} بـ ${displayTotal} ج.م</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }
                if(o.status === 'completed') { notificationsHtml += `<div class="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 hover:bg-white/10 transition"><p class="font-bold text-blue-400 mb-1">تم إضافة أرباح طلب ${o.productName}</p><p class="text-[8px] text-gray-500">${o.date}</p></div>`; notifCount++; }

                if(o.status === 'completed') {
                    rev += displayTotal;
                    adminPlatformProfit += (displayTotal * 0.10);
                    succ++;
                    if(!dailyRevData[dateStr]) dailyRevData[dateStr] = 0;
                    dailyRevData[dateStr] += displayTotal;
                } else if(o.status === 'failed') { fail++; }

                if(!o.status || o.status === 'pending') {
                    if(['admin', 'merchant'].includes(role)) {
                        incomingHtml += `
                        <div class="glass p-6 rounded-3xl border border-white/10 space-y-4 animate-slide mb-3 list-item-fast">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-black text-blue-400">${o.productName || 'منتج'}</h4>
                                    <p class="text-[10px] text-white mt-1">العميل: ${o.customerName || 'غير معروف'} | الكمية: ${o.qty || o.quantity || 1}</p>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <button onclick="viewOrderDetails('${key}')" class="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-[9px] font-black hover:bg-blue-600 hover:text-white transition">تفاصيل الطلب</button>
                                    <a href="details.html?id=${o.productId || o.id || ''}" class="text-center bg-white/10 text-white px-3 py-1.5 rounded-lg text-[9px] font-black hover:bg-white/20 transition">عرض المنتج</a>
                                </div>
                            </div>
                            <div class="flex justify-between items-center border-t border-white/5 pt-4">
                                <p class="text-white font-black text-xs">المبلغ: ${displayTotal} ج.م</p>
                                <span class="status-badge status-pending" data-key="order_status_pending">قيد الانتظار</span>
                            </div>
                        </div>`;
                    }
                }
            }
        });

        if(myPurchaseList) myPurchaseList.innerHTML = myPurchaseHtml || '<p class="text-[10px] text-gray-500 text-center py-4">لم تقم بأي طلبات بعد.</p>';
        if(incomingList) incomingList.innerHTML = incomingHtml || '<p class="text-[10px] text-gray-500 text-center py-4">لا توجد طلبات جديدة.</p>';

        document.getElementById('totalRevenue').innerText = rev.toFixed(2) + " ج.م";
        document.getElementById('successOrdersCount').innerText = succ;
        document.getElementById('failedOrdersCount').innerText = fail;

        if (role === 'admin') {
            const adminWallet = document.getElementById('walletBalance');
            if(adminWallet) adminWallet.innerText = adminPlatformProfit.toFixed(2) + " ج.م";
        }
        
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        if(notifCount > 0) {
            badge.innerText = notifCount;
            badge.classList.remove('hidden');
            list.innerHTML = notificationsHtml;
        } else {
            badge.classList.add('hidden');
            list.innerHTML = '<p class="text-gray-500 text-center py-4">لا توجد إشعارات حالياً.</p>';
        }
        
        if(['admin', 'merchant', 'marketer'].includes(role)) {
            let todayTotal = dailyRevData[todayStr] || 0;
            document.getElementById('todaySalesValue').innerText = todayTotal + " ج.م";
            renderSalesChart(dailyRevData);
        }

        if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
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
            labels: labels.length ? labels : ['لا توجد داتا'],
            datasets: [{
                label: 'المبيعات (ج.م)',
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
                const phone = u.phone || u.phoneNumber || '<span class="text-gray-600">غير مسجل</span>';
                tableHtml += `<tr class="hover:bg-white/5 transition list-item-fast">
                    <td class="p-4 font-bold text-white">${u.name}</td>
                    <td class="p-4 text-gray-400 text-[10px] font-mono tracking-widest">${phone}</td>
                    <td class="p-4 text-red-500 font-black">${debt.toFixed(2)} ج.م</td>
                    <td class="p-4"><button onclick="settleDebt('${uid}')" data-key="btn_settle" class="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg font-black hover:bg-blue-600 hover:text-white transition text-[9px]">تم الاستحقاق</button></td>
                </tr>`;
            }
        });
        tbody.innerHTML = tableHtml || `<tr><td colspan="4" class="text-center p-4 text-gray-500 text-[10px]">لا يوجد تجار حالياً</td></tr>`;
        if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
    });
}

window.settleDebt = async (merchantUid) => {
    if(confirm("هل استلمت المستحقات من التاجر؟ تصفير الدين سيتيح له النشر مجدداً.")) {
        try { await update(ref(db, `users/${merchantUid}/wallet`), { debt: 0 }); showToast("تم تصفير المديونية ✅"); } catch(e) { showToast("فشل!"); }
    }
};

window.viewOrderDetails = (id) => {
    const o = currentOrdersData[id];
    const displayTotal = o.total || o.totalPrice || 0;
    const body = document.getElementById('orderModalBody');
    const actions = document.getElementById('orderModalActions');
    
    body.innerHTML = `
    <div class="space-y-4">
        <div><label class="text-gray-500 text-[10px] block" data-key="order_client_name">العميل</label><p class="text-white font-bold">${o.customerName || 'غير متوفر'}</p></div>
        <div><label class="text-gray-500 text-[10px] block" data-key="order_client_phone">رقم الهاتف</label><p class="text-white font-bold font-mono">${o.phone || 'غير متوفر'}</p></div>
        <div><label class="text-gray-500 text-[10px] block" data-key="order_client_address">العنوان</label><p class="text-white font-bold">${o.address || 'غير متوفر'}</p></div>
    </div>
    <div class="space-y-4">
        <div><label class="text-gray-500 text-[10px] block" data-key="order_product">المنتج</label><p class="text-blue-400 font-bold">${o.productName || 'غير متوفر'}</p></div>
        <div class="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <div><label class="text-gray-500 text-[9px] block">اللون</label><p class="text-white font-black text-xs">${o.color || 'افتراضي'}</p></div>
            <div><label class="text-gray-500 text-[9px] block">المقاس</label><p class="text-white font-black text-xs">${o.size || 'افتراضي'}</p></div>
            <div><label class="text-gray-500 text-[9px] block">العدد</label><p class="text-white font-black text-xs">${o.qty || o.quantity || 1}</p></div>
        </div>
        <div><label class="text-gray-500 text-[10px] block" data-key="order_amount">المبلغ النهائي</label><p class="text-green-400 font-black text-xl">${displayTotal} ج.م</p></div>
        <div><button onclick="viewReceipt('${o.receipt || ''}')" class="text-blue-400 underline text-xs font-bold hover:text-white transition" data-key="btn_view_receipt">عرض إثبات الدفع</button></div>
    </div>`;
    
    actions.innerHTML = `<button onclick="updateOrderStatus('${id}', 'completed', ${displayTotal})" class="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-green-500 transition shadow-lg btn-glow" data-key="btn_delivered">تم التسليم</button><button onclick="updateOrderStatus('${id}', 'failed', 0)" class="flex-1 bg-red-600/20 text-red-500 py-3 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition" data-key="btn_cancel">إلغاء</button>`;
    document.getElementById('orderFullDetailsModal').classList.remove('hidden');
    if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
};

function loadContent(uId, wishlist) {
    onValue(ref(db, 'products'), (snap) => {
        const prods = snap.val() || {};
        const wishGrid = document.getElementById('wishlistGrid');
        const myGrid = document.getElementById('myProductsGrid');
        
        let wishHtml = '';
        let myHtml = '';
        let myCount = 0;
        
        Object.keys(prods).forEach(key => {
            const p = prods[key];
            if(wishlist.includes(key)) {
                wishHtml += `<div class="glass p-4 rounded-3xl border border-white/5 flex gap-4 items-center animate-slide list-item-fast"><img src="${p.image}" class="w-12 h-12 rounded-xl object-cover shadow-lg"><div class="flex-1 font-bold text-[10px]"><h4 class="text-white line-clamp-1">${p.name}</h4><p class="text-blue-400 mt-1">${p.price} ج.م</p></div><a href="details.html?id=${key}" class="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition rounded-xl text-[9px] font-black shadow-md" data-key="btn_details">عرض</a></div>`;
            }
            if(p.owner === uId) { 
                myHtml += `<div class="glass p-4 rounded-3xl border border-white/5 flex gap-4 items-center animate-slide list-item-fast">
                    <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover shadow-lg">
                    <div class="flex-1 font-bold text-[10px]">
                        <h4 class="text-white line-clamp-1">${p.name}</h4>
                        <p class="text-blue-400 mt-1">${p.price} ج.م</p>
                        ${p.oldPrice ? `<p class="text-green-400 mt-1">عمولتك: ${p.oldPrice} ج.م</p>` : ''}
                    </div>
                    <div class="flex flex-col gap-1">
                        <a href="details.html?id=${key}" class="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition rounded-lg text-[9px] font-black shadow-md text-center" data-key="btn_details">عرض</a>
                        <button onclick="editProduct('${key}', '${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.image}', '${p.oldPrice || ''}')" class="px-2 py-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white transition rounded-lg text-[9px] font-black shadow-md" data-key="btn_edit">تعديل</button>
                        <button onclick="deleteProduct('${key}')" class="px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition rounded-lg text-[9px] font-black shadow-md" data-key="btn_delete">حذف</button>
                    </div>
                </div>`;
                myCount++; 
            }
        });

        wishGrid.innerHTML = wishHtml || '<p class="text-[10px] text-gray-500 col-span-full text-center py-4">لا توجد مفضلات حالياً.</p>';
        if(myGrid) myGrid.innerHTML = myHtml || '<p class="text-[10px] text-gray-500 col-span-full text-center py-4">لم تقم بنشر أي منتجات بعد.</p>';
        
        document.getElementById('wishCount').innerText = wishlist.length;
        if(document.getElementById('prodCount')) document.getElementById('prodCount').innerText = myCount;
        if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
    });
}

window.editProduct = async (id, oldN, oldP, oldI, oldComm) => { 
    const nn = prompt("الاسم الجديد:", oldN); 
    const np = prompt("السعر الجديد:", oldP); 
    const nComm = prompt("العمولة الجديدة:", oldComm !== 'undefined' && oldComm !== 'null' ? oldComm : '');
    const ni = prompt("رابط الصورة الجديد:", oldI); 
    if(nn && np) { 
        await update(ref(db, 'products/' + id), { name: nn, price: np, oldPrice: nComm, image: ni }); 
        showToast("تم التحديث بنجاح!"); 
    } 
};

window.deleteProduct = (id) => confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟") && remove(ref(db, 'products/' + id)) && showToast("تم الحذف بنجاح.");

window.openOrderArchive = (status) => {
    const sect = document.getElementById('orderArchiveSection');
    const list = document.getElementById('archiveList');
    sect.classList.remove('hidden'); 
    let archiveHtml = '';
    Object.keys(currentOrdersData).forEach(key => {
        const o = currentOrdersData[key];
        if(o.status === status && (myRole === 'admin' || o.marketerId === myUid || o.ownerId === myUid)) {
            archiveHtml += `<div class="bg-white/5 p-4 rounded-2xl flex justify-between items-center text-[10px] mb-2 animate-slide border border-white/5 list-item-fast"><div><p class="text-blue-400 font-black">${o.productName || 'طلب'}</p><p class="text-gray-500 mt-1">${o.customerName || 'مجهول'}</p></div><span class="font-bold text-white text-xs">${o.total || o.totalPrice} ج.م</span></div>`;
        }
    });
    list.innerHTML = archiveHtml || '<p class="text-[10px] text-gray-500 text-center py-4">لا توجد سجلات في هذا الأرشيف.</p>';
};

window.showJoinForm = () => { document.getElementById('requestStatic').classList.add('hidden'); document.getElementById('joinForm').classList.remove('hidden'); };

window.sendFullMarketerRequest = async () => {
    const phone = document.getElementById('reqPhone').value; const address = document.getElementById('reqAddress').value;
    if(!phone || !address) return showToast("أكمل البيانات أولاً!");
    
    await set(ref(db, 'marketer_requests/' + myUid), { uid: myUid, name: document.getElementById('userName').innerText, email: document.getElementById('userEmail').innerText, phone, address, bio: document.getElementById('reqBio').value, date: new Date().toLocaleString('ar-EG') });
    await update(ref(db, 'users/' + myUid), { phone: phone }); 
    showToast("تم إرسال طلبك بنجاح!");
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
    if(document.getElementById('newImg').value) u.photo = document.getElementById('newImg').value;
    if(document.getElementById('newPhone').value) u.phone = document.getElementById('newPhone').value; 
    
    if(Object.keys(u).length > 0) {
        await update(ref(db, 'users/' + myUid), u); 
        showToast("تم الحفظ بنجاح!");
        setTimeout(() => location.reload(), 1500);
    } else showToast("لم تقم بإدخال بيانات للتحديث!");
};

window.viewReceipt = (v) => { 
    if(!v) return showToast("لا يوجد إيصال مرفق!");
    if(v.startsWith('http')) window.open(v, '_blank'); 
    else { document.getElementById('receiptContent').innerText = v; document.getElementById('receiptModal').classList.remove('hidden'); } 
};

window.setLanguage = (lang) => { localStorage.setItem('lang', lang); location.reload(); };
window.closeOrderModal = () => document.getElementById('orderFullDetailsModal').classList.add('hidden');
window.closeReceipt = () => document.getElementById('receiptModal').classList.add('hidden');
window.toggleSettings = () => document.getElementById('settingsPanel').classList.toggle('hidden');
window.showToast = (m) => { const t = document.getElementById('toast'); t.innerText = m; t.style.opacity = '1'; setTimeout(() => t.style.opacity = '0', 3000); };
window.logout = () => signOut(auth).then(() => window.location.href = "login.html");
