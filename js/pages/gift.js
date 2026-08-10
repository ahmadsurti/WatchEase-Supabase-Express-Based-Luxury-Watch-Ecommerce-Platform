import { supabase } from '../supabase.js'
import { getProductById } from '../products.js'
import { updateCartBadge } from '../auth-check.js'

// ── Auth guard ─────────────────────────────────────────────────────────────
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
    window.location.href = `../html/auth.html?return=${encodeURIComponent(window.location.href)}`
}

// ── Read URL params ────────────────────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search)
const productId = urlParams.get('id')
const gender    = urlParams.get('gender')
const product   = getProductById(productId)

// Back link — returns to the product page
const backBtn = document.getElementById('gift-back')
backBtn.href  = `../html/product.html?id=${productId}&gender=${gender}`

if (!product) {
    document.querySelector('.gift-root').innerHTML =
        '<p class="text-center py-5 text-muted">Product not found.</p>'
} else {
    // Populate header + preview
    document.getElementById('gift-product-name').textContent  = product.name
    document.getElementById('gift-preview-name').textContent  = product.name
    document.getElementById('gift-preview-price').textContent = product.price

    const imgWrap = document.getElementById('gift-preview-img')
    const img     = document.createElement('img')
    img.src = `../assets/images/${product.name}.webp`
    img.alt = product.name
    img.onerror = () => {
        imgWrap.innerHTML = `<svg width="28" height="28" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#e8e4df"/><rect x="49" y="25" width="2" height="25" fill="#888"/><rect x="49" y="49" width="15" height="2" fill="#888"/></svg>`
    }
    imgWrap.appendChild(img)
}

// ── Form submit ────────────────────────────────────────────────────────────
document.getElementById('gift-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const btn      = document.getElementById('gift-submit-btn')
    const feedback = document.getElementById('gf-feedback')

    const recipientName  = document.getElementById('gift-name').value.trim()
    const recipientEmail = document.getElementById('gift-email').value.trim()
    const line1          = document.getElementById('gift-line1').value.trim()
    const line2          = document.getElementById('gift-line2').value.trim()
    const city           = document.getElementById('gift-city').value.trim()
    const state          = document.getElementById('gift-state').value.trim()
    const pin            = document.getElementById('gift-pin').value.trim()
    const note           = document.getElementById('gift-note').value.trim()
    const sendTeaser     = document.getElementById('gift-teaser').checked

    // Validate required fields
    if (!recipientName || !line1 || !city || !state || !pin) {
        setFeedback(feedback, 'Please fill in all required fields.', 'error')
        return
    }

    if (sendTeaser && !recipientEmail) {
        setFeedback(feedback, 'Please enter the recipient\'s email to send the teaser.', 'error')
        return
    }

    btn.disabled    = true
    btn.textContent = 'Adding…'
    feedback.textContent = ''
    feedback.className   = 'gf-feedback'

    // ── 1. Add product to cart ─────────────────────────────────────────────
    const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()

    let cartError

    if (existing) {
        ;({ error: cartError } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id))
    } else {
        ;({ error: cartError } = await supabase
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

    if (cartError) {
        console.error(cartError)
        setFeedback(feedback, 'Could not add to cart. Please try again.', 'error')
        btn.disabled    = false
        btn.textContent = 'Add Gift to Cart'
        return
    }

    // ── 2. Save gift details to Supabase ───────────────────────────────────
    const { error: giftError } = await supabase
        .from('gift_orders')
        .upsert({
            user_id:         user.id,
            product_id:      productId,
            product_name:    product.name,
            recipient_name:  recipientName,
            recipient_email: recipientEmail || null,
            address_line1:   line1,
            address_line2:   line2 || null,
            city,
            state,
            pin_code:        pin,
            note:            note || null,
            send_teaser:     sendTeaser,
        }, { onConflict: 'user_id,product_id' })

    if (giftError) {
        console.error(giftError)
        // Cart was added — non-fatal, warn but continue
        console.warn('Gift details could not be saved, but item was added to cart.')
    }

    updateCartBadge(user.id)

    // ── 3. Redirect back to product page ──────────────────────────────────
    // Pass a flag so product.js can update the gift button state
    window.location.href = `../html/product.html?id=${productId}&gender=${gender}&gifted=1`
})

// ── Utility ────────────────────────────────────────────────────────────────
function setFeedback(el, msg, type) {
    el.textContent = msg
    el.className   = `gf-feedback gf-feedback--${type}`
}

