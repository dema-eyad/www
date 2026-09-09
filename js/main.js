// =========================================
// سلايدر صور الهيرو
// =========================================
const heroSection = document.querySelector('.hero');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// قائمة بالصور اللي رح تظهر في السلايدر
const images = [
    'image/hero-1.jpg',
    'image/hero-2.jpg',
    'image/hero-3.jpg'
];

let currentIndex = 0;

function changeSlide(index) {
    // منتحقق إنو الصورة موجودة فعلاً قبل ما نبدلها
    // إذا الصورة ناقصة أو اسمها غلط، رح تطلع رسالة بـ Console (F12) توضحلك وين المشكلة بالضبط
    const testImg = new Image();
    testImg.onload = () => {
        heroSection.style.backgroundImage = `url('${images[index]}')`;
    };
    testImg.onerror = () => {
        console.warn('⚠️ ما قدرت ألاقي الصورة: ' + images[index] + ' — تأكدي إنها موجودة بمجلد image/ وبنفس الاسم بالضبط');
    };
    testImg.src = images[index];
}

// 🔒 محمي بـ if(heroSection) عشان ما يوقف باقي main.js بصفحات مالها hero
if (heroSection && prevBtn && nextBtn) {
    nextBtn.addEventListener('click', () => {
        currentIndex++;
        if (currentIndex >= images.length) currentIndex = 0;
        changeSlide(currentIndex);
    });

    prevBtn.addEventListener('click', () => {
        currentIndex--;
        if (currentIndex < 0) currentIndex = images.length - 1;
        changeSlide(currentIndex);
    });

    setInterval(() => { nextBtn.click(); }, 5000);
}

// تفعيل تأثير 3D Tilt على أي كرت منتج بأي صفحة
const tiltCards = document.querySelectorAll(".elegant-card");
if (tiltCards.length > 0 && typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(tiltCards, {
        max: 12,
        speed: 400,
        glare: true,
        "max-glare": 0.3
    });
}

// إشعارات التنبيه (Toast)
const toastBox = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
let toastTimeout;

function showToast(message) {
    if (!toastBox || !toastMessage) return;
    toastMessage.textContent = message;
    toastBox.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastBox.classList.remove('show'), 3000);
}

// =========================================
// نظام السلة والمفضلة (بيحفظ بالمتصفح - localStorage)
// =========================================

function getCart() {
    return JSON.parse(localStorage.getItem('ciphera_cart') || '[]');
}
function saveCart(cart) {
    localStorage.setItem('ciphera_cart', JSON.stringify(cart));
    updateCartBadge();
}
function getWishlist() {
    return JSON.parse(localStorage.getItem('ciphera_wishlist') || '[]');
}
function saveWishlist(list) {
    localStorage.setItem('ciphera_wishlist', JSON.stringify(list));
    updateWishlistBadge();
}

// بياخد اسم المنتج وسعره وصورته من الكارد نفسه
// (id = رمز المنتج الحقيقي من قاعدة البيانات data-id لو موجود، وإلا مسار الصورة كبديل)
function getProductFromCard(card) {
    const img = card.querySelector('.card-image-box img');
    const nameEl = card.querySelector('.card-details h3');
    const priceEl = card.querySelector('.card-details .price');
    const dbId = card.dataset.id || null;
    const id = dbId || (img ? img.getAttribute('src') : (nameEl ? nameEl.textContent : Math.random().toString(36)));
    return {
        id: id,
        sku: dbId ? ('CPH-' + dbId.slice(0, 8).toUpperCase()) : generateSku(nameEl ? nameEl.textContent.trim() : id),
        name: nameEl ? nameEl.textContent.trim() : '',
        price: priceEl ? parseFloat(priceEl.textContent) : 0,
        image: img ? img.getAttribute('src') : ''
    };
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const totalQty = getCart().reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
}

function updateWishlistBadge() {
    const badge = document.getElementById('wishlist-count');
    if (!badge) return;
    const total = getWishlist().length;
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

function addToCart(product, qty = 1) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }
    saveCart(cart);
}

function removeFromCart(id) {
    const cart = getCart().filter(item => item.id !== id);
    saveCart(cart);
    renderCartDrawer();
}

function toggleWishlist(product) {
    let list = getWishlist();
    const exists = list.some(item => item.id === product.id);
    list = exists ? list.filter(item => item.id !== product.id) : [...list, product];
    saveWishlist(list);
    return !exists; // true يعني تمت الإضافة، false يعني تمت الإزالة
}

function removeFromWishlist(id) {
    const list = getWishlist().filter(item => item.id !== id);
    saveWishlist(list);
    renderWishlistDrawer();
    syncFavoriteIcons();
}

function renderCartDrawer() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = '<p class="drawer-empty">السلة فاضية لهلأ 🛍️</p>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="drawer-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="drawer-item-info">
                    <h4>${item.name}</h4>
                    <span class="drawer-item-price">${item.price}$ × ${item.qty}</span>
                </div>
                <span class="drawer-item-remove" data-id="${item.id}">✕</span>
            </div>
        `).join('');

        container.querySelectorAll('.drawer-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (totalEl) totalEl.textContent = total + '$';
}

function renderWishlistDrawer() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;
    const list = getWishlist();

    if (list.length === 0) {
        container.innerHTML = '<p class="drawer-empty">لسا ما ضفتي شي للمفضلة 💛</p>';
    } else {
        container.innerHTML = list.map(item => `
            <div class="drawer-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="drawer-item-info">
                    <h4>${item.name}</h4>
                    <span class="drawer-item-price">${item.price}$</span>
                </div>
                <span class="drawer-item-remove" data-id="${item.id}">✕</span>
            </div>
        `).join('');

        container.querySelectorAll('.drawer-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromWishlist(btn.dataset.id));
        });
    }
}

// بيلوّن أيقونات القلب الذهبي على المنتجات يلي أصلاً بالمفضلة (بيشتغل بكل صفحة لحالها)
function syncFavoriteIcons() {
    const list = getWishlist();
    document.querySelectorAll('.elegant-card').forEach(card => {
        const icon = card.querySelector('.favorite-icon');
        if (!icon) return;
        const product = getProductFromCard(card);
        const isFav = list.some(item => item.id === product.id);
        icon.style.color = isFav ? '#fff' : '#111';
        icon.style.background = isFav ? '#cda53f' : '#fff';
    });
}

// =========================================
// ربط تفاعلات الكارد (قلب المفضلة + أضيفي للسلة + عرض التفاصيل)
// دالة عامة قابلة لإعادة الاستخدام: منستخدمها أول ما تفتح الصفحة،
// وبرضو منعيد استخدامها لما نولّد كروت جديدة ديناميكياً (مثل "قد يعجبك أيضاً")
// =========================================
function bindCardInteractions(scope) {
    scope = scope || document;

    scope.querySelectorAll('.favorite-icon').forEach(icon => {
        if (icon.dataset.bound) return;
        icon.dataset.bound = '1';
        icon.addEventListener('click', function (e) {
            e.stopPropagation();
            const card = this.closest('.elegant-card');
            if (!card) return;
            const product = getProductFromCard(card);
            const added = toggleWishlist(product);
            showToast(added ? 'تمت الإضافة إلى المفضلة 💛' : 'تمت الإزالة من المفضلة');
            syncFavoriteIcons();
        });
    });

    scope.querySelectorAll('.add-cart-btn').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const card = this.closest('.elegant-card');
            if (!card) return;
            const product = getProductFromCard(card);
            addToCart(product);
            showToast('تمت الإضافة للسلة 🛍️');
        });
    });

    initDetailButtons(scope);
    initColorSwatches(scope);
}

// =========================================
// دوائر الألوان (Color Swatches)
// بتشتغل تلقائياً على أي كارد فيه data-colors="عدد الألوان"
// وبتدوّر عن صور الألوان جنب صورة المنتج الأصلية بنفس المجلد،
// بنفس اسم الصورة الأصلية + "-color-2" / "-color-3" ...الخ
// (شوفي الشرح الكامل تحت آخر الملف)
// =========================================
function initColorSwatches(scope) {
    scope = scope || document;
    scope.querySelectorAll('.elegant-card[data-colors]').forEach(card => {
        if (card.dataset.colorsBound) return;
        card.dataset.colorsBound = '1';
        loadCardColors(card);
    });
}

function probeImage(path) {
    return new Promise(resolve => {
        const testImg = new Image();
        testImg.onload = () => resolve(true);
        testImg.onerror = () => resolve(false);
        testImg.src = path;
    });
}

// بيشيل الامتداد (أو الامتدادين إذا كان فيه غلطة زي .jpg.png) من مسار الصورة
function stripImageExtension(path) {
    return path.replace(/(\.(jpe?g|png))+$/i, '');
}

async function findColorVariant(stem, index) {
    const extensions = ['jpg', 'jpeg', 'png', 'JPG', 'PNG', 'JPEG'];
    for (const ext of extensions) {
        const candidate = `${stem}-color-${index}.${ext}`;
        const found = await probeImage(candidate);
        if (found) return candidate;
    }
    return null;
}

async function loadCardColors(card) {
    const totalColors = parseInt(card.dataset.colors || '0', 10);
    if (!totalColors || totalColors < 2) return;

    const img = card.querySelector('.card-image-box img');
    if (!img) return;

    const originalSrc = img.getAttribute('src');
    const stem = stripImageExtension(originalSrc);
    const colorImages = [originalSrc];

    for (let i = 2; i <= totalColors; i++) {
        const found = await findColorVariant(stem, i);
        if (found) colorImages.push(found);
    }

    if (colorImages.length <= 1) return; // ما لقينا ولا صورة لون إضافية
    renderColorSwatches(card, colorImages);
}

function renderColorSwatches(card, images) {
    const imgBox = card.querySelector('.card-image-box');
    if (!imgBox || !imgBox.parentElement) return;
    if (imgBox.parentElement.querySelector('.color-swatches')) return;

    const wrap = document.createElement('div');
    wrap.className = 'color-swatches';

    images.forEach((src, i) => {
        const dot = document.createElement('span');
        dot.className = 'color-dot' + (i === 0 ? ' active' : '');
        dot.innerHTML = `<img src="${src}" alt="لون بديل">`;
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const mainImg = card.querySelector('.card-image-box img');
            if (mainImg) mainImg.setAttribute('src', src);
            wrap.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
        wrap.appendChild(dot);
    });

    imgBox.insertAdjacentElement('afterend', wrap);
}

// =========================================
// زر / رابط "عرض التفاصيل" — بينضاف تلقائياً لكل كارد منتج
// بالضغط عليه (أو على صورة المنتج) بينحفظ بيانات المنتج مؤقتاً
// وبيوديك على صفحة product.html
// =========================================
function initDetailButtons(scope) {
    scope = scope || document;

    scope.querySelectorAll('.elegant-card').forEach(card => {
        if (card.classList.contains('coming-soon') || card.dataset.detailBound) return;
        card.dataset.detailBound = '1';

        const details = card.querySelector('.card-details');
        if (details && !details.querySelector('.view-details-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'view-details-btn';
            btn.textContent = 'عرض التفاصيل';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openProductPage(card);
            });
            details.appendChild(btn);
        }

        const imgBox = card.querySelector('.card-image-box');
        if (imgBox) {
            imgBox.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-icon')) return;
                openProductPage(card);
            });
        }
    });
}

function openProductPage(card) {
    const product = getProductFromCard(card);

    // لو الكارد فيه دوائر ألوان جاهزة، منستخدم نفس صورها كمعرض بصفحة التفاصيل
    // (ومنرتبها عشان الصورة المختارة حالياً تكون أول وحدة)
    let images;
    const swatchWrap = card.querySelector('.color-swatches');
    if (swatchWrap) {
        images = Array.from(swatchWrap.querySelectorAll('.color-dot img')).map(img => img.getAttribute('src'));
        const currentIdx = images.indexOf(product.image);
        if (currentIdx > 0) {
            images = [images[currentIdx], ...images.slice(0, currentIdx), ...images.slice(currentIdx + 1)];
        }
    } else if (card.dataset.images) {
        images = card.dataset.images.split(',').map(s => s.trim()).filter(Boolean);
    } else {
        images = [product.image];
    }

    const heroTitle = document.querySelector('.page-hero-content h1');
    const categoryLabel = heroTitle ? heroTitle.textContent.trim() : 'كل المنتجات';
    const categoryPage = location.pathname.split('/').pop() || 'index.html';

    const fullProduct = {
        ...product,
        images,
        category: card.dataset.category || '',
        categoryLabel,
        categoryPage
    };

    // بنجهز كمان شوية منتجات مقترحة (من نفس الصنف أولاً) لقسم "قد يعجبك أيضاً"
    const allCards = Array.from(document.querySelectorAll('.elegant-card'))
        .filter(c => c !== card && !c.classList.contains('coming-soon'));
    const sameCategory = allCards.filter(c => c.dataset.category && c.dataset.category === card.dataset.category);
    const pool = sameCategory.length >= 4 ? sameCategory : allCards;
    const related = pool
        .slice()
        .sort(() => 0.5 - Math.random())
        .slice(0, 8)
        .map(getProductFromCard);

    try {
        sessionStorage.setItem('ciphera_view_product', JSON.stringify(fullProduct));
        sessionStorage.setItem('ciphera_related_products', JSON.stringify(related));
    } catch (e) { /* تجاهل لو الميموري ممتلئة */ }

    location.href = 'product.html';
}

// --- فتح وإغلاق درج السلة والمفضلة ---
const cartToggle = document.getElementById('cart-toggle');
const wishlistToggle = document.getElementById('wishlist-toggle');
const cartDrawer = document.getElementById('cart-drawer');
const wishlistDrawer = document.getElementById('wishlist-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const cartClose = document.getElementById('cart-close');
const wishlistClose = document.getElementById('wishlist-close');

// --- عناصر خطوتين السلة: (١) عرض المنتجات (٢) فورم بيانات الزبون ---
const cartItemsView = document.getElementById('cart-items');
const checkoutFormView = document.getElementById('checkout-form');
const cartContinueBtn = document.getElementById('cart-continue-btn');
const checkoutBackBtn = document.getElementById('checkout-back-btn');

function showCartStep1() {
    if (cartItemsView) cartItemsView.style.display = 'block';
    if (checkoutFormView) checkoutFormView.style.display = 'none';
    if (cartContinueBtn) cartContinueBtn.style.display = 'block';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
}

function showCartStep2() {
    if (cartItemsView) cartItemsView.style.display = 'none';
    if (checkoutFormView) checkoutFormView.style.display = 'flex';
    if (cartContinueBtn) cartContinueBtn.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'block';
}

if (cartContinueBtn) {
    cartContinueBtn.addEventListener('click', () => {
        if (getCart().length === 0) {
            showToast('السلة فاضية، ضيفي منتج الأول 🛍️');
            return;
        }
        showCartStep2();
    });
}

if (checkoutBackBtn) {
    checkoutBackBtn.addEventListener('click', showCartStep1);
}

function closeAllDrawers() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('show');
}

if (cartToggle && cartDrawer && drawerOverlay) {
    cartToggle.addEventListener('click', () => {
        renderCartDrawer();
        showCartStep1(); // دايماً منفتح على عرض المنتجات الأول
        cartDrawer.classList.add('open');
        drawerOverlay.classList.add('show');
    });
}
if (wishlistToggle && wishlistDrawer && drawerOverlay) {
    wishlistToggle.addEventListener('click', () => {
        renderWishlistDrawer();
        wishlistDrawer.classList.add('open');
        drawerOverlay.classList.add('show');
    });
}
if (cartClose) cartClose.addEventListener('click', closeAllDrawers);
if (wishlistClose) wishlistClose.addEventListener('click', closeAllDrawers);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeAllDrawers);

// =========================================
// زر "إتمام الشراء" — بيحفظ الطلب بقاعدة البيانات وبعدين يوديك عالواتساب
// =========================================
const WHATSAPP_STORE_NUMBER = '970594908375'; // رقم واتساب المتجر (فلسطين)

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        const cart = getCart();

        if (cart.length === 0) {
            showToast('السلة فاضية، ضيفي منتج الأول 🛍️');
            return;
        }

        const nameInput = document.getElementById('checkout-name');
        const phoneInput = document.getElementById('checkout-phone');
        const addressInput = document.getElementById('checkout-address');
        const notesInput = document.getElementById('checkout-notes');

        const customerName = nameInput ? nameInput.value.trim() : '';
        const customerPhone = phoneInput ? phoneInput.value.trim() : '';
        const customerAddress = addressInput ? addressInput.value.trim() : '';
        const customerNotes = notesInput ? notesInput.value.trim() : '';

        if (!customerName || !customerPhone) {
            showToast('عبّي اسمك ورقم هاتفك قبل إتمام الطلب 📝');
            return;
        }

        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'جاري إرسال الطلب...';

        // --- تجميع بيانات الطلب من عناصر السلة (Loop) ---
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const orderItems = cart.map(item => ({
            sku: item.sku || item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: +(item.price * item.qty).toFixed(2)
        }));

        // --- حفظ الطلب بجدول orders على Supabase ---
        if (supabaseClient) {
            const { error } = await supabaseClient.from('orders').insert([{
                items: orderItems,
                total: total,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: customerAddress,
                notes: customerNotes,
                status: 'pending'
            }]);

            if (error) {
                console.error('خطأ بحفظ الطلب بقاعدة البيانات:', error);
                showToast('تنبيه: ما انحفظ الطلب بالنظام، بس رح نكمل عالواتساب');
            }
        }

        // --- تجهيز نص رسالة الواتساب ---
        let message = `🛍️ *طلب جديد من متجر سيفيرا*\n\n`;
        message += `👤 الاسم: ${customerName}\n`;
        message += `📱 الهاتف: ${customerPhone}\n`;
        if (customerAddress) message += `📍 العنوان: ${customerAddress}\n`;
        message += `\n————————————\n`;

        orderItems.forEach((item, i) => {
            message += `${i + 1}. ${item.name}\n`;
            message += `   رمز: ${item.sku} | الكمية: ${item.qty} | السعر: ${item.price}$ | الإجمالي: ${item.subtotal}$\n`;
        });

        message += `————————————\n`;
        message += `💰 *الإجمالي الكلي: ${total}$*\n`;
        if (customerNotes) message += `\n📝 ملاحظات: ${customerNotes}\n`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_STORE_NUMBER}?text=${encodedMessage}`;

        // --- تفريغ السلة وتحديث الواجهة ---
        saveCart([]);
        renderCartDrawer();
        showCartStep1();

        // --- التوجيه لواتساب ---
        window.location.href = whatsappUrl;

        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'إتمام الشراء';
    });
}

// --- شريط البحث الحي ---
const searchToggle = document.getElementById('search-toggle');
const searchBar = document.getElementById('search-bar');
const searchClose = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');

function filterBySearch(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.collection-grid .elegant-card').forEach(card => {
        const nameEl = card.querySelector('.card-details h3');
        const text = nameEl ? nameEl.textContent.toLowerCase() : '';
        card.style.display = (q === '' || text.includes(q)) ? '' : 'none';
    });
}

if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
        searchBar.classList.add('open');
        setTimeout(() => { if (searchInput) searchInput.focus(); }, 300);
    });
}
if (searchClose && searchBar) {
    searchClose.addEventListener('click', () => {
        searchBar.classList.remove('open');
        if (searchInput) searchInput.value = '';
        filterBySearch('');
    });
}
if (searchInput) {
    searchInput.addEventListener('input', () => filterBySearch(searchInput.value.trim()));
}

// ربط كل تفاعلات الكروت الموجودة أصلاً بالصفحة (مفضلة + سلة + تفاصيل)
bindCardInteractions(document);

// تحديث العدادات وتلوين المفضلة أول ما تفتح أي صفحة
updateCartBadge();
updateWishlistBadge();
syncFavoriteIcons();

// شريط الفرز (Sort by) — بيشتغل تلقائياً بأي صفحة فيها #sort-select + .collection-grid
const sortSelect = document.getElementById('sort-select');
const sortGrid = document.querySelector('.collection-grid');

if (sortSelect && sortGrid) {
    sortSelect.addEventListener('change', function () {
        const cards = Array.from(sortGrid.querySelectorAll('.elegant-card'));
        const sortType = this.value;

        cards.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price);
            const priceB = parseFloat(b.dataset.price);
            if (sortType === 'price-low') return priceA - priceB;
            if (sortType === 'price-high') return priceB - priceA;
            if (sortType === 'newest') return parseInt(b.dataset.newest || 0) - parseInt(a.dataset.newest || 0);
            return parseInt(a.dataset.order || 0) - parseInt(b.dataset.order || 0);
        });

        cards.forEach(card => sortGrid.appendChild(card));
    });
}

// =========================================
// كاروسيل عرض المنتجات (مستخدم بصفحات الأصناف الفردية)
// =========================================
const carouselTrack = document.getElementById('carousel-track');

if (carouselTrack) {
    const items = Array.from(carouselTrack.querySelectorAll('.carousel-item'));
    const captionEl = document.getElementById('showcase-caption');
    const counterEl = document.getElementById('showcase-counter');
    const prevArrow = document.getElementById('showcase-prev');
    const nextArrow = document.getElementById('showcase-next');
    const slotWidth = window.innerWidth <= 700 ? 100 : 170;

    let activeIndex = Math.floor(items.length / 2);

    function renderCarousel() {
        items.forEach((item, i) => {
            const offset = i - activeIndex;
            const isActive = offset === 0;

            item.classList.toggle('active', isActive);

            const rotateY = offset * -30;
            const translateZ = isActive ? 40 : -Math.abs(offset) * 90;
            const scale = isActive ? 1 : Math.max(1 - Math.abs(offset) * 0.1, 0.55);
            const opacity = Math.max(1 - Math.abs(offset) * 0.22, 0.25);

            item.style.transform = `rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = 100 - Math.abs(offset);
        });

        carouselTrack.style.transform = `translateX(${activeIndex * slotWidth}px)`;

        const activeItem = items[activeIndex];
        if (captionEl && activeItem) {
            const name = activeItem.dataset.name || '';
            const price = activeItem.dataset.price || '';
            captionEl.innerHTML = `${name} <span class="caption-price">${price}</span>`;
        }

        if (counterEl) {
            counterEl.textContent = `${activeIndex + 1}/${items.length}`;
        }
    }

    function goNext() {
        activeIndex = (activeIndex + 1) % items.length;
        renderCarousel();
    }

    function goPrev() {
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        renderCarousel();
    }

    if (nextArrow) nextArrow.addEventListener('click', goNext);
    if (prevArrow) prevArrow.addEventListener('click', goPrev);

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            activeIndex = i;
            renderCarousel();
        });
    });

    renderCarousel();
}

// =========================================
// فلترة المنتجات الحقيقية (شرائح الفلترة السريعة)
// ملاحظة: منجيب الكروت "لحظة الضغط" مش مرة وحدة بس،
// عشان تشتغل صح حتى لو الكروت انجابت من قاعدة البيانات بعد تحميل الصفحة
// =========================================
const filterChips = document.querySelectorAll('.filter-chip');
const resultsCount = document.querySelector('.results-count');

filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // تفعيل الزر المضغوط بصرياً
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const selected = chip.dataset.filter;
        const filterableCards = document.querySelectorAll('.collection-grid .elegant-card');
        let visibleCount = 0;

        filterableCards.forEach(card => {
            const matches = selected === 'all' || card.dataset.category === selected;
            card.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        // تحديث عدد النتائج تلقائياً
        if (resultsCount) {
            resultsCount.textContent = visibleCount + ' منتجات';
        }
    });
});
 
// =========================================
// إعدادات المقاسات لكل صنف — كل صنف إله نوع مقاسات مختلف
// dresses/tops/sportswear = مقاسات ملابس عادية (S,M,L,XL)
// jeans = مقاسات خصر بالأرقام
// heels/shoes = نمرة حذاء
// bags = حجم (صغير/متوسط/كبير)
// accessories = بدون مقاس خالص
// =========================================
const SIZE_CONFIGS = {
    dresses: {
        sizes: ['S', 'M', 'L', 'XL'],
        chartHeaders: ['المقاس', 'الصدر (سم)', 'الطول (سم)'],
        chartRows: [
            ['S', '84-88', '140'],
            ['M', '89-93', '142'],
            ['L', '94-98', '144'],
            ['XL', '99-104', '146']
        ]
    },
    tops: {
        sizes: ['S', 'M', 'L', 'XL'],
        chartHeaders: ['المقاس', 'الصدر (سم)', 'الطول (سم)'],
        chartRows: [
            ['S', '84-88', '58'],
            ['M', '89-93', '60'],
            ['L', '94-98', '62'],
            ['XL', '99-104', '64']
        ]
    },
    sportswear: {
        sizes: ['S', 'M', 'L', 'XL'],
        chartHeaders: ['المقاس', 'الصدر (سم)', 'الطول (سم)'],
        chartRows: [
            ['S', '84-88', '140'],
            ['M', '89-93', '142'],
            ['L', '94-98', '144'],
            ['XL', '99-104', '146']
        ]
    },
    jeans: {
        sizes: ['26', '28', '30', '32', '34', '36'],
        chartHeaders: ['المقاس', 'الخصر (سم)', 'الورك (سم)'],
        chartRows: [
            ['26', '66-68', '88-90'],
            ['28', '70-72', '92-94'],
            ['30', '74-76', '96-98'],
            ['32', '78-80', '100-102'],
            ['34', '82-85', '104-106'],
            ['36', '86-89', '108-110']
        ]
    },
    heels: {
        sizes: ['36', '37', '38', '39', '40', '41'],
        chartHeaders: ['المقاس', 'طول القدم (سم)'],
        chartRows: [
            ['36', '23'],
            ['37', '23.5'],
            ['38', '24.5'],
            ['39', '25'],
            ['40', '25.5'],
            ['41', '26']
        ]
    },
    shoes: {
        sizes: ['36', '37', '38', '39', '40', '41'],
        chartHeaders: ['المقاس', 'طول القدم (سم)'],
        chartRows: [
            ['36', '23'],
            ['37', '23.5'],
            ['38', '24.5'],
            ['39', '25'],
            ['40', '25.5'],
            ['41', '26']
        ]
    },
    bags: {
        sizes: ['صغير', 'متوسط', 'كبير'],
        chartHeaders: ['الحجم', 'الاستخدام المناسب'],
        chartRows: [
            ['صغير', 'مناسبة للمناسبات والخروجات الخفيفة'],
            ['متوسط', 'الاستخدام اليومي'],
            ['كبير', 'الشغل / الجامعة / السفر القصير']
        ]
    },
    accessories: {
        sizes: ['مقاس واحد'],
        hideSizeSection: true
    }
};
 
// =========================================
// منطق صفحة تفاصيل المنتج (product.html)
// بيشتغل بس إذا لاقى #product-detail-root بالصفحة
// =========================================
function generateSku(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) % 90000;
    }
    return 'CPH-' + (10000 + Math.abs(hash));
}
 
function renderRelatedProducts() {
    const grid = document.getElementById('pd-related-grid');
    const section = document.getElementById('pd-related-section');
    if (!grid) return;
 
    let related = [];
    try {
        related = JSON.parse(sessionStorage.getItem('ciphera_related_products') || '[]');
    } catch (e) { related = []; }
 
    if (!related.length) {
        if (section) section.style.display = 'none';
        return;
    }
 
    grid.innerHTML = related.map(p => `
        <div class="elegant-card" data-price="${p.price}">
            <div class="card-image-box">
                <span class="favorite-icon">♡</span>
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="card-details">
                <h3>${p.name}</h3>
                <p class="price">${p.price}$</p>
                <div class="stars">★★★★★</div>
                <button class="add-cart-btn" type="button">🛍️ أضيفي للسلة</button>
            </div>
        </div>
    `).join('');
 
    // منربط أزرار الكروت الجديدة بنفس منطق السلة/المفضلة/التفاصيل
    bindCardInteractions(grid);
    syncFavoriteIcons();
 
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(grid.querySelectorAll('.elegant-card'), {
            max: 10, speed: 400, glare: true, "max-glare": 0.2
        });
    }
}
 
function initProductDetailPage() {
    let product = null;
    try {
        product = JSON.parse(sessionStorage.getItem('ciphera_view_product'));
    } catch (e) { product = null; }
 
    const root = document.getElementById('product-detail-root');
    const notFound = document.getElementById('product-not-found');
 
    if (!product) {
        if (root) root.style.display = 'none';
        if (notFound) notFound.style.display = 'block';
        return;
    }
 
    document.title = product.name + ' | سيفيرا';
 
    // --- مسار التصفح ---
    const catLink = document.getElementById('pd-breadcrumb-category');
    if (catLink) {
        catLink.textContent = product.categoryLabel || 'المنتجات';
        catLink.href = product.categoryPage || 'index.html';
    }
    const nameSpan = document.getElementById('pd-breadcrumb-name');
    if (nameSpan) nameSpan.textContent = product.name;
 
    // --- معرض الصور ---
    const images = (product.images && product.images.length) ? product.images : [product.image];
    let activeIndex = 0;
    const mainImg = document.getElementById('pd-main-image');
    const thumbsContainer = document.getElementById('pd-thumbs');
    const prevArrow = document.getElementById('pd-prev-arrow');
    const nextArrow = document.getElementById('pd-next-arrow');
 
    function renderGallery() {
        if (mainImg) mainImg.src = images[activeIndex];
        if (thumbsContainer) {
            thumbsContainer.style.display = images.length > 1 ? 'flex' : 'none';
            thumbsContainer.innerHTML = images.map((src, i) => `
                <div class="thumb-item ${i === activeIndex ? 'active' : ''}" data-index="${i}">
                    <img src="${src}" alt="${product.name}">
                </div>
            `).join('');
            thumbsContainer.querySelectorAll('.thumb-item').forEach(t => {
                t.addEventListener('click', () => {
                    activeIndex = parseInt(t.dataset.index, 10);
                    renderGallery();
                });
            });
        }
    }
    renderGallery();
 
    if (images.length > 1) {
        if (prevArrow) prevArrow.addEventListener('click', () => {
            activeIndex = (activeIndex - 1 + images.length) % images.length;
            renderGallery();
        });
        if (nextArrow) nextArrow.addEventListener('click', () => {
            activeIndex = (activeIndex + 1) % images.length;
            renderGallery();
        });
    } else {
        if (prevArrow) prevArrow.style.display = 'none';
        if (nextArrow) nextArrow.style.display = 'none';
    }
 
    // --- العنوان / SKU / السعر ---
    const titleEl = document.getElementById('pd-title');
    if (titleEl) titleEl.textContent = product.name;
    const skuEl = document.getElementById('pd-sku');
    if (skuEl) skuEl.textContent = 'رمز المنتج: ' + generateSku(product.name);
 
    const oldPrice = Math.round(product.price * 1.3);
    const oldPriceEl = document.getElementById('pd-price-old');
    const newPriceEl = document.getElementById('pd-price-new');
    const badgeEl = document.getElementById('pd-discount-badge');
    if (oldPriceEl) oldPriceEl.textContent = oldPrice + '$';
    if (newPriceEl) newPriceEl.textContent = product.price + '$';
    if (badgeEl) {
        const pct = Math.max(1, Math.round((1 - product.price / oldPrice) * 100));
        badgeEl.textContent = 'خصم ' + pct + '%';
    }
 
    // --- المقاسات (حسب صنف المنتج) ---
    const productCategorySlug = (product.categoryPage || '').replace('.html', '');
    // منتجات "الرئيسية / المميزة" مخزنة تحت صنف "featured"، فبنجرب نستخدم
    // تصنيف الفلتر الفرعي (category_tag) كبديل لمعرفة نوعها الحقيقي (فستان/شنطة/هيلز...)
    let sizeProfile = SIZE_CONFIGS[productCategorySlug];
    if (!sizeProfile) {
        sizeProfile = SIZE_CONFIGS[product.category] || SIZE_CONFIGS.dresses;
    }
    let selectedSize = sizeProfile.sizes[0];
    const sizeBlock = document.getElementById('pd-size-block');
    const sizeContainer = document.getElementById('pd-size-options');
    const sizeLabel = document.getElementById('pd-selected-size-label');
    const chartTable = document.getElementById('pd-size-chart-table');
    const chartToggle = document.getElementById('pd-size-chart-toggle');
    const chartBox = document.getElementById('pd-size-chart-box');
 
    if (sizeProfile.hideSizeSection) {
        // أصناف بدون مقاسات (زي الإكسسوارات) — منخفي القسم كامل
        if (sizeBlock) sizeBlock.style.display = 'none';
    } else {
        if (sizeLabel) sizeLabel.textContent = selectedSize;
 
        if (sizeContainer) {
            sizeContainer.innerHTML = sizeProfile.sizes.map((s, i) =>
                `<button class="size-btn ${i === 0 ? 'selected' : ''}" type="button" data-size="${s}">${s}</button>`
            ).join('');
 
            sizeContainer.querySelectorAll('.size-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    sizeContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedSize = btn.dataset.size;
                    if (sizeLabel) sizeLabel.textContent = selectedSize;
                });
            });
        }
 
        if (chartTable && sizeProfile.chartHeaders) {
            const headerRow = '<tr>' + sizeProfile.chartHeaders.map(h => `<th>${h}</th>`).join('') + '</tr>';
            const bodyRows = sizeProfile.chartRows.map(row =>
                '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
            ).join('');
            chartTable.innerHTML = headerRow + bodyRows;
        }
 
        if (chartToggle && chartBox) {
            chartToggle.addEventListener('click', () => chartBox.classList.toggle('open'));
        }
    }
 
    // --- الكمية ---
    let qty = 1;
    const qtyValueEl = document.getElementById('pd-qty-value');
    const qtyMinus = document.getElementById('pd-qty-minus');
    const qtyPlus = document.getElementById('pd-qty-plus');
    if (qtyMinus) qtyMinus.addEventListener('click', () => {
        if (qty > 1) qty--;
        if (qtyValueEl) qtyValueEl.textContent = qty;
    });
    if (qtyPlus) qtyPlus.addEventListener('click', () => {
        qty++;
        if (qtyValueEl) qtyValueEl.textContent = qty;
    });
 
    // --- أضيفي للسلة ---
    const addBtn = document.getElementById('pd-add-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addToCart({
                id: product.id,
                name: product.name + ' (مقاس ' + selectedSize + ')',
                price: product.price,
                image: images[0]
            }, qty);
            showToast('تمت إضافة ' + qty + ' قطعة للسلة 🛍️');
        });
    }
 
    // --- المفضلة ---
    const wishBtn = document.getElementById('pd-wishlist-btn');
    const galleryFav = document.getElementById('pd-gallery-fav');
 
    function syncPdWishlist() {
        const list = getWishlist();
        const isFav = list.some(item => item.id === product.id);
        if (wishBtn) {
            wishBtn.classList.toggle('active', isFav);
            wishBtn.innerHTML = isFav ? '♥ بالمفضلة عندك' : '♡ أضيفي إلى المفضلة';
        }
        if (galleryFav) galleryFav.classList.toggle('active', isFav);
    }
 
    function toggleFav() {
        const added = toggleWishlist({ id: product.id, name: product.name, price: product.price, image: images[0] });
        showToast(added ? 'تمت الإضافة إلى المفضلة 💛' : 'تمت الإزالة من المفضلة');
        syncPdWishlist();
    }
 
    if (wishBtn) wishBtn.addEventListener('click', toggleFav);
    if (galleryFav) galleryFav.addEventListener('click', toggleFav);
    syncPdWishlist();
 
    // --- الوصف ---
    const descEl = document.getElementById('pd-description');
    if (descEl) {
        descEl.textContent = `قطعة "${product.name}" من تشكيلة ${product.categoryLabel || 'سيفيرا'}، مختارة بعناية من أحدث صيحات الموضة العالمية، بخامة مريحة وتفاصيل أنيقة تناسب إطلالتك اليومية.`;
    }
 
    // --- منتجات مقترحة ---
    renderRelatedProducts();
}
 
const productDetailRoot = document.getElementById('product-detail-root');
if (productDetailRoot) {
    initProductDetailPage();
}
 
// =========================================
// تحميل المنتجات من قاعدة بيانات Supabase
// بيشتغل تلقائياً على أي صفحة فيها .collection-grid[data-supabase-category]
// =========================================
async function loadCollectionGrid() {
    const grid = document.querySelector('.collection-grid[data-supabase-category]');
    if (!grid) return; // هاي الصفحة ما إلها قاعدة بيانات (زي product.html)
 
    if (!supabaseClient) {
        grid.innerHTML = '<p class="products-loading">⚠️ ما تم الاتصال بقاعدة البيانات — تأكدي من إعدادات js/supabase-config.js</p>';
        return;
    }
 
    const categorySlug = grid.dataset.supabaseCategory;
 
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('category_page', categorySlug)
        .eq('in_stock', true)
        .order('sort_order', { ascending: true });
 
    if (error) {
        console.error('خطأ بجلب المنتجات من Supabase:', error);
        grid.innerHTML = '<p class="products-loading">صار في مشكلة بتحميل المنتجات، جربي تحدّثي الصفحة.</p>';
        return;
    }
 
    if (!data || data.length === 0) {
        grid.innerHTML = '<p class="products-loading">ما في منتجات بهاد الصنف هلأ.</p>';
        if (resultsCount) resultsCount.textContent = '0 منتج';
        return;
    }
 
    grid.innerHTML = data.map(p => `
        <div class="elegant-card" data-tilt data-tilt-max="8" data-tilt-speed="400" data-tilt-glare="true" data-tilt-max-glare="0.2"
             data-id="${p.id}" data-price="${p.price}" data-order="${p.sort_order || 0}" data-category="${p.category_tag || ''}"
             ${p.colors_count && p.colors_count > 1 ? `data-colors="${p.colors_count}"` : ''}>
            <div class="card-image-box">
                <span class="favorite-icon">♡</span>
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="card-details">
                <h3>${p.name}</h3>
                <p class="price">${p.price}$</p>
                <div class="stars">★★★★★</div>
                <button class="add-cart-btn" type="button">🛍️ أضيفي للسلة</button>
            </div>
        </div>
    `).join('');
 
    // منربط كل شي عالكروت الجديدة: مفضلة + سلة + عرض تفاصيل + ألوان + تأثير 3D
    bindCardInteractions(grid);
    syncFavoriteIcons();
 
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(grid.querySelectorAll('.elegant-card'), {
            max: 12, speed: 400, glare: true, "max-glare": 0.3
        });
    }
 
    if (resultsCount) resultsCount.textContent = data.length + ' منتج';
}
 
loadCollectionGrid();
 