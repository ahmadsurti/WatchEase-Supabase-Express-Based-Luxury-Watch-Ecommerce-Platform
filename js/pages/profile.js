import { supabase } from '../supabase.js'
import { updateCartBadge, updateWishlistBadge } from '../auth-check.js'

// ── Auth guard ─────────────────────────────────────────────────────────────
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
    window.location.href = '../html/auth.html?return=../html/profile.html'
}

// ── Back arrow ─────────────────────────────────────────────────────────────
// cart.js stores its URL in sessionStorage before redirecting here
const backBtn  = document.getElementById('profile-back')
const returnTo = sessionStorage.getItem('profile_return') || null

backBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (returnTo) {
        sessionStorage.removeItem('profile_return')
        window.location.href = returnTo
    } else if (history.length > 1) {
        history.back()
    } else {
        window.location.href = '../index.html'
    }
})

// ── Populate header ────────────────────────────────────────────────────────
const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

const displayName =
    profile?.name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    'there'

document.getElementById('profile-greeting').textContent = `Hello, ${displayName}`
document.getElementById('profile-email').textContent    = user.email

// Pre-fill the address name field with the account name — it's readonly
const addrNameInput = document.getElementById('addr-name')
if (addrNameInput) addrNameInput.value = displayName

// ── Tab switching ──────────────────────────────────────────────────────────
const tabs   = document.querySelectorAll('.profile-tab')
const panels = { orders: null, wishlist: null, address: null, security: null }

function openTab(target) {
    tabs.forEach(t => {
        t.classList.remove('profile-tab--active')
        t.setAttribute('aria-selected', 'false')
    })
    const activeTab = document.querySelector(`.profile-tab[data-tab="${target}"]`)
    if (activeTab) {
        activeTab.classList.add('profile-tab--active')
        activeTab.setAttribute('aria-selected', 'true')
    }

    document.getElementById('tab-orders').style.display   = target === 'orders'   ? 'block' : 'none'
    document.getElementById('tab-wishlist').style.display = target === 'wishlist' ? 'block' : 'none'
    document.getElementById('tab-address').style.display  = target === 'address'  ? 'block' : 'none'
    document.getElementById('tab-security').style.display = target === 'security' ? 'block' : 'none'

    if (target === 'orders'   && !panels.orders)   { panels.orders   = true; loadOrders() }
    if (target === 'wishlist' && !panels.wishlist)  { panels.wishlist = true; loadWishlist() }
    if (target === 'address'  && !panels.address)  { panels.address  = true; loadAddress() }
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => openTab(tab.dataset.tab))
})

// Auto-open correct tab if redirected
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('tab') === 'address') {
    openTab('address')
} else if (urlParams.get('tab') === 'wishlist') {
    openTab('wishlist')
} else {
    panels.orders = true
    loadOrders()
}

// ── ORDERS ─────────────────────────────────────────────────────────────────
async function loadOrders() {
    const loadingEl = document.getElementById('orders-loading')
    const emptyEl   = document.getElementById('orders-empty')
    const listEl    = document.getElementById('orders-list')

    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    loadingEl.style.display = 'none'

    if (error || !orders || orders.length === 0) {
        emptyEl.style.display = 'flex'
        return
    }

    // Fetch order items (RLS automatically restricts to user's orders)
    const { data: allItems } = await supabase
        .from('order_items')
        .select('order_id, name, price, quantity, gender')

    const itemsByOrder = {}
    ;(allItems || []).forEach(item => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
        itemsByOrder[item.order_id].push(item)
    })

    listEl.innerHTML = ''

    orders.forEach(order => {
        const items   = itemsByOrder[order.id] || []
        const date    = new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        })
        const shortId = order.id.slice(0, 8).toUpperCase()
        const total   = '₹' + Number(order.total_amount).toLocaleString('en-IN')

        const itemsHTML = items.map(item => `
            <div class="order-item-row">
                <div class="order-item-img">
                    <img src="../assets/images/${item.name}.webp" alt="${item.name}"
                         onerror="this.parentElement.innerHTML='<svg width=28 height=28 viewBox=&quot;0 0 100 100&quot;><circle cx=50 cy=50 r=38 fill=&quot;#e8e4df&quot;/><rect x=49 y=25 width=2 height=25 fill=&quot;#888&quot;/><rect x=49 y=49 width=15 height=2 fill=&quot;#888&quot;/></svg>'">
                </div>
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-meta">${item.gender === 'women' ? 'Women' : 'Men'} · Qty ${item.quantity}</div>
                </div>
                <div class="order-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
            </div>
        `).join('')

        const card = document.createElement('div')
        card.className = 'order-card'
        card.innerHTML = `
            <div class="order-card-head">
                <div class="order-meta">
                    <span class="order-id">Order #${shortId}</span>
                    <span class="order-date">${date}</span>
                </div>
                <span class="order-total">${total}</span>
            </div>
            <div class="order-items-list">${itemsHTML}</div>
        `
        listEl.appendChild(card)
    })
}

// ── WISHLIST ───────────────────────────────────────────────────────────────
async function loadWishlist() {
    const loadingEl = document.getElementById('wishlist-loading')
    const emptyEl   = document.getElementById('wishlist-empty')
    const listEl    = document.getElementById('wishlist-list')

    const { data: items, error } = await supabase
        .from('wishlist')
        .select('id, product_id, gender, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    loadingEl.style.display = 'none'

    if (error || !items || items.length === 0) {
        emptyEl.style.display = 'flex'
        return
    }

    // Import product data
    const { products } = await import('../products.js')

    listEl.innerHTML = ''

    items.forEach(item => {
        const product = products[item.product_id]
        if (!product) return

        const card = document.createElement('div')
        card.className = 'wishlist-card'
        card.id = `wl-${item.id}`
        card.innerHTML = `
            <a class="wl-img" href="product.html?id=${item.product_id}&gender=${item.gender}" aria-label="View ${product.name}">
                <img src="../assets/images/${product.name}.webp" alt="${product.name}"
                     onerror="this.parentElement.innerHTML='<svg width=40 height=40 viewBox=&quot;0 0 100 100&quot;><circle cx=50 cy=50 r=38 fill=&quot;#f0ece9&quot;/><rect x=49 y=25 width=2 height=25 fill=&quot;#bbb&quot;/><rect x=49 y=49 width=15 height=2 fill=&quot;#bbb&quot;/></svg>'">
            </a>
            <div class="wl-info">
                <span class="wl-meta">${item.gender === 'women' ? 'Women' : 'Men'} · ${product.category}</span>
                <a class="wl-name" href="product.html?id=${item.product_id}&gender=${item.gender}">${product.name}</a>
                <div class="wl-price">${product.price}</div>
            </div>
            <div class="wl-actions">
                <button class="wl-btn-cart" data-wl-id="${item.id}" data-product-id="${item.product_id}" data-gender="${item.gender}">Add to Collection</button>
                <button class="wl-btn-remove" data-wl-id="${item.id}" aria-label="Remove from wishlist">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
        `
        listEl.appendChild(card)
    })

    attachWishlistListeners(items, products)
}

function attachWishlistListeners(items, products) {
    // Add to cart
    document.querySelectorAll('.wl-btn-cart').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.dataset.productId
            const gender    = btn.dataset.gender
            const product   = products[productId]
            if (!product) return

            btn.disabled    = true
            btn.textContent = 'Adding…'

            const { data: existing } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle()

            let error

            if (existing) {
                ;({ error } = await supabase
                    .from('cart_items')
                    .update({ quantity: existing.quantity + 1 })
                    .eq('id', existing.id))
            } else {
                ;({ error } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id:    user.id,
                        product_id: productId,
                        name:       product.name,
                        price:      product.priceNum,
                        quantity:   1,
                        gender:     gender
                    }))
            }

            if (error) {
                console.error(error)
                btn.disabled    = false
                btn.textContent = 'Add to Collection'
                return
            }

            btn.textContent = 'In Collection ✓'
            updateCartBadge(user.id)
        })
    })

    // Remove from wishlist
    document.querySelectorAll('.wl-btn-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            const wlId = btn.dataset.wlId

            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', wlId)

            if (error) { console.error(error); return }

            document.getElementById(`wl-${wlId}`)?.remove()
            updateWishlistBadge(user.id)

            // If list is now empty, show empty state
            if (document.getElementById('wishlist-list').children.length === 0) {
                document.getElementById('wishlist-empty').style.display = 'flex'
            }
        })
    })
}

// ── ADDRESS ────────────────────────────────────────────────────────────────
async function loadAddress() {
    const loadingEl = document.getElementById('address-loading')
    const formEl    = document.getElementById('address-form')

    const { data: addr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    loadingEl.style.display = 'none'
    formEl.style.display    = 'block'

    if (addr) {
        // full_name is intentionally skipped — it's locked to the account name
        document.getElementById('addr-phone').value = addr.phone         || ''
        document.getElementById('addr-line1').value = addr.address_line1 || ''
        document.getElementById('addr-line2').value = addr.address_line2 || ''
        document.getElementById('addr-city').value  = addr.city          || ''
        document.getElementById('addr-state').value = addr.state         || ''
        document.getElementById('addr-pin').value   = addr.pin_code      || ''
    }
}

document.getElementById('address-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const btn      = document.getElementById('addr-save-btn')
    const feedback = document.getElementById('addr-feedback')

    const payload = {
        user_id:       user.id,
        full_name:     document.getElementById('addr-name').value.trim(),
        phone:         document.getElementById('addr-phone').value.trim(),
        address_line1: document.getElementById('addr-line1').value.trim(),
        address_line2: document.getElementById('addr-line2').value.trim(),
        city:          document.getElementById('addr-city').value.trim(),
        state:         document.getElementById('addr-state').value.trim(),
        pin_code:      document.getElementById('addr-pin').value.trim(),
    }

    if (!payload.full_name || !payload.address_line1 || !payload.city || !payload.state || !payload.pin_code) {
        setFeedback(feedback, 'Please fill in all required fields.', 'error')
        return
    }

    btn.disabled    = true
    btn.textContent = 'Saving…'
    feedback.textContent = ''
    feedback.className   = 'pf-feedback'

    const { error } = await supabase
        .from('addresses')
        .upsert(payload, { onConflict: 'user_id' })

    btn.disabled    = false
    btn.textContent = 'Save Address'

    if (error) {
        setFeedback(feedback, 'Could not save address. Please try again.', 'error')
        console.error(error)
    } else {
        // If the user came from cart, send them straight back — 1 click less
        const returnTo = sessionStorage.getItem('profile_return') || ''
        if (returnTo.includes('cart.html')) {
            sessionStorage.removeItem('profile_return')
            window.location.href = returnTo
            return
        }
        setFeedback(feedback, 'Address saved.', 'success')
        backBtn.classList.add('profile-back--glow')
    }
})

// ── SECURITY ───────────────────────────────────────────────────────────────
document.getElementById('security-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const btn       = document.getElementById('sec-save-btn')
    const feedback  = document.getElementById('sec-feedback')
    const newPw     = document.getElementById('sec-new').value
    const confirmPw = document.getElementById('sec-confirm').value

    if (newPw.length < 8) {
        setFeedback(feedback, 'Password must be at least 8 characters.', 'error')
        return
    }

    if (newPw !== confirmPw) {
        setFeedback(feedback, 'Passwords do not match.', 'error')
        return
    }

    btn.disabled    = true
    btn.textContent = 'Updating…'
    feedback.textContent = ''
    feedback.className   = 'pf-feedback'

    const { error } = await supabase.auth.updateUser({ password: newPw })

    btn.disabled    = false
    btn.textContent = 'Update Password'

    if (error) {
        setFeedback(feedback, error.message || 'Could not update password.', 'error')
    } else {
        setFeedback(feedback, 'Password updated successfully.', 'success')
        document.getElementById('sec-new').value     = ''
        document.getElementById('sec-confirm').value = ''
    }
})

// ── Password visibility toggles ────────────────────────────────────────────
document.querySelectorAll('.pf-eye').forEach(btn => {
    btn.addEventListener('click', () => {
        const input  = document.getElementById(btn.dataset.target)
        const isText = input.type === 'text'
        input.type   = isText ? 'password' : 'text'
        btn.querySelector('.eye-open').style.display   = isText ? 'block' : 'none'
        btn.querySelector('.eye-closed').style.display = isText ? 'none'  : 'block'
    })
})

// ── Utility ────────────────────────────────────────────────────────────────
function setFeedback(el, msg, type) {
    el.textContent = msg
    el.className   = `pf-feedback pf-feedback--${type}`

    if (type === 'success') {
        setTimeout(() => {
            el.textContent = ''
            el.className   = 'pf-feedback'
        }, 4000)
    }
}

