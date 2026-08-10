// Injects the frosted navbar HTML into every page before any other content.
// Import this as the FIRST module script on every page.
// Detects whether the current page is at root (index.html) or inside /html/
// and resolves all hrefs accordingly.

const isRoot = !window.location.pathname.includes('/html/')
const base   = isRoot ? './html' : '.'

const NAV_HTML = `
<header class="wn-header" id="wn-header">
    <div class="wn-bar" id="wn-bar">
        <div class="wn-inner">

            <!-- Brand -->
            <a href="${isRoot ? './index.html' : '../index.html'}" class="wn-brand">WatchEase</a>

            <!-- Centre nav links -->
            <ul class="wn-links" id="wn-links">
                <li><a href="${base}/men.html">Men</a></li>
                <li><a href="${base}/women.html">Women</a></li>
                <li><a href="${base}/about.html">About</a></li>
            </ul>

            <!-- Right: cart + auth (populated by navbar.js) -->
            <div class="wn-actions" id="wn-actions"></div>

            <!-- Mobile hamburger -->
            <button class="wn-hamburger" id="wn-hamburger"
                    aria-label="Toggle navigation" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>

        </div>
    </div>

    <!-- Mobile drawer -->
    <div class="wn-drawer" id="wn-drawer">
        <ul class="wn-drawer-links" style="list-style:none;margin:0;padding:0;">
            <li><a href="${base}/men.html">Men</a></li>
            <li><a href="${base}/women.html">Women</a></li>
            <li><a href="${base}/about.html">About</a></li>
            <li><a href="${base}/cart.html">Cart</a></li>
        </ul>
        <!-- Dark mode toggle row in drawer -->
        <div class="wn-drawer-theme">
            <span>Dark mode</span>
            <button class="wn-theme-btn" id="wn-theme-btn-drawer" aria-label="Toggle dark mode">
                <svg class="icon-bulb-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21h6"/>
                    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z"/>
                </svg>
                <svg class="icon-bulb-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21h6"/>
                    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z" fill="currentColor" opacity="0.25"/>
                    <line x1="12" y1="1" x2="12" y2="2.5"/>
                    <line x1="4.22" y1="4.22" x2="5.27" y2="5.27"/>
                    <line x1="1" y1="12" x2="2.5" y2="12"/>
                    <line x1="19.78" y1="4.22" x2="18.73" y2="5.27"/>
                    <line x1="23" y1="12" x2="21.5" y2="12"/>
                </svg>
            </button>
        </div>
        <div id="wn-drawer-auth"></div>
    </div>
</header>
`

// Insert as very first child of <body>
document.body.insertAdjacentHTML('afterbegin', NAV_HTML)
