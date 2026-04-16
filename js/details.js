import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, set, update, runTransaction, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// === هنا تم تعريف المتغيرات بوضوح عشان إيرور urlParams ميظهرش ===
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const encodedName = urlParams.get('name');
const encodedPrice = urlParams.get('price');

// استدعاء الصورة من الرابط، ولو مش موجودة يسحبها من الذاكرة المؤقتة (localStorage)
const productImageURL = urlParams.get('image');
const storedImage = localStorage.getItem('temp_prod_image');
const finalImage = productImageURL ? decodeURIComponent(productImageURL) : (storedImage || '');

let currentUser = null;
let productData = null;
let currentQty = 1;
let selectedColor = '';
let selectedSize = '';

window.showToast = (m) => { 
    const tst = document.getElementById('toast'); 
    tst.innerText = m; 
    tst.style.opacity = '1'; 
    tst.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => { 
        tst.style.opacity = '0'; 
        tst.style.transform = 'translate(-50%, 0)';
    }, 3000); 
};

window.setLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    location.reload();
};

onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; }
    init();
});

// === دالة تشغيل العدادات الوهمية (الاستعجال) ===
function startUrgencyCounters() {
    // 1. عداد الزوار (رقم عشوائي بيتغير)
    const visitorEl = document.getElementById('visitorCount');
    if(visitorEl) {
        setInterval(() => {
            let current = parseInt(visitorEl.innerText);
            let change = Math.floor(Math.random() * 3) - 1; // بيزود أو ينقص 1
            let next = current + change;
            if(next < 8) next = 8;
            if(next > 45) next = 45;
            visitorEl.innerText = next;
        }, 5000);
    }

    // 2. عداد تنازلي للوقت (مثلاً يبدأ من ساعتين و15 دقيقة)
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

async function init() {
    if (!productId) {
        showToast("المنتج غير موجود!");
        setTimeout(() => window.location.href = "products.html", 2000);
        return;
    }

    // تشغيل العدادات
    startUrgencyCounters();

    // عرض البيانات الأولية فوراً لسرعة التحميل
    document.getElementById('prodName').innerText = encodedName ? decodeURIComponent(encodedName) : 'جاري التحميل...';
    document.getElementById('prodPrice').innerText = encodedPrice ? encodedPrice + ' ج.م' : '...';
    
    if (finalImage) {
        document.getElementById('mainImage').src = finalImage;
    } else {
        // صورة رمادية في حالة عدم وجود صورة عشان نتجنب إيرور ERR_CONNECTION_CLOSED
        document.getElementById('mainImage').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2364748b'%3EStart Online%3C/text%3E%3C/svg%3E";
    }

    // جلب باقي التفاصيل من الداتا بيز
    try {
        const snap = await get(ref(db, 'products/' + productId));
        if (snap.exists()) {
            productData = snap.val();
            
            document.getElementById('prodName').innerText = productData.name;
            document.getElementById('prodPrice').innerText = productData.price + ' ج.م';
            document.getElementById('prodCategory').innerText = (productData.category || 'عام') + " | " + (productData.subCategory || 'عام');
            
            if(productData.oldPrice) {
                const oldEl = document.getElementById('prodOldPrice');
                oldEl.innerText = "عمولة المسوق: " + productData.oldPrice + ' ج.م';
                oldEl.classList.remove('hidden');
            }

            if(productData.image && !finalImage) {
                document.getElementById('mainImage').src = productData.image;
            }
            
            document.getElementById('prodDesc').innerText = productData.desc || 'لا يوجد وصف متاح لهذا المنتج.';

            // معالجة الألوان
            if(productData.colors) {
                const colors = productData.colors.split(',').map(c => c.trim()).filter(c => c);
                if(colors.length > 0) {
                    document.getElementById('prodOptions').classList.remove('hidden');
                    document.getElementById('colorContainer').classList.remove('hidden');
                    selectedColor = colors[0];
                    const colorHtml = colors.map(c => `<button onclick="selectColor('${c}', this)" class="color-btn px-4 py-2 rounded-xl text-xs font-bold border border-white/20 hover:border-blue-500 transition ${c===colors[0] ? 'bg-blue-600 border-blue-500' : 'bg-white/5'}">${c}</button>`).join('');
                    document.getElementById('colorOptions').innerHTML = colorHtml;
                }
            }

            // معالجة المقاسات
            if(productData.sizes) {
                const sizes = productData.sizes.split(',').map(s => s.trim()).filter(s => s);
                if(sizes.length > 0) {
                    document.getElementById('prodOptions').classList.remove('hidden');
                    document.getElementById('sizeContainer').classList.remove('hidden');
                    selectedSize = sizes[0];
                    const sizeHtml = sizes.map(s => `<button onclick="selectSize('${s}', this)" class="size-btn px-4 py-2 rounded-xl text-xs font-bold border border-white/20 hover:border-blue-500 transition ${s===sizes[0] ? 'bg-blue-600 border-blue-500' : 'bg-white/5'}">${s}</button>`).join('');
                    document.getElementById('sizeOptions').innerHTML = sizeHtml;
                }
            }

            // الصور الإضافية
            if(productData.extraImages) {
                const extras = productData.extraImages.split(',').map(i => i.trim()).filter(i => i);
                if(extras.length > 0) {
                    const cont = document.getElementById('extraImagesContainer');
                    cont.classList.remove('hidden');
                    let html = `<img src="${productData.image || finalImage}" onclick="changeMainImage(this.src)" class="w-16 h-16 rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-blue-500 transition">`;
                    extras.forEach(img => {
                        html += `<img src="${img}" onclick="changeMainImage(this.src)" class="w-16 h-16 rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-blue-500 transition">`;
                    });
                    cont.innerHTML = html;
                }
            }
            
            loadReviews();
        }
    } catch (e) {
        console.error("Error loading product details", e);
    }
}

window.selectColor = (c, btn) => {
    selectedColor = c;
    document.querySelectorAll('.color-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'border-blue-500');
        b.classList.add('bg-white/5');
    });
    btn.classList.remove('bg-white/5');
    btn.classList.add('bg-blue-600', 'border-blue-500');
};

window.selectSize = (s, btn) => {
    selectedSize = s;
    document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'border-blue-500');
        b.classList.add('bg-white/5');
    });
    btn.classList.remove('bg-white/5');
    btn.classList.add('bg-blue-600', 'border-blue-500');
};

window.changeMainImage = (src) => { document.getElementById('mainImage').src = src; };

window.updateQty = (val) => {
    currentQty += val;
    if(currentQty < 1) currentQty = 1;
    document.getElementById('qtyDisplay').innerText = currentQty;
};

// الأزرار: السلة والطلب
window.addToCart = async () => {
    if(!currentUser) { showToast("يجب تسجيل الدخول أولاً!"); return; }
    const pName = productData ? productData.name : decodeURIComponent(encodedName);
    const pPrice = productData ? productData.price : encodedPrice;
    const pImg = productData ? productData.image : finalImage;
    const pOwner = productData ? productData.owner : null;

    const cartItem = {
        id: productId, name: pName, price: pPrice, qty: currentQty,
        color: selectedColor || 'عام', size: selectedSize || 'عام',
        image: pImg, owner: pOwner
    };

    const cartKey = `carts/${currentUser.uid}/${productId}_${selectedColor}_${selectedSize}`;
    await set(ref(db, cartKey), cartItem);
    showToast("تمت الإضافة للسلة بنجاح! 🛒");
};

window.goToOrderFast = () => {
    const pName = productData ? productData.name : decodeURIComponent(encodedName);
    const pPrice = productData ? productData.price : encodedPrice;
    const pImg = productData ? productData.image : finalImage;
    const pOwner = productData ? productData.owner : 'null';
    
    // تأكيد حفظ الصورة في الذاكرة للصفحة اللي جاية
    localStorage.setItem('temp_prod_image', pImg);

    const url = `order.html?id=${productId}&name=${encodeURIComponent(pName)}&price=${pPrice}&qty=${currentQty}&color=${encodeURIComponent(selectedColor || 'عام')}&size=${encodeURIComponent(selectedSize || 'عام')}&owner=${pOwner}`;
    window.location.href = url;
};

// التقييمات
function loadReviews() {
    onValue(ref(db, `reviews/${productId}`), (snap) => {
        const data = snap.val();
        const list = document.getElementById('reviewsList');
        if(!data) { list.innerHTML = `<p class="text-gray-500 text-xs text-center py-4">لا توجد تقييمات بعد.</p>`; return; }
        
        let html = '';
        Object.values(data).reverse().forEach(r => {
            const stars = "★".repeat(r.rating) + `<span class="text-gray-600">` + "★".repeat(5-r.rating) + `</span>`;
            html += `<div class="bg-white/5 p-4 rounded-2xl border border-white/5 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-blue-400">${r.userName || 'مستخدم'}</span>
                    <span class="text-yellow-400 text-xs">${stars}</span>
                </div>
                <p class="text-gray-300 text-[10px] italic">${r.comment}</p>
            </div>`;
        });
        list.innerHTML = html;
    });
}

window.submitReview = async () => {
    if(!currentUser) { showToast("يجب تسجيل الدخول لإضافة تقييم!"); return; }
    const comment = document.getElementById('reviewText').value;
    const rating = document.getElementById('reviewRating').value;
    
    if(!comment.trim()) { showToast("اكتب تعليقاً أولاً!"); return; }

    const userSnap = await get(ref(db, 'users/' + currentUser.uid));
    const userName = userSnap.exists() ? userSnap.val().name : 'مستخدم';

    await push(ref(db, `reviews/${productId}`), {
        userId: currentUser.uid, userName, rating: Number(rating), comment, date: new Date().toLocaleString('ar-EG')
    });

    document.getElementById('reviewText').value = '';
    showToast("تم إضافة تقييمك بنجاح! ⭐");
};
