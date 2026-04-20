import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const unitPrice = parseFloat(params.get('price')) || 0;
const qty = parseInt(params.get('qty')) || 1;
const shipping = parseFloat(params.get('shipping')) || 0;
const marketerId = params.get('owner');

// ✅ الإضافة: قراءة اسم القسم عشان نعرف لو عبايات
const cat = params.get('cat') ? decodeURIComponent(params.get('cat')) : '';

const paramImage = params.get('image');
const storedImage = localStorage.getItem('temp_prod_image');
const finalImage = paramImage ? decodeURIComponent(paramImage) : (storedImage || '');

const color = params.get('color') && params.get('color') !== 'null' ? decodeURIComponent(params.get('color')) : t('sub_general');
const size = params.get('size') && params.get('size') !== 'null' ? decodeURIComponent(params.get('size')) : t('sub_general');
const gov = params.get('gov') ? decodeURIComponent(params.get('gov')) : t('not_specified');

let selectedPayMethod = 'cod';
let buyerUid = null;

window.setLanguage = (lang) => { 
    localStorage.setItem('lang', lang); 
    location.reload(); 
};

onAuthStateChanged(auth, (user) => { if(user) buyerUid = user.uid; });

document.getElementById('invName').innerText = params.get('name') ? decodeURIComponent(params.get('name')) : '...';
document.getElementById('invImg').src = finalImage;
document.getElementById('invGov').innerText = `${t('gov_shipping')} ${gov}`;
document.getElementById('invSpecs').innerText = `${t('lbl_color')}: ${color} | ${t('lbl_size')}: ${size}`;

document.getElementById('pPrice').innerText = unitPrice + " " + t('currency');
document.getElementById('pQty').innerText = qty + " " + (t('piece') || 'قطعة');
document.getElementById('pShipping').innerText = shipping + " " + t('currency');
document.getElementById('totalPrice').innerText = (unitPrice * qty + shipping) + " " + t('currency');

window.selectPay = (method) => {
    selectedPayMethod = method;
    
    document.querySelectorAll('.pay-card').forEach(c => {
        c.classList.remove('border-2', 'border-blue-500', 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', 'bg-blue-600/10', 'active');
        c.classList.add('border', 'border-white/5', 'bg-white/5');
        const icon = c.querySelector('.check-icon');
        if(icon) icon.classList.replace('flex', 'hidden');
    });
    
    const activeCard = document.getElementById('btn-' + method);
    if(activeCard) {
        activeCard.classList.remove('border', 'border-white/5', 'bg-white/5');
        activeCard.classList.add('border-2', 'border-blue-500', 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', 'bg-blue-600/10', 'active');
        const activeIcon = activeCard.querySelector('.check-icon');
        if(activeIcon) activeIcon.classList.replace('hidden', 'flex');
    }
    
    const prepaidInfo = document.getElementById('prepaidInfo');
    if(method === 'cod') { 
        prepaidInfo.classList.add('hidden'); 
    } else { 
        prepaidInfo.classList.remove('hidden'); 
        fetchMarketerDetails(); 
    }
};

// ✅ الإضافة: حظر الدفع عند الاستلام لو القسم "عبايات"
if(cat === 'عبايات') {
    const codBtn = document.getElementById('btn-cod');
    if(codBtn) {
        codBtn.classList.add('hidden'); // إخفاء الكارت تماماً
        setTimeout(() => {
            selectPay('vodafone'); // يختار فودافون كاش إجباري
            alert('تنبيه: قسم العبايات يتطلب دفع مقدم إجباري، ولا يتوفر الدفع عند الاستلام.');
        }, 400); // تأخير بسيط عشان التنبيه يظهر بعد ما الصفحة تحمل
    }
}

async function fetchMarketerDetails() {
    const displayElem = document.getElementById('payNumDisplay');
    displayElem.innerText = "...";
    if(!marketerId || marketerId === 'null') return;
    
    try {
        const snap = await get(ref(db, `users/${marketerId}/paymentMethods`));
        if(snap.exists()) {
            const methods = snap.val();
            let num = t('val_unavailable') || 'غير متاح';
            if(selectedPayMethod === 'vodafone' && methods.vodafone) num = methods.vodafone;
            if(selectedPayMethod === 'etisalat' && methods.etisalat) num = methods.etisalat;
            if(selectedPayMethod === 'orange' && methods.orange) num = methods.orange;
            if(selectedPayMethod === 'instapay' && methods.instapay) num = methods.instapay;
            displayElem.innerText = num;
        }
    } catch (e) {
        displayElem.innerText = "خطأ في التحميل";
    }
}

document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = t('msg_order_confirming') || 'جاري تأكيد الطلب... ⏳';
    submitBtn.disabled = true;

    const orderData = {
        productName: params.get('name') ? decodeURIComponent(params.get('name')) : 'منتج', 
        marketerId: marketerId, 
        customerUid: buyerUid || 'guest', 
        customerName: document.getElementById('custName').value, 
        phone: document.getElementById('custPhone1').value,
        address: `${gov} - ${document.getElementById('custAddress').value}`,
        total: (unitPrice * qty + shipping), 
        payMethod: selectedPayMethod,
        receipt: document.getElementById('receiptLink') ? document.getElementById('receiptLink').value || 'N/A' : 'N/A',
        color: color, 
        size: size, 
        qty: qty, 
        status: 'pending', 
        date: new Date().toLocaleString('ar-EG')
    };
    
    try {
        await set(push(ref(db, 'orders')), orderData);
        document.getElementById('successBox').classList.remove('hidden');
    } catch (error) {
        alert(t('msg_order_error') || 'حدث خطأ أثناء الطلب');
        submitBtn.innerHTML = originalText; 
        submitBtn.disabled = false;
    }
};

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});
