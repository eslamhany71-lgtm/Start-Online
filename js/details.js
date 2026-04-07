import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const prodId = params.get('id');
let unitPrice = 0, quantity = 1, productOwnerId = "", selectedColor = "عام", selectedSize = "عام", mainImgUrl = "", userData = {};

if(window.applyLanguage) applyLanguage(localStorage.getItem('lang') || 'ar');
window.setLanguage = (lang) => { localStorage.setItem('lang', lang); location.reload(); };

onAuthStateChanged(auth, async (user) => { 
    if (user) { 
        const uSnap = await get(ref(db, 'users/' + user.uid));
        userData = uSnap.exists() ? uSnap.val() : { name: "مستخدم" };
        init(); 
        loadReviews();
    } else { window.location.href = "login.html"; } 
});

async function init() {
    const snap = await get(ref(db, 'products/' + prodId));
    if(snap.exists()) {
        const p = snap.val();
        unitPrice = parseFloat(p.price); productOwnerId = p.owner; mainImgUrl = p.image;
        document.getElementById('detName').innerText = p.name;
        document.getElementById('detPriceView').innerText = unitPrice + " ج.م";
        
        document.getElementById('detDesc').innerText = p.desc || "لا يوجد وصف إضافي متاح لهذا المنتج.";
        
        if(p.oldPrice && p.oldPrice.trim() !== '') {
            document.getElementById('detOldPriceContainer').classList.remove('hidden');
            document.getElementById('detOldPrice').innerText = p.oldPrice + " ج.م";
        }

        document.getElementById('mainImg').src = p.image;
        document.getElementById('detMat').innerText = p.material || "خامة ممتازة";
        document.getElementById('detMod').innerText = p.model || "2024";

        const thumbs = document.getElementById('thumbList');
        const images = [p.image]; if(p.extraImages) images.push(...p.extraImages.split(','));
        images.forEach((url, i) => {
            if(!url.trim()) return;
            const img = document.createElement('img'); img.src = url.trim();
            img.className = `thumb-img shadow-xl ${i === 0 ? 'active' : ''}`;
            img.loading = "lazy"; // كبسولة السرعة للصور المصغرة
            img.onclick = () => {
                document.getElementById('mainImg').src = img.src;
                thumbs.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
                img.classList.add('active');
            };
            thumbs.appendChild(img);
        });

        if(p.colors) buildSpecs(p.colors, 'colorsList', (v) => selectedColor = v);
        if(p.sizes) buildSpecs(p.sizes, 'sizesList', (v) => selectedSize = v);

        updateFinalPrice();
        startCountdown();
    }
}

function buildSpecs(data, containerId, callback) {
    document.getElementById(containerId).parentElement.classList.remove('hidden');
    const arr = data.includes('،') ? data.split('،') : data.split(',');
    arr.forEach((item, index) => {
        if(!item.trim()) return;
        const btn = document.createElement('button'); btn.className = `spec-btn shadow-md ${index === 0 ? 'active' : ''}`; btn.innerText=item.trim();
        if(index === 0) callback(item.trim()); 
        btn.onclick=() => { callback(item.trim()); btn.parentElement.querySelectorAll('.spec-btn').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); };
        document.getElementById(containerId).appendChild(btn);
    });
}

window.submitReview = async () => {
    const star = document.querySelector('input[name="star"]:checked');
    const text = document.getElementById('revText').value;
    if(!star) return showToast("يرجى اختيار عدد النجوم! ⭐");
    if(!text.trim()) return showToast("يرجى كتابة تعليق!");

    const reviewData = {
        uid: auth.currentUser.uid,
        userName: userData.name,
        rating: star.value,
        comment: text,
        date: new Date().toLocaleDateString('ar-EG')
    };

    await push(ref(db, `reviews/${prodId}`), reviewData);
    showToast("شكراً لتقييمك الرائع! ⭐");
    document.getElementById('revText').value = "";
    document.querySelector('input[name="star"]:checked').checked = false;
};

function loadReviews() {
    onValue(ref(db, `reviews/${prodId}`), (snap) => {
        const container = document.getElementById('reviewsContainer');
        const data = snap.val();
        if(data) {
            let revHtml = '';
            Object.values(data).reverse().forEach(r => {
                revHtml += `
                    <div class="glass p-6 rounded-[25px] border border-white/10 animate-fade-in hover:bg-white/10 transition-colors shadow-lg">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-blue-200 font-black text-xs bg-blue-600/30 px-4 py-1.5 rounded-full border border-blue-500/40 shadow-inner">${r.userName}</span>
                            <span class="text-yellow-400 text-sm tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">${"★".repeat(r.rating)}<span class="text-gray-600/50">${"★".repeat(5-r.rating)}</span></span>
                        </div>
                        <p class="text-gray-200 text-sm italic leading-relaxed drop-shadow-sm">${r.comment}</p>
                        <p class="text-[9px] text-gray-400 mt-4 text-left font-bold tracking-widest">${r.date}</p>
                    </div>`;
            });
            container.innerHTML = revHtml;
        } else {
            container.innerHTML = `
            <div class="text-center py-12 bg-black/30 rounded-3xl border border-white/10 shadow-inner backdrop-blur-md">
                <span class="text-5xl block mb-4 opacity-70 drop-shadow-md">✨</span>
                <p class='text-gray-300 font-black text-xs uppercase tracking-widest drop-shadow-sm' data-key="be_first_review">كن أول من يقيم هذا الإبداع!</p>
            </div>`;
        }
    });
}

window.shareProduct = () => {
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('detName').innerText,
            text: 'شاهد هذا المنتج الرائع على Start Online!',
            url: window.location.href,
        }).then(() => {
            showToast("تم فتح نافذة المشاركة بنجاح! 🔗");
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast("تم نسخ الرابط! يمكنك مشاركته الآن 🔗");
        });
    }
};

window.changeQty = (v) => { quantity = Math.max(1, quantity + v); document.getElementById('qtyView').innerText = quantity; updateFinalPrice(); };
window.updateFinalPrice = () => {
    const gov = document.getElementById('govSelect');
    const shipping = parseFloat(gov.options[gov.selectedIndex].getAttribute('data-price')) || 0;
    const total = (unitPrice * quantity) + shipping;
    document.getElementById('finalPriceView').innerText = total + " ج.م";
};

window.addToCart = async () => {
    const item = { id: prodId, name: document.getElementById('detName').innerText, price: unitPrice, qty: quantity, color: selectedColor, size: selectedSize, image: mainImgUrl };
    await push(ref(db, `carts/${auth.currentUser.uid}`), item);
    showToast("تمت الإضافة للسلة بنجاح! 🛒");
};

window.goToOrder = () => {
    const gov = document.getElementById('govSelect').value;
    if(gov === "0") return showToast("يرجى اختيار المحافظة أولاً لتقدير الشحن 🚚");
    const shipping = document.getElementById('govSelect').options[document.getElementById('govSelect').selectedIndex].getAttribute('data-price');
    const total = document.getElementById('finalPriceView').innerText.replace(" ج.م", "");
    window.location.href = `order.html?id=${prodId}&name=${encodeURIComponent(document.getElementById('detName').innerText)}&price=${unitPrice}&qty=${quantity}&color=${encodeURIComponent(selectedColor)}&size=${encodeURIComponent(selectedSize)}&gov=${gov}&shipping=${shipping}&total=${total}&image=${encodeURIComponent(mainImgUrl)}&owner=${productOwnerId}`;
};

function startCountdown() {
    const end = new Date().setHours(23, 59, 59);
    setInterval(() => {
        const dist = end - new Date().getTime();
        document.getElementById("hours").innerText = Math.floor((dist / (1000 * 60 * 60)) % 24).toString().padStart(2,'0');
        document.getElementById("minutes").innerText = Math.floor((dist / 1000 / 60) % 60).toString().padStart(2,'0');
        document.getElementById("seconds").innerText = Math.floor((dist / 1000) % 60).toString().padStart(2,'0');
    }, 1000);
}

window.showToast = (m) => { const t = document.getElementById('toast'); t.innerText = m; t.style.opacity = '1'; t.style.transform = 'translate(-50%, -20px)'; setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 0)'; }, 3000); };
setInterval(() => { document.getElementById('live-viewers').innerText = Math.floor(Math.random() * 40) + 60; }, 3000);
