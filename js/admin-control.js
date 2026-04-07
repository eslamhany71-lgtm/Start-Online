import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const listContainer = document.getElementById('adminUsersList');

// التحقق من إن اللي فاتح أدمن الأول قبل جلب الداتا
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const uSnap = await get(ref(db, 'users/' + user.uid));
        if (uSnap.exists() && uSnap.val().role === 'admin') {
            loadMerchantsDebts();
        } else {
            showToast(t('msg_admin_only'));
            setTimeout(() => window.location.href = "index.html", 2000);
        }
    } else {
        window.location.href = "login.html";
    }
});

// وظيفة جلب ديون التجار
function loadMerchantsDebts() {
    onValue(ref(db, 'users'), (snapshot) => {
        listContainer.innerHTML = '';
        const users = snapshot.val();
        let hasMerchants = false;

        for (let id in users) {
            const user = users[id];
            
            if (user.role === 'merchant') {
                hasMerchants = true;
                const debtNum = (user.wallet && user.wallet.debt) ? Number(user.wallet.debt) : 0;
                
                let payInfo = `<span class="text-gray-600">${t('lbl_no_nums')}</span>`;
                if (user.paymentMethods) {
                    const methods = Object.entries(user.paymentMethods)
                        .filter(([k, v]) => v.trim() !== '')
                        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
                        .join(' | ');
                    if(methods) payInfo = `<div class="pay-info-box">${methods}</div>`;
                }

                const isZeroDebt = debtNum <= 0;
                const btnClass = isZeroDebt 
                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white hover:scale-105 shadow-lg';

                listContainer.innerHTML += `
                    <tr class="transition-colors list-item-fast border-b border-white/5 last:border-0">
                        <td class="p-6">
                            <p class="font-black text-white text-sm">${user.name}</p>
                            <p class="text-[10px] text-gray-500 mt-1 tracking-widest">${user.email}</p>
                        </td>
                        <td class="p-6">${payInfo}</td>
                        <td class="p-6 font-black ${debtNum > 0 ? 'text-red-500' : 'text-gray-400'} text-lg tracking-tighter drop-shadow-md">
                            ${debtNum.toFixed(2)} <span class="text-xs">${t('currency')}</span>
                        </td>
                        <td class="p-6">
                            <button ${isZeroDebt ? 'disabled' : ''} onclick="clearDebt('${id}', '${user.name.replace(/'/g, "\\'")}')" class="px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border border-transparent ${isZeroDebt ? '' : 'border-green-500/30'} ${btnClass}">
                                ${isZeroDebt ? t('no_debt') : t('confirm_collection')}
                            </button>
                        </td>
                    </tr>
                `;
            }
        }
        
        if(!hasMerchants) {
            listContainer.innerHTML = `<tr><td colspan="4" class="text-center p-10 text-gray-500 text-xs italic font-bold">${t('msg_no_merchants')}</td></tr>`;
        }
    });
}

// وظيفة تصفير المديونية مربوطة بالـ window عشان الـ onclick
window.clearDebt = async (userId, userName) => {
    if(confirm(`${t('msg_settle_confirm')} "${userName}" ?`)) {
        try {
            await update(ref(db, `users/${userId}/wallet`), { debt: 0 });
            showToast(t('msg_debt_zeroed'));
        } catch(error) {
            showToast(t('msg_error_conn'));
        }
    }
};

// وظيفة التنبيهات
window.showToast = (m) => { 
    const tst = document.getElementById('toast'); 
    tst.innerText = m; 
    tst.style.opacity = '1'; 
    tst.style.transform = 'translateY(-10px)';
    setTimeout(() => { 
        tst.style.opacity = '0'; 
        tst.style.transform = 'translateY(0)';
    }, 3000); 
};
