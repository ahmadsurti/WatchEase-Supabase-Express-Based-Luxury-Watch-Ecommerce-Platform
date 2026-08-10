import { supabase } from '../supabase.js'
import { updateWishlistBadge } from '../auth-check.js'

// Limit hero video to 13.8 seconds then loop
const heroVideo = document.getElementById('heroVideo')
if (heroVideo) {
    heroVideo.addEventListener('timeupdate', () => {
        if (heroVideo.currentTime >= 13.8) {
            heroVideo.currentTime = 0
            heroVideo.play()
        }
    })
}

// ── Home card wishlist ─────────────────────────────────────────────────────
async function initHomeWishlist() {
    const { data: { user } } = await supabase.auth.getUser()
    const btns = document.querySelectorAll('.home-card-wishlist')

    if (user) {
        const { data: items } = await supabase
            .from('wishlist')
            .select('product_id')
            .eq('user_id', user.id)

        const wishlisted = new Set((items || []).map(i => i.product_id))
        btns.forEach(btn => {
            if (wishlisted.has(btn.dataset.id)) {
                btn.classList.add('wishlisted')
                btn.setAttribute('aria-label', 'Remove from wishlist')
            }
        })
    }

    btns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault()
            e.stopPropagation()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                const isRoot = !window.location.pathname.includes('/html/')
                const authBase = isRoot ? './html' : '.'
                window.location.href = `${authBase}/auth.html?return=${encodeURIComponent(window.location.href)}`
                return
            }

            const productId    = btn.dataset.id
            const gender       = btn.dataset.gender
            const isWishlisted = btn.classList.contains('wishlisted')

            btn.classList.toggle('wishlisted', !isWishlisted)
            btn.setAttribute('aria-label', isWishlisted ? 'Add to wishlist' : 'Remove from wishlist')

            if (isWishlisted) {
                const { error } = await supabase.from('wishlist').delete()
                    .eq('user_id', user.id).eq('product_id', productId)
                if (error) { btn.classList.add('wishlisted'); console.error(error); return }
            } else {
                const { error } = await supabase.from('wishlist')
                    .upsert({ user_id: user.id, product_id: productId, gender },
                        { onConflict: 'user_id,product_id' })
                if (error) { btn.classList.remove('wishlisted'); console.error(error); return }
            }

            updateWishlistBadge(user.id)
        })
    })
}

initHomeWishlist()

// ── Glass buttons specular highlight ──────────────────────────────────────
document.querySelectorAll('.home-card-glass-btn, .glass-button').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const specular = btn.querySelector('.glass-specular')
        if (specular) {
            specular.style.background =
                `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 70%)`
        }
    })
    btn.addEventListener('mouseleave', () => {
        const specular = btn.querySelector('.glass-specular')
        if (specular) specular.style.background = 'none'
    })
})
