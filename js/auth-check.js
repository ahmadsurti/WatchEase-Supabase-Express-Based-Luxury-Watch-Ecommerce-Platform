import { supabase } from './supabase.js'

// --- Session Helpers ---

export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function isLoggedIn() {
    const user = await getUser()
    return user !== null
}

export async function logout() {
    await supabase.auth.signOut()
    const isRoot = !window.location.pathname.includes('/html/')
    window.location.href = isRoot ? './index.html' : '../index.html'
}

// --- Cart Badge ---

export async function updateCartBadge(userId) {
    const badge = document.getElementById('cart-badge')
    if (!badge) return

    const { data: items } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId)

    const total = items ? items.reduce((sum, i) => sum + i.quantity, 0) : 0

    if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total
        badge.style.display = 'flex'
    } else {
        badge.style.display = 'none'
    }
}

// --- Wishlist Badge ---

export async function updateWishlistBadge(userId) {
    const badge       = document.getElementById('wishlist-badge')
    const drawerBadge = document.getElementById('drawer-wishlist-badge')
    const icon        = document.getElementById('wn-wishlist-icon')
    if (!badge && !drawerBadge) return

    const { data: items } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)

    const count = items ? items.length : 0

    if (badge) {
        if (count > 0) {
            badge.textContent   = count > 99 ? '99+' : count
            badge.style.display = 'flex'
        } else {
            badge.style.display = 'none'
        }
    }

    if (drawerBadge) {
        if (count > 0) {
            drawerBadge.textContent   = count > 99 ? '99+' : count
            drawerBadge.style.display = 'flex'
        } else {
            drawerBadge.style.display = 'none'
        }
    }

    if (icon) {
        if (count > 0) {
            icon.setAttribute('fill', 'currentColor')
            icon.style.color  = '#e5b3a3'
            icon.style.stroke = '#e5b3a3'
        } else {
            icon.setAttribute('fill', 'none')
            icon.style.color  = ''
            icon.style.stroke = ''
        }
    }
}

window.__logout = logout
