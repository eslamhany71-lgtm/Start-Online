import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        onValue(ref(db, `users/${user.uid}/wallet`), (snap) => {
            const data = snap.val() || { balance: 0, debt: 0 };
            const balanceNum = Number(data.balance) || 0;
            const debtNum = Number(data.debt) || 0;
            document.getElementById('userBalance').innerHTML = `${balanceNum.toFixed(2)} <span class="text-sm text-gray-400">${t('currency')}</span>`;
            document.getElementById('platformDebt').innerHTML = `${debtNum.toFixed(2)} <span class="text-sm text-white">${t('currency')}</span>`;
        });

        onValue(ref(db, `transactions/${user.uid}`), (snap) => {
            const list = document.getElementById('transList');
            list.innerHTML = ""; 
            if(snap.exists()) {
                let transHtml = '';
                Object.values(snap.val()).reverse().forEach(tItem => {
                    const isPlus = tItem.type === 'plus';
                    const colorClass = isPlus ? 'text-green-400' : 'text-red-400';
                    const sign = isPlus ? '+' : '-';
                    const bgBadge = isPlus ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';

                    transHtml += `
                        <div class="flex justify-between items-center p-5 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 list-item-fast">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl ${bgBadge} flex items-center justify-center border font-black text-lg ${colorClass}">
                                    ${isPlus ? '↓' : '↑'}
                                </div>
                                <div>
                                    <p class="text-xs font-black text-white mb-1 tracking-widest">${tItem.title}</p>
                                    <p class="text-[9px] text-gray-500 font-mono">${tItem.date}</p>
                                </div>
                            </div>
                            <span class="${colorClass} font-black text-sm tracking-tighter drop-shadow-md">
                                ${sign}${Number(tItem.amount).toFixed(2)} ${t('currency')}
                            </span>
                        </div>`;
                });
                list.innerHTML = transHtml;
            } else {
                list.innerHTML = `<p class="text-gray-500 text-sm italic text-center py-10 bg-black/20 rounded-2xl border border-white/5">${t('msg_no_transactions')}</p>`;
            }
        });
    } else {
        window.location.href = "login.html";
    }
});

window.openPayModal = () => {
    const modal = document.getElementById('payModal');
    modal.classList.remove('hidden');
    modal.querySelector('.glass').style.animation = 'slideIn 0.4s ease-out forwards';
};

window.closePayModal = () => document.getElementById('payModal').classList.add('hidden');
