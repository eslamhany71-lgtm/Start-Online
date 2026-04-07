import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// بمجرد التحقق من تسجيل الدخول، هنجيب الداتا
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 1. جلب بيانات المحفظة (الرصيد والديون)
        onValue(ref(db, `users/${user.uid}/wallet`), (snap) => {
            const data = snap.val() || { balance: 0, debt: 0 };
            
            // تحديث الأرقام في الواجهة مع تثبيت العلامة العشرية (اختياري للشكل الاحترافي)
            const balanceNum = Number(data.balance) || 0;
            const debtNum = Number(data.debt) || 0;
            
            document.getElementById('userBalance').innerHTML = `${balanceNum.toFixed(2)} <span class="text-sm text-gray-400">ج.م</span>`;
            document.getElementById('platformDebt').innerHTML = `${debtNum.toFixed(2)} <span class="text-sm text-white">ج.م</span>`;
        });

        // 2. جلب سجل العمليات المالية
        onValue(ref(db, `transactions/${user.uid}`), (snap) => {
            const list = document.getElementById('transList');
            list.innerHTML = ""; // تنظيف القائمة
            
            if(snap.exists()) {
                let transHtml = '';
                // عكسنا المصفوفة عشان الجديد يظهر فوق
                Object.values(snap.val()).reverse().forEach(t => {
                    const isPlus = t.type === 'plus';
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
                                    <p class="text-xs font-black text-white mb-1 tracking-widest">${t.title}</p>
                                    <p class="text-[9px] text-gray-500 font-mono">${t.date}</p>
                                </div>
                            </div>
                            <span class="${colorClass} font-black text-sm tracking-tighter drop-shadow-md">
                                ${sign}${Number(t.amount).toFixed(2)} ج.م
                            </span>
                        </div>`;
                });
                list.innerHTML = transHtml;
            } else {
                list.innerHTML = '<p class="text-gray-500 text-sm italic text-center py-10 bg-black/20 rounded-2xl border border-white/5">لا توجد عمليات مسجلة حالياً.</p>';
            }
        });
    } else {
        // لو مش مسجل دخول، ارميه على صفحة الدخول
        window.location.href = "login.html";
    }
});

// دوال فتح وقفل نافذة الدفع
window.openPayModal = () => {
    const modal = document.getElementById('payModal');
    modal.classList.remove('hidden');
    // إضافة أنيميشن بسيط عند الفتح
    modal.querySelector('.glass').style.animation = 'slideIn 0.4s ease-out forwards';
};

window.closePayModal = () => {
    document.getElementById('payModal').classList.add('hidden');
};
