import { supabase } from '../supabase.js'
import { updateCartBadge, updateWishlistBadge } from '../auth-check.js'

// Auth guard
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
    window.location.href = '../html/auth.html?return=../html/cart.html'
}

async function loadCart() {
    const { data: cart, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    document.getElementById('loading-state').style.display = 'none'

    if (error) {
        console.error(error)
        return
    }

    if (!cart || cart.length === 0) {
        document.getElementById('empty-cart-state').style.display = 'block'
        return
    }

    document.getElementById('cart-content').style.display = 'block'

    const container = document.getElementById('cart-items-container')
    container.innerHTML = ''
    let subtotal = 0

    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity
        subtotal += itemTotal

        const el = document.createElement('div')
        el.className = 'cart-item'
        el.id = `cart-item-${item.id}`
        el.innerHTML = `
            <div class="item-image">
                <img src="../assets/images/${item.name}.webp" alt="${item.name}"
                     onerror="this.parentElement.innerHTML='<svg width=60 height=60 viewBox=&quot;0 0 100 100&quot;><circle cx=50 cy=50 r=38 fill=&quot;#121212&quot;/><rect x=49 y=25 width=2 height=25 fill=&quot;#fff&quot;/><rect x=49 y=49 width=15 height=2 fill=&quot;#fff&quot;/></svg>'">
            </div>
            <div class="item-details">
                <span class="item-meta">${item.gender === 'women' ? 'Women' : 'Men'} / Luxury</span>
                <h3>${item.name}</h3>
                <div class="quantity-control">
                    <button class="qty-btn" data-id="${item.id}" data-change="-1">−</button>
                    <span class="qty-val" id="qty-${item.id}">${item.quantity}</span>
                    <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
                </div>
            </div>
            <div class="item-price-remove">
                <div class="price" id="price-${item.id}">₹${itemTotal.toLocaleString('en-IN')}</div>
                <span class="remove-link" data-id="${item.id}">Remove</span>
            </div>
        `
        container.appendChild(el)
    })

    updateSummary(subtotal)
    attachListeners(cart)
}

function updateSummary(subtotal) {
    const tax   = Math.round(subtotal * 0.05)
    const total = subtotal + tax
    document.getElementById('subtotal').textContent = '₹' + subtotal.toLocaleString('en-IN')
    document.getElementById('tax').textContent      = '₹' + tax.toLocaleString('en-IN')
    document.getElementById('total').textContent    = '₹' + total.toLocaleString('en-IN')
}

function attachListeners(cart) {
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id     = btn.dataset.id
            const change = parseInt(btn.dataset.change)
            const item   = cart.find(i => i.id === id)
            if (!item) return

            const newQty = item.quantity + change
            if (newQty < 1) return

            btn.disabled = true
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQty })
                .eq('id', id)

            if (!error) {
                item.quantity = newQty
                document.getElementById(`qty-${id}`).textContent = newQty
                document.getElementById(`price-${id}`).textContent =
                    '₹' + (item.price * newQty).toLocaleString('en-IN')
                const newSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
                updateSummary(newSubtotal)
                updateCartBadge(user.id)
            }
            btn.disabled = false
        })
    })

    document.querySelectorAll('.remove-link').forEach(link => {
        link.addEventListener('click', async () => {
            const id = link.dataset.id
            await supabase.from('cart_items').delete().eq('id', id)
            document.getElementById(`cart-item-${id}`)?.remove()
            const remaining = cart.filter(i => i.id !== id)
            cart.length = 0
            remaining.forEach(i => cart.push(i))
            if (cart.length === 0) {
                document.getElementById('cart-content').style.display = 'none'
                document.getElementById('empty-cart-state').style.display = 'block'
                updateCartBadge(user.id)
                return
            }
            const newSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
            updateSummary(newSubtotal)
            updateCartBadge(user.id)
        })
    })
}

// ── Watch dial builder ────────────────────────────────────────────────────
function buildDial() {
    const dial = document.getElementById('checkout-dial')
    dial.innerHTML = ''

    const glasses = [
        { cls: 'dial-glass--obsidian' },
        { cls: 'dial-glass--frosted' },
        { cls: 'dial-glass--depth' },
        { cls: 'dial-glass--skeuomorphic' },
    ]
    glasses.forEach(g => {
        const el = document.createElement('div')
        el.className = `dial-glass ${g.cls}`
        dial.appendChild(el)
    })

    const rim = document.createElement('div')
    rim.className = 'dial-rim'
    dial.appendChild(rim)

    for (let i = 0; i < 12; i++) {
        const marker = document.createElement('div')
        const isMajor = i % 3 === 0
        marker.style.cssText = `
            position: absolute;
            width: ${isMajor ? '2px' : '1.5px'};
            height: ${isMajor ? '8px' : '5px'};
            background: ${isMajor ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)'};
            left: 50%;
            top: ${isMajor ? '7px' : '8px'};
            transform-origin: center ${60 - (isMajor ? 7 : 5)}px;
            transform: translateX(-50%) rotate(${i * 30}deg);
            border-radius: 1px;
            z-index: 2;
            pointer-events: none;
        `
        dial.appendChild(marker)
    }

    const minute = document.createElement('div')
    minute.className = 'dial-hand dial-hand--minute'
    dial.appendChild(minute)

    const second = document.createElement('div')
    second.className = 'dial-hand dial-hand--second'
    dial.appendChild(second)

    const center = document.createElement('div')
    center.className = 'dial-center'
    dial.appendChild(center)

    startGlassCycle(dial)
    startStrapCycle()
}

function startGlassCycle(dial) {
    const layers = dial.querySelectorAll('.dial-glass')
    let current = 0
    layers[current].classList.add('dial-glass--active')

    const interval = setInterval(() => {
        layers[current].classList.remove('dial-glass--active')
        current = (current + 1) % layers.length
        layers[current].classList.add('dial-glass--active')
    }, 2000)

    dial._glassCycleInterval = interval
}

function startStrapCycle() {
    const left  = document.getElementById('strap-left')
    const right = document.getElementById('strap-right')
    if (!left || !right) return

    const leathers = [
        'strap--tan', 'strap--dark-brown', 'strap--cognac',
        'strap--black', 'strap--slate', 'strap--burgundy',
    ]
    const ROLL_OUT = 600
    const HOLD     = 800
    const ROLL_IN  = 600
    const GAP      = 300

    let colourIdx = 0

    function applyColour() {
        leathers.forEach(c => { left.classList.remove(c); right.classList.remove(c) })
        left.classList.add(leathers[colourIdx])
        right.classList.add(leathers[colourIdx])
        colourIdx = (colourIdx + 1) % leathers.length
    }

    function runCycle() {
        applyColour()
        left.style.animation  = `strap-roll-out-left  ${ROLL_OUT}ms cubic-bezier(0.4,0,0.2,1) forwards`
        right.style.animation = `strap-roll-out-right ${ROLL_OUT}ms cubic-bezier(0.4,0,0.2,1) forwards`
        left.style.opacity  = '1'
        right.style.opacity = '1'

        setTimeout(() => {
            left.style.animation  = `strap-roll-in-left  ${ROLL_IN}ms cubic-bezier(0.4,0,0.2,1) forwards`
            right.style.animation = `strap-roll-in-right ${ROLL_IN}ms cubic-bezier(0.4,0,0.2,1) forwards`
        }, ROLL_OUT + HOLD)
    }

    runCycle()
    const id = setInterval(runCycle, ROLL_OUT + HOLD + ROLL_IN + GAP)

    const dial = document.getElementById('checkout-dial')
    if (dial) dial._strapInterval = id
}

function morphToWatch() {
    const btn = document.getElementById('checkout-btn')
    buildDial()
    btn.classList.add('btn-checkout--morphing')
    btn.disabled = true
}

window.checkout = async function () {
    const btn = document.getElementById('checkout-btn')
    if (btn.disabled) return

    // ── Address gate ──────────────────────────────────────────────────────
    // Check if the user has a saved address before allowing checkout
    const { data: addr } = await supabase
        .from('addresses')
        .select('address_line1')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!addr?.address_line1) {
        // Store current page so profile's back arrow returns here
        sessionStorage.setItem('profile_return', window.location.href)
        window.location.href = '../html/profile.html?tab=address'
        return
    }

    morphToWatch()

    const MIN_ANIMATION_MS = 2500

    const [result] = await Promise.all([
        doCheckout(),
        new Promise(r => setTimeout(r, MIN_ANIMATION_MS))
    ])

    if (result?.redirect) {
        window.location.href = result.redirect
    }
}

async function doCheckout() {
    try {
        const { data: cart } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)

        if (!cart || cart.length === 0) return { redirect: '../html/thankyou.html' }

        const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0)

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({ user_id: user.id, total_amount: totalAmount, status: 'completed' })
            .select()
            .maybeSingle()

        if (orderError) {
            console.error(orderError)
            const btn = document.getElementById('checkout-btn')
            const dial = document.getElementById('checkout-dial')
            if (dial._glassCycleInterval) clearInterval(dial._glassCycleInterval)
            if (dial._strapInterval) clearInterval(dial._strapInterval)
            btn.classList.remove('btn-checkout--morphing')
            btn.disabled = false
            return null
        }

        const orderItems = cart.map(item => ({
            order_id:   order.id,
            product_id: item.product_id,
            name:       item.name,
            price:      item.price,
            quantity:   item.quantity,
            gender:     item.gender
        }))
        await supabase.from('order_items').insert(orderItems)

        await supabase.from('cart_items').delete().eq('user_id', user.id)
        updateCartBadge(user.id)

        // Remove purchased products from wishlist
        const purchasedProductIds = cart.map(i => i.product_id)
        if (purchasedProductIds.length > 0) {
            await supabase
                .from('wishlist')
                .delete()
                .eq('user_id', user.id)
                .in('product_id', purchasedProductIds)
            updateWishlistBadge(user.id)
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .maybeSingle()

        try {
            // Fetch order items once — used for order email and gift teasers
            const { data: emailItems } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id)

            // Buyer confirmation email
            await fetch(`${window.location.origin}/api/send-order-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order,
                    items: emailItems || [],
                    userEmail: user.email,
                    userName: profile?.name || 'Valued Customer'
                })
            }).catch(err => console.warn('Order email failed (non-critical):', err))

            // Gift teaser emails — one per gifted product that has send_teaser=true
            const productIds = (emailItems || []).map(i => i.product_id)
            if (productIds.length > 0) {
                const { data: giftOrders } = await supabase
                    .from('gift_orders')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('product_id', productIds)
                    .eq('send_teaser', true)

                if (giftOrders && giftOrders.length > 0) {
                    for (const gift of giftOrders) {
                        if (gift.recipient_email) {
                            await fetch(`${window.location.origin}/api/send-gift-teaser`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    recipientName:  gift.recipient_name,
                                    recipientEmail: gift.recipient_email,
                                    senderName:     profile?.name || 'Someone special',
                                })
                            }).catch(err => console.warn('Teaser email failed (non-critical):', err))
                        }
                    }

                    // Clean up gift_orders rows now that the order is placed
                    await supabase
                        .from('gift_orders')
                        .delete()
                        .eq('user_id', user.id)
                        .in('product_id', productIds)
                }
            }

        } catch (emailErr) {
            console.warn('Email send failed (non-critical):', emailErr)
        }

        return { redirect: '../html/thankyou.html' }

    } catch (err) {
        console.error('Checkout error:', err)
        const btn = document.getElementById('checkout-btn')
        btn.classList.remove('btn-checkout--morphing')
        btn.disabled = false
        return null
    }
}

loadCart()

