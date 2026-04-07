import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const unitPrice = parseFloat(params.get('price')) || 0;
const qty = parseInt(params.get('qty')) || 1;
const shipping = parseFloat(params.get('shipping')) || 0;
const marketerId = params.get('owner');

const color = params.get('color') && params.get('color') !== 'null' ? params.get('color') : 'عام';
const size = params.get('size') && params.get('size') !== 'null' ? params.get('size') : 'عام';
const gov = params.get('gov') || 'لم يتم التحديد';

let selectedPayMethod = 'cod';
let buyerUid = null;

onAuthStateChanged(auth, (user) => { if(user) buyerUid = user.uid; });

document.getElementById('invName').innerText = params.get('name');
document.getElementById('invImg').src = params.get('image');
document.getElementById('invGov').innerText = `المحافظة: ${gov}`;
document.getElementById('invSpecs').innerText = `اللون: ${color} | المقاس: ${size}`;

document.getElementById('pPrice').innerText = unitPrice + " ج.م";
document.getElementById('pQty').innerText = qty + " قطعة";
document.getElementById('pShipping').innerText = shipping + " ج.م";
document.getElementById('totalPrice').innerText = (unitPrice * qty + shipping) + " ج.م";

if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
window.setLanguage = (lang) => { localStorage.setItem('lang', lang); location.reload(); };

window.selectPay = (method) => {
    selectedPayMethod = method;
    document.querySelectorAll('.pay-card').forEach(c => c.classList.remove('active'));
    document.getElementById('btn-' + method).classList.add('active');
    
    const prepaidInfo = document.getElementById('prepaidInfo');
    if(method === 'cod') { prepaidInfo.classList.add('hidden'); } 
    else { prepaidInfo.classList.remove('hidden'); fetchMarketerDetails(); }
};

async function fetchMarketerDetails() {
    const displayElem = document.getElementById('payNumDisplay');
    displayElem.innerText = "...";
    if(!marketerId || marketerId === 'null') return;
    const snap = await get(ref(db, `users/${marketerId}/paymentMethods`));
    if(snap.exists()) {
        const methods = snap.val();
        let num = "غير متوفر";
        if(selectedPayMethod === 'vodafone' && methods.vodafone) num = methods.vodafone;
        if(selectedPayMethod === 'etisalat' && methods.etisalat) num = methods.etisalat;
        if(selectedPayMethod === 'orange' && methods.orange) num = methods.orange;
        if(selectedPayMethod === 'instapay' && methods.instapay) num = methods.instapay;
        displayElem.innerText = num;
    }
}

document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = "جاري تأكيد الطلب... ⏳";
    submitBtn.disabled = true;

    const orderData = {
        productName: params.get('name'), marketerId: marketerId, customerUid: buyerUid || 'guest', 
        customerName: document.getElementById('custName').value, phone: document.getElementById('custPhone1').value,
        address: `${gov} - ${document.getElementById('custAddress').value}`,
        total: (unitPrice * qty + shipping), payMethod: selectedPayMethod,
        receipt: document.getElementById('receiptLink') ? document.getElementById('receiptLink').value || 'N/A' : 'N/A',
        color: color, size: size, qty: qty, status: 'pending', date: new Date().toLocaleString('ar-EG')
    };
    try {
        await set(push(ref(db, 'orders')), orderData);
        document.getElementById('successBox').classList.remove('hidden');
    } catch (error) {
        alert("حدث خطأ، يرجى المحاولة مرة أخرى.");
        submitBtn.innerHTML = "تأكيد الطلب 🔒"; submitBtn.disabled = false;
    }
};
