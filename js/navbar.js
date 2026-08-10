import { supabase } from './supabase.js'
import { updateCartBadge, updateWishlistBadge } from './auth-check.js'

// ── Detect root vs /html/ depth ────────────────────────────────────────────
const isRoot = !window.location.pathname.includes('/html/')
const base   = isRoot ? './html' : '.'

// ── Detect active page for nav link highlight ──────────────────────────────
function getActivePage() {
    const path = window.location.pathname.split('/').pop() || 'index.html'
    return path
}

// ── Build auth section (logged in vs logged out) ───────────────────────────
const THEME_BTN_HTML = `
    <button class="wn-theme-btn wn-cart" id="wn-theme-btn" aria-label="Toggle dark mode" title="Toggle dark mode">
        <svg class="icon-bulb-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21h6"/>
            <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z"/>
        </svg>
        <svg class="icon-bulb-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21h6"/>
            <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z" fill="currentColor" opacity="0.2"/>
            <line x1="12" y1="1" x2="12" y2="2.5"/>
            <line x1="4.22" y1="4.22" x2="5.27" y2="5.27"/>
            <line x1="1" y1="12" x2="2.5" y2="12"/>
            <line x1="19.78" y1="4.22" x2="18.73" y2="5.27"/>
            <line x1="23" y1="12" x2="21.5" y2="12"/>
        </svg>
    </button>
`

async function buildAuthSection() {
    const { data: { user } } = await supabase.auth.getUser()

    const desktopActions = document.getElementById('wn-actions')
    const drawerAuth     = document.getElementById('wn-drawer-auth')

    if (!user) {
        // Desktop
        desktopActions.innerHTML = `
            <a href="${base}/cart.html" class="wn-cart" aria-label="Cart">
                <span style="position:relative;display:inline-flex;width:20px;height:20px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                        <path d="M3 6h18"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span id="cart-badge" class="wn-badge"></span>
                </span>
            </a>
            ${THEME_BTN_HTML}
            <a href="${base}/auth.html" class="wn-btn-ghost wn-btn-login-mobile">Login</a>
            <a href="${base}/auth.html?mode=signup" class="wn-btn-fill">Sign Up</a>
        `
        wirethemeBtn()
        // Mobile drawer
        if (drawerAuth) {
            drawerAuth.innerHTML = `
                <div class="wn-drawer-actions">
                    <a href="${base}/auth.html" class="wn-btn-ghost">Login</a>
                    <a href="${base}/auth.html?mode=signup" class="wn-btn-fill">Sign Up</a>
                </div>
            `
        }
        return
    }

    // Logged in — fetch name
    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

    const displayName =
        profile?.name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        'there'

    // Desktop
    desktopActions.innerHTML = `
        <a href="${base}/profile.html?tab=wishlist" class="wn-cart" aria-label="Wishlist">
            <span style="position:relative;display:inline-flex;width:20px;height:20px;">
                <svg id="wn-wishlist-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span id="wishlist-badge" class="wn-badge"></span>
            </span>
        </a>
        <a href="${base}/cart.html" class="wn-cart" aria-label="Cart">
            <span style="position:relative;display:inline-flex;width:20px;height:20px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span id="cart-badge" class="wn-badge"></span>
            </span>
        </a>
        ${THEME_BTN_HTML}
        <a href="${base}/profile.html" class="wn-profile-link" aria-label="My Account">
            <span class="wn-profile-avatar" aria-hidden="true">${displayName.charAt(0).toUpperCase()}</span>
            <span class="wn-greeting">Hello, ${displayName}</span>
        </a>
        <button class="wn-btn-logout" onclick="window.__logout()">Logout</button>
    `
    wirethemeBtn()

    // Mobile drawer
    if (drawerAuth) {
        drawerAuth.innerHTML = `
            <div class="wn-drawer-actions">
                <a href="${base}/profile.html?tab=wishlist" class="wn-btn-ghost wn-drawer-wishlist" style="flex:1;text-align:center;">
                    <span style="position:relative;display:inline-flex;align-items:center;gap:0.4rem;">
                        Wishlist
                        <span id="drawer-wishlist-badge" class="wn-drawer-badge"></span>
                    </span>
                </a>
                <a href="${base}/profile.html" class="wn-btn-ghost wn-drawer-account" style="flex:1;text-align:center;">My Account</a>
                <button class="wn-btn-logout" onclick="window.__logout()">Logout</button>
            </div>
        `
    }

    // Populate badges
    updateCartBadge(user.id)
    updateWishlistBadge(user.id)
}

// ── Scroll: heavier blur on scroll, hero threshold ────────────────────────
function initScroll() {
    const bar    = document.querySelector('.wn-bar')
    const drawer = document.getElementById('wn-drawer')
    if (!bar) return

    const isHero    = document.body.classList.contains('wn-hero-page')
    const threshold = isHero ? window.innerHeight * 0.75 : 40

    let ticking = false
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY > threshold
                bar.classList.toggle('wn-bar--scrolled', scrolled)
                if (drawer) drawer.classList.toggle('wn-drawer--scrolled', scrolled)
                ticking = false
            })
            ticking = true
        }
    }, { passive: true })
}

// ── Mobile hamburger ───────────────────────────────────────────────────────
function initHamburger() {
    const btn    = document.getElementById('wn-hamburger')
    const drawer = document.getElementById('wn-drawer')
    if (!btn || !drawer) return

    btn.addEventListener('click', () => {
        const open = drawer.classList.toggle('wn-drawer--open')
        btn.classList.toggle('wn-open', open)
        btn.setAttribute('aria-expanded', open)
    })

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.wn-header')) {
            drawer.classList.remove('wn-drawer--open')
            btn.classList.remove('wn-open')
            btn.setAttribute('aria-expanded', false)
        }
    })
}

// ── Theme toggle ───────────────────────────────────────────────────────────
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark')
    localStorage.setItem('we-theme', isDark ? 'dark' : 'light')
}

// Called after each buildAuthSection() to wire the freshly-injected desktop btn
function wirethemeBtn() {
    const btn = document.getElementById('wn-theme-btn')
    if (btn) btn.addEventListener('click', toggleTheme)
}

function initTheme() {
    const saved = localStorage.getItem('we-theme')
    if (saved === 'dark') document.body.classList.add('dark')

    // Drawer button is static HTML — wire it once here
    const btnDrawer = document.getElementById('wn-theme-btn-drawer')
    if (btnDrawer) btnDrawer.addEventListener('click', toggleTheme)
}

// ── Logout ─────────────────────────────────────────────────────────────────
window.__logout = async function () {
    await supabase.auth.signOut()
    window.location.href = isRoot ? './index.html' : '../index.html'
}

// ── Init ───────────────────────────────────────────────────────────────────
function initNavbar() {
    const page  = getActivePage()
    const links = document.querySelectorAll('.wn-links a, .wn-drawer-links a')
    links.forEach(link => {
        const href = link.getAttribute('href')
        const linkPage = href.split('/').pop()
        if (linkPage === page || (page === '' && linkPage === 'index.html')) {
            link.classList.add('wn-active')
        }
    })

    initTheme()
    initScroll()
    initHamburger()
    buildAuthSection()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar)
} else {
    initNavbar()
}
