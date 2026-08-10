import { supabase } from '../supabase.js'

function deliveryDate() {
    const d = new Date()
    d.setDate(d.getDate() + 4)
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible')
                observer.unobserve(e.target)
            }
        })
    }, { threshold: 0.12 })

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return observer
}

const MEN_WATCHES = [
    { id: 2, name: 'Gold Skeleton',    price: '₹1,99,500', tag: 'Luxury'  },
    { id: 4, name: 'Midnight Stealth', price: '₹78,250',   tag: 'Classic' },
    { id: 6, name: 'Rosewood Eternal', price: '₹55,300',   tag: 'Wedding' },
]

const WOMEN_WATCHES = [
    { id: 11, name: 'Aura Champagne',   price: '₹1,44,800', tag: 'Luxury'  },
    { id: 8,  name: 'Starlight Noir',   price: '₹45,600',   tag: 'Wedding' },
    { id: 10, name: 'Ivory Minimalist', price: '₹90,500',   tag: 'Classic' },
]

function buildCards(watches, gridId, gender, observer) {
    const grid = document.getElementById(gridId)
    if (!grid) return
    watches.forEach((w, i) => {
        const col = document.createElement('div')
        col.className = 'col-md-4 reveal'
        col.style.transitionDelay = (i * 0.1) + 's'
        col.innerHTML = `
            <a href="../html/product.html?id=${w.id}&gender=${gender}" class="ty-product-card">
                <div class="ty-img-container">
                    <img src="../assets/images/${w.name}.webp" alt="${w.name}"
                         onerror="this.parentElement.style.background='#f0ede8'">
                </div>
                <div class="ty-card-meta">
                    <span class="ty-style-tag">${w.tag}</span>
                    <div class="ty-card-meta-row">
                        <h3 class="ty-card-title">${w.name}</h3>
                        <p class="ty-card-price">${w.price}</p>
                    </div>
                </div>
            </a>
        `
        grid.appendChild(col)
        observer.observe(col)
    })
}

function buildOrderItems(items) {
    const list = document.getElementById('ty-items-list')
    if (!list) return

    if (!items || items.length === 0) {
        list.innerHTML = '<p class="ty-items-empty">No items found.</p>'
        return
    }

    list.innerHTML = items.map(item => `
        <div class="ty-order-item">
            <div class="ty-oi-img">
                <img src="../assets/images/${item.name}.webp" alt="${item.name}"
                     onerror="this.style.display='none'">
            </div>
            <div class="ty-oi-info">
                <p class="ty-oi-name">${item.name}</p>
                <p class="ty-oi-qty">Qty: ${item.quantity || 1}</p>
            </div>
            <p class="ty-oi-price">${item.price ? '₹' + Number(item.price).toLocaleString('en-IN') : ''}</p>
        </div>
    `).join('')
}

async function init() {
    document.getElementById('ty-delivery-date').textContent = deliveryDate()

    const observer = initReveal()
    buildCards(MEN_WATCHES,   'men-grid',   'men',   observer)
    buildCards(WOMEN_WATCHES, 'women-grid', 'women', observer)

    const list = document.getElementById('ty-items-list')

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            if (list) list.innerHTML = '<p class="ty-items-empty">Sign in to view your order details.</p>'
            return
        }

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (ordersError || !orders || orders.length === 0) {
            if (list) list.innerHTML = '<p class="ty-items-empty">No recent orders found.</p>'
            return
        }

        const orderId = orders[0].id
        const orderRef = '#' + orderId.slice(0, 8).toUpperCase()
        const orderNumEl = document.getElementById('ty-order-num')
        if (orderNumEl) orderNumEl.textContent = orderRef

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('name, product_id, quantity, price')
            .eq('order_id', orderId)

        if (itemsError) {
            if (list) list.innerHTML = '<p class="ty-items-empty">Could not load items.</p>'
            return
        }

        buildOrderItems(items)
    } catch (e) {
        console.error('Init error:', e)
        if (list) list.innerHTML = '<p class="ty-items-empty">Something went wrong.</p>'
    }
}

init()
