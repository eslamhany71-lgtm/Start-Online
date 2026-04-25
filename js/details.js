import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const params = new URLSearchParams(window.location.search);
const prodId = params.get('id');
let unitPrice = 0, quantity = 1, productOwnerId = "", selectedColor = t('sub_general'), selectedSize = t('sub_general'), mainImgUrl = "", userData = {}, productCategory = 'عام';

const paramImage = params.get('image');
const storedImage = localStorage.getItem('temp_prod_image');
const initialImage = paramImage ? decodeURIComponent(paramImage) : (storedImage || '');

// دالة تفاصيل المنتجات للعمل داخل هذه الصفحة
window.viewDetails = (id, n, p, i) => {
    localStorage.setItem('temp_prod_image', i); 
    window.location.href = `details.html?id=${id}&name=${encodeURIComponent(n)}&price=${p}`; 
};

window.setLanguage = (lang) => { 
    localStorage.setItem('lang', lang); 
    location.reload(); 
};

onAuthStateChanged(auth, async (user) => { 
    if (user) { 
        const uSnap = await get(ref(db, 'users/' + user.uid));
        userData = uSnap.exists() ? uSnap.val() : { name: t('guest') };
        init(); 
        loadReviews();
    } else { window.location.href = "login.html"; } 
});

function startCountdown() {
    const timerEl = document.getElementById('countdownTimer');
    let timeInSeconds = (2 * 3600) + (15 * 60) + Math.floor(Math.random() * 60); 
    if(timerEl) {
        setInterval(() => {
            timeInSeconds--;
            if(timeInSeconds < 0) timeInSeconds = 0;
            let h = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
            let m = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
            let s = (timeInSeconds % 60).toString().padStart(2, '0');
            timerEl.innerText = `${h}:${m}:${s}`;
        }, 1000);
    }
}

setInterval(() => { 
    const el = document.getElementById('live-viewers');
    if(el) {
        let current = parseInt(el.innerText);
        let change = Math.floor(Math.random() * 3) - 1; 
        let next = current + change;
        if(next < 8) next = 8;
        if(next > 45) next = 45;
        el.innerText = next;
    }
}, 4000);

// ظهور واختفاء زر الصعود للأعلى
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (window.scrollY > 400) {
        btn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
        btn.classList.add('opacity-100', 'translate-y-0');
    } else {
        btn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
        btn.classList.remove('opacity-100', 'translate-y-0');
    }
});

async function loadRelatedProducts(category) {
    const snap = await get(ref(db, 'products'));
    if(snap.exists()) {
        const allP = snap.val();
        // جلب 4 منتجات عشوائية من نفس القسم ما عدا المنتج الحالي
        const related = Object.keys(allP).filter(k => k !== prodId && allP[k].category === category).slice(0, 4);
        const grid = document.getElementById('relatedProductsGrid');
        
        if(related.length === 0) {
            grid.parentElement.classList.add('hidden');
            return;
        }
        
        let html = '';
        related.forEach(k => {
            const p = allP[k];
            const safeName = (p.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            html += `
            <div class="glass p-4 rounded-[25px] border border-white/5 text-right flex flex-col justify-between shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-shadow">
                <img src="${p.image}" class="w-full h-32 md:h-40 object-cover rounded-2xl mb-3 cursor-pointer hover:scale-[1.02] transition-transform" onclick="viewDetails('${k}', '${safeName}', '${p.price}', '${p.image}')">
                <h4 class="text-white font-bold text-[10px] md:text-xs line-clamp-1 mb-2">${p.name}</h4>
                <div class="flex justify-between items-center">
                    <span class="text-blue-400 font-black text-sm md:text-base">${p.price} ${t('currency')}</span>
                    <button onclick="viewDetails('${k}', '${safeName}', '${p.price}', '${p.image}')" class="bg-white/10 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-[9px] font-black transition">التفاصيل</button>
                </div>
            </div>`;
        });
        grid.innerHTML = html;
    }
}

async function init() {
    if (initialImage) {
        document.getElementById('mainImg').src = initialImage;
    }

    document.getElementById('detName').innerText = params.get('name') ? decodeURIComponent(params.get('name')) : '...';
    document.getElementById('detPriceView').innerText = params.get('price') ? params.get('price') + " " + t('currency') : '...';

    const snap = await get(ref(db, 'products/' + prodId));
    if(snap.exists()) {
        const p = snap.val();
        productCategory = p.category || 'عام';
        
        // تحديث مسار التنقل
        document.getElementById('breadcrumbCat').innerText = productCategory;

        unitPrice = parseFloat(p.price); productOwnerId = p.owner; mainImgUrl = p.image;
        
        document.getElementById('detName').innerText = p.name;
        // التأكد لو هو أدمن أو صاحب المنتج عشان يشوف بيانات الإنشاء
        if ((userData.role === 'admin' || p.owner === auth.currentUser.uid) && p.creatorName) {
            let creatorHtml = `<p>📝 نُشر بواسطة: <span class="text-blue-300 font-bold">${p.creatorName}</span> (${p.createdAt || 'قديم'})</p>`;
            if (p.updatedAt) {
                creatorHtml += `<p class="mt-1">🔄 عُدل بواسطة: <span class="text-yellow-500 font-bold">${p.updaterName}</span> (${p.updatedAt})</p>`;
            }
            document.getElementById('creatorInfo').innerHTML = creatorHtml;
            document.getElementById('creatorInfo').classList.remove('hidden');
        }
        document.getElementById('detPriceView').innerText = unitPrice + " " + t('currency');
        document.getElementById('detDesc').innerText = p.desc || t('no_extra_desc');
        
        // تجهيز رابط الواتساب بالرسالة
        const waMsg = `أهلاً، كنت حابب أستفسر عن المنتج: ${p.name} %0Aالرابط: ${window.location.href}`;
        document.getElementById('whatsappBtn').href = `https://wa.me/01149079451?text=${waMsg}`; // حط رقمك الحقيقي هنا بدل الأصفار
        
        if(p.oldPrice && p.oldPrice.trim() !== '') {
            document.getElementById('detOldPriceContainer').classList.remove('hidden');
            document.getElementById('detOldPrice').innerText = p.oldPrice + " " + t('currency');
        }

        if(!initialImage && p.image) {
            document.getElementById('mainImg').src = p.image;
        }
        
        document.getElementById('detMat').innerText = p.material || t('excellent_material');
        document.getElementById('detMod').innerText = p.model || "2024";

        const thumbs = document.getElementById('thumbList');
        let allImages = [p.image];
        if (p.extraImages) {
            allImages = allImages.concat(p.extraImages.split(','));
        }
        
        allImages.forEach((url, i) => {
            if(!url || !url.trim()) return;
            const img = document.createElement('img'); img.src = url.trim();
            img.className = `w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover cursor-pointer border-2 transition-all shadow-md ${i === 0 ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`;
            img.loading = "lazy";
            img.onclick = () => {
                document.getElementById('mainImg').src = img.src;
                thumbs.querySelectorAll('img').forEach(x => { x.classList.remove('border-blue-500', 'scale-105'); x.classList.add('border-transparent', 'opacity-60'); });
                img.classList.remove('border-transparent', 'opacity-60');
                img.classList.add('border-blue-500', 'scale-105');
            };
            thumbs.appendChild(img);
        });

        if(p.colors) buildSpecs(p.colors, 'colorsList', (v) => selectedColor = v, 'colorSection');
        if(p.sizes) buildSpecs(p.sizes, 'sizesList', (v) => selectedSize = v, 'sizeSection');

        updateFinalPrice();
        startCountdown();
        
        // تحميل المنتجات ذات الصلة
        loadRelatedProducts(productCategory);
    }
}

function buildSpecs(data, containerId, callback, sectionId) {
    document.getElementById(sectionId).classList.remove('hidden');
    const arr = data.includes('،') ? data.split('،') : data.split(',');
    arr.forEach((item, index) => {
        if(!item.trim()) return;
        const btn = document.createElement('button'); 
        btn.className = `px-4 py-2 rounded-xl text-xs font-bold transition-all border ${index === 0 ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-white/5 text-gray-300 border-white/10 hover:border-blue-400'}`; 
        btn.innerText=item.trim();
        if(index === 0) callback(item.trim()); 
        btn.onclick=() => { 
            callback(item.trim()); 
            btn.parentElement.querySelectorAll('button').forEach(x => {
                x.classList.remove('bg-blue-600', 'text-white', 'border-blue-500', 'shadow-lg');
                x.classList.add('bg-white/5', 'text-gray-300', 'border-white/10');
            }); 
            btn.classList.remove('bg-white/5', 'text-gray-300', 'border-white/10');
            btn.classList.add('bg-blue-600', 'text-white', 'border-blue-500', 'shadow-lg'); 
        };
        document.getElementById(containerId).appendChild(btn);
    });
}

window.submitReview = async () => {
    const star = document.querySelector('input[name="star"]:checked');
    const text = document.getElementById('revText').value;
    if(!star) return showToast(t('msg_select_stars') || 'يرجى تحديد عدد النجوم');
    if(!text.trim()) return showToast(t('msg_write_comment') || 'يرجى كتابة تعليقك');

    const reviewData = { uid: auth.currentUser.uid, userName: userData.name, rating: Number(star.value), comment: text, date: new Date().toLocaleDateString('ar-EG') };
    await push(ref(db, `reviews/${prodId}`), reviewData);
    showToast(t('msg_review_thanks') || 'تم إضافة تقييمك بنجاح! ⭐');
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
                    <div class="glass p-5 rounded-[25px] border border-white/5 animate-fade-in shadow-lg">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-blue-300 font-black text-[10px] bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">${r.userName}</span>
                            <span class="text-yellow-400 text-xs drop-shadow-md">${"★".repeat(r.rating)}<span class="text-gray-600/50">${"★".repeat(5-r.rating)}</span></span>
                        </div>
                        <p class="text-gray-200 text-xs italic leading-relaxed">${r.comment}</p>
                        <p class="text-[8px] text-gray-500 mt-3 font-mono tracking-widest">${r.date}</p>
                    </div>`;
            });
            container.innerHTML = revHtml;
        } else {
            container.innerHTML = `
            <div class="text-center py-10 bg-white/5 rounded-[30px] border border-white/5 shadow-inner">
                <span class="text-4xl block mb-2 opacity-50">✨</span>
                <p class='text-gray-400 font-bold text-[10px] uppercase tracking-widest'>${t('be_first_review') || 'كن أول من يقيّم هذا المنتج!'}</p>
            </div>`;
        }
    });
}

window.shareProduct = () => {
    if (navigator.share) {
        navigator.share({ title: document.getElementById('detName').innerText, url: window.location.href })
        .then(() => showToast(t('msg_share_opened'))).catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => showToast(t('msg_link_copied') || 'تم نسخ الرابط!'));
    }
};

window.changeQty = (v) => { quantity = Math.max(1, quantity + v); document.getElementById('qtyView').innerText = quantity; updateFinalPrice(); };

window.updateFinalPrice = () => {
    const gov = document.getElementById('govSelect');
    const shipping = parseFloat(gov.options[gov.selectedIndex].getAttribute('data-price')) || 0;
    const total = (unitPrice * quantity) + shipping;
    document.getElementById('finalPriceView').innerText = total + " " + t('currency');
};

window.addToCart = async () => {
    const item = { id: prodId, name: document.getElementById('detName').innerText, price: unitPrice, qty: quantity, color: selectedColor, size: selectedSize, image: mainImgUrl };
    await set(ref(db, `carts/${auth.currentUser.uid}/${prodId}_${selectedColor}_${selectedSize}`), item);
    showToast(t('msg_added_cart') || 'تمت الإضافة للسلة! 🛒');
};

window.goToOrder = () => {
    const gov = document.getElementById('govSelect').value;
    if(gov === "0") return showToast(t('msg_select_gov_first') || 'يرجى اختيار المحافظة أولاً لتقدير الشحن!');
    const shipping = document.getElementById('govSelect').options[document.getElementById('govSelect').selectedIndex].getAttribute('data-price');
    const total = document.getElementById('finalPriceView').innerText.replace(` ${t('currency')}`, "");
    
    localStorage.setItem('temp_prod_image', mainImgUrl);

    window.location.href = `order.html?id=${prodId}&name=${encodeURIComponent(document.getElementById('detName').innerText)}&price=${unitPrice}&qty=${quantity}&color=${encodeURIComponent(selectedColor)}&size=${encodeURIComponent(selectedSize)}&gov=${encodeURIComponent(gov)}&shipping=${shipping}&total=${total}&owner=${productOwnerId}&cat=${encodeURIComponent(productCategory)}`;
};

window.showToast = (m) => { 
    const tst = document.getElementById('toast'); 
    tst.innerText = m; 
    tst.style.opacity = '1'; 
    tst.style.transform = 'translate(-50%, -20px)'; 
    setTimeout(() => { 
        tst.style.opacity = '0'; 
        tst.style.transform = 'translate(-50%, 0)'; 
    }, 3000); 
};

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        e.target.classList.add('hidden');
    }
    const notifDropdown = document.getElementById('notifDropdown');
    const clickedOnNotifBtn = e.target.closest('button[onclick="toggleNotif()"]');
    if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
        if (!notifDropdown.contains(e.target) && !clickedOnNotifBtn) {
            notifDropdown.classList.add('hidden');
        }
    }
});
