/**
 * WatchEase — Shared Footer Injector
 * Dynamically injects the global footer at the end of <body> on every page.
 */

(function () {
    const isRoot = !window.location.pathname.includes('/html/');
    const base   = isRoot ? '.' : '..';

    // Remove existing site-footer in HTML if present to prevent duplication
    const existing = document.getElementById('site-footer');
    if (existing) existing.remove();

    const FOOTER_HTML = `
<footer class="site-footer" id="site-footer">
    <div class="sf-top">
        <div class="sf-grid">

            <!-- Brand -->
            <div class="sf-brand-col">
                <span class="sf-brand-name">WatchEase</span>
                <p class="sf-brand-tagline">Timeless elegance, curated with intent.</p>
                <div class="sf-linkedin">
                    <a href="https://www.linkedin.com/in/ahmad-surti/" target="_blank" rel="noopener" aria-label="Ahmad on LinkedIn" class="sf-li-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span>Ahmad Surti</span>
                    </a>
                    <a href="https://www.linkedin.com/in/tanvir-shaikh-94b0773ba/" target="_blank" rel="noopener" aria-label="Tanvir on LinkedIn" class="sf-li-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span>Tanvir Shaikh</span>
                    </a>
                </div>
            </div>

            <!-- Shop -->
            <div class="sf-col">
                <h6 class="sf-col-heading">Shop</h6>
                <ul class="sf-links">
                    <li><a href="${base}/html/men.html">Men's Watches</a></li>
                    <li><a href="${base}/html/women.html">Women's Watches</a></li>
                    <li><a href="${base}/html/cart.html">Cart</a></li>
                </ul>
            </div>

            <!-- Company -->
            <div class="sf-col">
                <h6 class="sf-col-heading">Company</h6>
                <ul class="sf-links">
                    <li><a href="${base}/html/about.html">About Us</a></li>
                </ul>
            </div>

            <!-- Contact -->
            <div class="sf-col sf-col--contact">
                <h6 class="sf-col-heading">Contact</h6>
                <p>watchease.lux@gmail.com</p>
                <p>+91 8XX XXX XXXX</p>
                <p>Vasna Rd, opp. APMC, Vishala,<br>Ahmedabad, Gujarat</p>
            </div>

        </div>
    </div>

    <!-- 70/30 wordmark -->
    <div class="sf-wordmark-wrap" aria-hidden="true">
        <span class="sf-wordmark">WatchEase</span>
    </div>
</footer>
`;

    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
})();
