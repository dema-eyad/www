// =========================================
// منطق لوحة تحكم المنتجات (admin.html)
// =========================================

const CATEGORY_LABELS = {
    featured: 'الرئيسية (مميزة)',
    bags: 'حقائب',
    dresses: 'فساتين',
    heels: 'هيلز',
    shoes: 'أحذية',
    jeans: 'جينز',
    sportswear: 'أطقم رياضية',
    tops: 'ملابس علوية',
    accessories: 'اكسسوارات'
};

const loginWrap = document.getElementById('admin-login-wrap');
const panel = document.getElementById('admin-panel');
const loginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('admin-logout-btn');
const loginError = document.getElementById('admin-login-error');

function showAdminToast(msg) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// --- التحقق من حالة تسجيل الدخول أول ما تفتح الصفحة ---
async function checkAuthState() {
    if (!supabaseClient) {
        if (loginError) loginError.textContent = '⚠️ ما تم الاتصال بقاعدة البيانات — راجعي إعدادات js/supabase-config.js';
        return;
    }
    const { data } = await supabaseClient.auth.getSession();
    if (data && data.session) {
        showPanel();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginWrap.style.display = 'block';
    panel.style.display = 'none';
}

function showPanel() {
    loginWrap.style.display = 'none';
    panel.style.display = 'block';
    loadProductsTable();
    loadOrdersTable();
}

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        if (!email || !password) {
            loginError.textContent = 'عبّي الإيميل وكلمة المرور';
            return;
        }
        loginError.textContent = '';
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            loginError.textContent = 'بيانات الدخول غلط، جربي مرة ثانية';
            return;
        }
        showPanel();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        showLogin();
    });
}

// =========================================
// نموذج إضافة / تعديل منتج
// =========================================
const form = document.getElementById('admin-product-form');
const formTitle = document.getElementById('admin-form-title');
const submitBtn = document.getElementById('admin-submit-btn');
const cancelEditBtn = document.getElementById('admin-cancel-edit-btn');

function resetForm() {
    form.reset();
    document.getElementById('p-id').value = '';
    document.getElementById('p-colors').value = 1;
    document.getElementById('p-sort').value = 0;
    document.getElementById('p-instock').checked = true;
    formTitle.textContent = 'إضافة منتج جديد';
    submitBtn.textContent = 'إضافة المنتج';
    cancelEditBtn.style.display = 'none';
}

function fillFormForEdit(product) {
    document.getElementById('p-id').value = product.id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-sort').value = product.sort_order || 0;
    document.getElementById('p-image').value = product.image;
    document.getElementById('p-category-page').value = product.category_page;
    document.getElementById('p-category-tag').value = product.category_tag || '';
    document.getElementById('p-colors').value = product.colors_count || 1;
    document.getElementById('p-instock').checked = !!product.in_stock;

    formTitle.textContent = 'تعديل منتج: ' + product.name;
    submitBtn.textContent = 'حفظ التعديلات';
    cancelEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetForm);
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('p-id').value;
        const payload = {
            name: document.getElementById('p-name').value.trim(),
            price: parseFloat(document.getElementById('p-price').value) || 0,
            sort_order: parseInt(document.getElementById('p-sort').value, 10) || 0,
            image: document.getElementById('p-image').value.trim(),
            category_page: document.getElementById('p-category-page').value,
            category_tag: document.getElementById('p-category-tag').value.trim(),
            colors_count: parseInt(document.getElementById('p-colors').value, 10) || 1,
            in_stock: document.getElementById('p-instock').checked
        };

        let error;
        if (id) {
            ({ error } = await supabaseClient.from('products').update(payload).eq('id', id));
        } else {
            ({ error } = await supabaseClient.from('products').insert([payload]));
        }

        if (error) {
            showAdminToast('صار في مشكلة: ' + error.message);
            return;
        }

        showAdminToast(id ? 'تم حفظ التعديلات ✅' : 'تمت إضافة المنتج ✅');
        resetForm();
        loadProductsTable();
    });
}

// =========================================
// جدول المنتجات + الحذف + التعديل
// =========================================
const filterSelect = document.getElementById('admin-filter-category');
const tbody = document.getElementById('admin-products-tbody');
const emptyMsg = document.getElementById('admin-empty-msg');
const countLabel = document.getElementById('admin-count-label');

if (filterSelect) {
    filterSelect.addEventListener('change', loadProductsTable);
}

async function loadProductsTable() {
    if (!supabaseClient) return;

    let query = supabaseClient.from('products').select('*').order('category_page', { ascending: true }).order('sort_order', { ascending: true });
    const selectedCategory = filterSelect ? filterSelect.value : 'all';
    if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_page', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        emptyMsg.textContent = 'صار في مشكلة بجلب المنتجات: ' + error.message;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        emptyMsg.textContent = 'ما في منتجات هون.';
        countLabel.textContent = '0 منتج';
        return;
    }

    emptyMsg.style.display = 'none';
    countLabel.textContent = data.length + ' منتج';

    tbody.innerHTML = data.map(p => `
        <tr>
            <td><img class="admin-thumb" src="${p.image}" alt=""></td>
            <td>${escapeHtml(p.name)}</td>
            <td>${p.price}$</td>
            <td>${CATEGORY_LABELS[p.category_page] || p.category_page}</td>
            <td>${escapeHtml(p.category_tag || '—')}</td>
            <td>${p.colors_count || 1}</td>
            <td><span class="admin-badge ${p.in_stock ? 'in' : 'out'}">${p.in_stock ? 'متوفر' : 'غير متوفر'}</span></td>
            <td>
                <div class="admin-row-actions">
                    <button class="admin-icon-btn" title="تعديل" data-action="edit" data-id="${p.id}">✎</button>
                    <button class="admin-icon-btn danger" title="حذف" data-action="delete" data-id="${p.id}">🗑</button>
                </div>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const product = data.find(p => p.id === btn.dataset.id);
            if (product) fillFormForEdit(product);
        });
    });

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const product = data.find(p => p.id === btn.dataset.id);
            const confirmed = confirm('متأكدة بدك تحذفي "' + (product ? product.name : 'هاد المنتج') + '"؟ ما في رجعة.');
            if (!confirmed) return;

            const { error: delError } = await supabaseClient.from('products').delete().eq('id', btn.dataset.id);
            if (delError) {
                showAdminToast('ما قدرنا نحذف: ' + delError.message);
                return;
            }
            showAdminToast('تم الحذف 🗑');
            loadProductsTable();
        });
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// =========================================
// إدارة الطلبات الواردة
// =========================================
const ORDER_STATUS_LABELS = {
    pending: 'قيد الانتظار',
    confirmed: 'تم التأكيد',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي'
};

const ordersFilter = document.getElementById('admin-orders-filter');
const ordersTbody = document.getElementById('admin-orders-tbody');
const ordersEmpty = document.getElementById('admin-orders-empty');
const ordersCount = document.getElementById('admin-orders-count');
const ordersRefreshBtn = document.getElementById('admin-orders-refresh');

if (ordersFilter) ordersFilter.addEventListener('change', loadOrdersTable);
if (ordersRefreshBtn) ordersRefreshBtn.addEventListener('click', loadOrdersTable);

async function loadOrdersTable() {
    if (!supabaseClient || !ordersTbody) return;

    let query = supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
    const selectedStatus = ordersFilter ? ordersFilter.value : 'all';
    if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
    }

    const { data, error } = await query;

    if (error) {
        ordersTbody.innerHTML = '';
        ordersEmpty.style.display = 'block';
        ordersEmpty.textContent = 'صار في مشكلة بجلب الطلبات: ' + error.message;
        return;
    }

    if (!data || data.length === 0) {
        ordersTbody.innerHTML = '';
        ordersEmpty.style.display = 'block';
        ordersEmpty.textContent = 'ما في طلبات هون.';
        ordersCount.textContent = '0 طلب';
        return;
    }

    ordersEmpty.style.display = 'none';
    ordersCount.textContent = data.length + ' طلب';

    ordersTbody.innerHTML = data.map(order => {
        const dateStr = new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
        const itemsSummary = (order.items || []).map(it => `${it.name} ×${it.qty}`).join('، ');
        return `
        <tr>
            <td>${dateStr}</td>
            <td>${escapeHtml(order.customer_name)}</td>
            <td>${escapeHtml(order.customer_phone)}</td>
            <td>${escapeHtml(order.customer_address || '—')}</td>
            <td style="max-width:220px; white-space:normal;">${escapeHtml(itemsSummary)}</td>
            <td>${order.total}$</td>
            <td>
                <select class="admin-order-status" data-id="${order.id}" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:4px 6px; font-family:'Cairo',sans-serif; font-size:11.5px;">
                    ${Object.entries(ORDER_STATUS_LABELS).map(([val, label]) =>
                        `<option value="${val}" ${order.status === val ? 'selected' : ''}>${label}</option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <button class="admin-icon-btn danger" title="حذف الطلب" data-action="delete-order" data-id="${order.id}">🗑</button>
            </td>
        </tr>`;
    }).join('');

    ordersTbody.querySelectorAll('.admin-order-status').forEach(select => {
        select.addEventListener('change', async () => {
            const { error: updError } = await supabaseClient
                .from('orders')
                .update({ status: select.value })
                .eq('id', select.dataset.id);
            if (updError) {
                showAdminToast('ما قدرنا نحدّث الحالة: ' + updError.message);
                return;
            }
            showAdminToast('تم تحديث حالة الطلب ✅');
        });
    });

    ordersTbody.querySelectorAll('[data-action="delete-order"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const confirmed = confirm('متأكدة بدك تحذفي هاد الطلب نهائياً؟');
            if (!confirmed) return;
            const { error: delError } = await supabaseClient.from('orders').delete().eq('id', btn.dataset.id);
            if (delError) {
                showAdminToast('ما قدرنا نحذف: ' + delError.message);
                return;
            }
            showAdminToast('تم حذف الطلب 🗑');
            loadOrdersTable();
        });
    });
}

checkAuthState();
