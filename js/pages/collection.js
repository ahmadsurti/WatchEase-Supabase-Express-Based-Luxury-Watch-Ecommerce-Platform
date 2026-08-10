import { supabase } from '../supabase.js'
import { updateWishlistBadge } from '../auth-check.js'

// ── Filter logic ───────────────────────────────────────────────────────────

// Key is per-page so men and women filters don't bleed into each other
const PAGE_KEY    = window.location.pathname.split('/').pop() // 'men.html' or 'women.html'
const STYLE_KEY   = `wf_style_${PAGE_KEY}`
const PRICE_KEY   = `wf_price_${PAGE_KEY}`

function filterStyle(style) {
    sessionStorage.setItem(STYLE_KEY, style)

    const btns = document.querySelectorAll('.filter-btn')
    btns.forEach(btn => btn.classList.remove('active'))

    const activeBtn = Array.from(btns).find(btn => {
        const btnText = btn.innerText.toLowerCase()
        return (style === 'all' && btnText.includes('all')) || btnText.includes(style)
    })
    if (activeBtn) activeBtn.classList.add('active')

    window.currentStyleFilter = style
    applyFilters()
}

function filterByPrice() {
    const priceRange = document.getElementById('price-range').value
    sessionStorage.setItem(PRICE_KEY, priceRange)
    applyFilters()
}

function applyFilters() {
    const priceRange  = document.getElementById('price-range').value
    const styleFilter = window.currentStyleFilter || 'all'
    const items       = document.querySelectorAll('.product-item')

    items.forEach(item => {
        const price = parseInt(item.getAttribute('data-price'))

        const styleMatch = styleFilter === 'all' || item.classList.contains(styleFilter)

        let priceMatch = true
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number)
            priceMatch = price >= min && price <= max
        }

        item.style.display = (styleMatch && priceMatch) ? 'block' : 'none'
    })
}

// ── Custom price dropdown ──────────────────────────────────────────────────
function initPriceDropdown() {
    const trigger  = document.getElementById('price-dropdown-trigger')
    const menu     = document.getElementById('price-dropdown-menu')
    const label    = document.getElementById('price-dropdown-label')
    const select   = document.getElementById('price-range')
    if (!trigger || !menu || !select) return

    // Open / close
    trigger.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = menu.classList.toggle('price-dropdown__menu--open')
        trigger.setAttribute('aria-expanded', isOpen)
    })

    // Close on outside click
    document.addEventListener('click', () => {
        menu.classList.remove('price-dropdown__menu--open')
        trigger.setAttribute('aria-expanded', 'false')
    })

    // Item selection
    menu.addEventListener('click', (e) => {
        const item = e.target.closest('.price-dropdown__item')
        if (!item) return

        const value = item.dataset.value

        // Update hidden select
        select.value = value

        // Update label
        label.textContent = item.textContent.trim()

        // Update active state
        menu.querySelectorAll('.price-dropdown__item').forEach(i => i.classList.remove('price-dropdown__item--active'))
        item.classList.add('price-dropdown__item--active')

        // Close
        menu.classList.remove('price-dropdown__menu--open')
        trigger.setAttribute('aria-expanded', 'false')

        // Trigger filter
        filterByPrice()
    })
}

initPriceDropdown()

// ── Restore saved filter state on load ────────────────────────────────────
function restoreFilters() {
    const urlStyle    = new URLSearchParams(window.location.search).get('style')
    const savedStyle  = urlStyle || sessionStorage.getItem(STYLE_KEY) || 'all'
    const savedPrice  = sessionStorage.getItem(PRICE_KEY) || 'all'

    // Restore hidden select
    const priceSelect = document.getElementById('price-range')
    if (priceSelect) priceSelect.value = savedPrice

    // Sync custom dropdown label + active item
    const menu  = document.getElementById('price-dropdown-menu')
    const label = document.getElementById('price-dropdown-label')
    if (menu && label) {
        const matchingItem = menu.querySelector(`[data-value="${savedPrice}"]`)
        if (matchingItem) {
            label.textContent = matchingItem.textContent.trim()
            menu.querySelectorAll('.price-dropdown__item').forEach(i => i.classList.remove('price-dropdown__item--active'))
            matchingItem.classList.add('price-dropdown__item--active')
        }
    }

    filterStyle(savedStyle)
}

// Expose to HTML onclick attributes
window.filterStyle   = filterStyle
window.filterByPrice = filterByPrice
window.currentStyleFilter = 'all'

// Run on load
restoreFilters()

// ── Wishlist: load initial state ───────────────────────────────────────────
async function initWishlistState() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: items } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)

    if (!items || items.length === 0) return

    const wishlisted = new Set(items.map(i => i.product_id))

    document.querySelectorAll('.btn-card-wishlist').forEach(btn => {
        if (wishlisted.has(btn.dataset.id)) {
            btn.classList.add('wishlisted')
            btn.setAttribute('aria-label', 'Remove from wishlist')
        }
    })
}

// ── Wishlist: toggle handler (called from onclick) ─────────────────────────
window.handleCardWishlist = async function (event, btn) {
    // Stop the click from navigating to the product page
    event.preventDefault()
    event.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Redirect to auth, return to current page
        window.location.href = `../html/auth.html?return=${encodeURIComponent(window.location.href)}`
        return
    }

    const productId    = btn.dataset.id
    const gender       = btn.dataset.gender
    const isWishlisted = btn.classList.contains('wishlisted')

    // Optimistic UI
    btn.classList.toggle('wishlisted', !isWishlisted)
    btn.setAttribute('aria-label', isWishlisted ? 'Add to wishlist' : 'Remove from wishlist')

    if (isWishlisted) {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)

        if (error) {
            btn.classList.add('wishlisted')
            btn.setAttribute('aria-label', 'Remove from wishlist')
            console.error(error)
            return
        }
    } else {
        const { error } = await supabase
            .from('wishlist')
            .upsert({
                user_id:    user.id,
                product_id: productId,
                gender:     gender
            }, { onConflict: 'user_id,product_id' })

        if (error) {
            btn.classList.remove('wishlisted')
            btn.setAttribute('aria-label', 'Add to wishlist')
            console.error(error)
            return
        }
    }

    updateWishlistBadge(user.id)
}

// Run on load
initWishlistState()
