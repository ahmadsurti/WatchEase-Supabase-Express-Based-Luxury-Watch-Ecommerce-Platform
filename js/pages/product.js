import { supabase } from '../supabase.js'
import { getProductById } from '../products.js'
import { updateCartBadge, updateWishlistBadge } from '../auth-check.js'

const urlParams = new URLSearchParams(window.location.search)
const productId = urlParams.get('id')
const gender    = urlParams.get('gender')
const product   = getProductById(productId)

if (!product) {
    document.querySelector('.product-container').innerHTML =
        '<p class="text-center py-5 text-muted">Product not found.</p>'
} else {
    document.getElementById('product-name').textContent  = product.name
    document.getElementById('product-price').textContent = product.price
    document.getElementById('product-desc').textContent  = product.description
    document.getElementById('main-watch-img').src        = `../assets/images/${product.name}.webp`
    document.getElementById('main-watch-img').alt        = product.name

    const genderText   = gender === 'women' ? 'Women' : 'Men'
    const genderLink   = gender === 'women' ? 'women.html' : 'men.html'
    const categorySlug = product.category.toLowerCase()
    const categoryLink = `${genderLink}?style=${encodeURIComponent(categorySlug)}`

    document.getElementById('breadcrumb').innerHTML =
        `<a href="${genderLink}">${genderText} Collection</a> / <a href="${categoryLink}">${product.category}</a>`

    // ── Wire buttons ──────────────────────────────────────────────────────
    document.getElementById('add-btn').addEventListener('click', addToCart)
    document.getElementById('gift-btn').addEventListener('click', goToGift)
    document.getElementById('wishlist-btn').addEventListener('click', toggleWishlist)

    // ── Auth + cart + gift + wishlist state ───────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const [{ data: cartItem }, { data: existingGift }, { data: wishlistItem }] = await Promise.all([
            supabase.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', productId).maybeSingle(),
            supabase.from('gift_orders').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle(),
            supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle()
        ])

        const giftIsPending = (existingGift && cartItem) || urlParams.get('gifted') === '1'
        if (giftIsPending) {
            const giftBtn = document.getElementById('gift-btn')
            giftBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Gift Added`
            giftBtn.classList.add('gifted')
            giftBtn.disabled = true
        }

        const addedPersonally = cartItem && (!existingGift || cartItem.quantity > 1)
        if (addedPersonally) {
            const btn = document.getElementById('add-btn')
            btn.textContent = 'In Your Collection ✓'
            btn.classList.add('added')
        }

        if (wishlistItem) {
            document.getElementById('wishlist-btn').classList.add('wishlisted')
            document.getElementById('wishlist-btn').setAttribute('aria-label', 'Remove from wishlist')
        }
    }

    // ── Load reviews ──────────────────────────────────────────────────────
    await loadReviews(user)
}

// ── Add to Collection ──────────────────────────────────────────────────────
async function addToCart() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        window.location.href = `../html/auth.html?return=../html/product.html%3Fid%3D${productId}%26gender%3D${gender}`
        return
    }

    const btn = document.getElementById('add-btn')
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

    btn.textContent = 'In Your Collection ✓'
    btn.classList.add('added')
    btn.disabled = false
    updateCartBadge(user.id)
}

// ── Gift Someone ───────────────────────────────────────────────────────────
async function goToGift() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        window.location.href = `../html/auth.html?return=../html/product.html%3Fid%3D${productId}%26gender%3D${gender}`
        return
    }

    window.location.href = `../html/gift.html?id=${productId}&gender=${gender}`
}

// ── Wishlist Toggle ────────────────────────────────────────────────────────
async function toggleWishlist() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        window.location.href = `../html/auth.html?return=../html/product.html%3Fid%3D${productId}%26gender%3D${gender}`
        return
    }

    const btn          = document.getElementById('wishlist-btn')
    const isWishlisted = btn.classList.contains('wishlisted')

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
                gender:     gender || 'men'
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

// ── Reviews ────────────────────────────────────────────────────────────────
async function loadReviews(user) {
    const loadingEl = document.getElementById('reviews-loading')
    const listEl    = document.getElementById('reviews-list')
    const emptyEl   = document.getElementById('reviews-empty')
    const summaryEl = document.getElementById('reviews-summary')
    const formWrap  = document.getElementById('review-form-wrap')
    const gateEl    = document.getElementById('review-gate')

    const { data: reviews } = await supabase
        .from('reviews')
        .select('id, user_id, rating, comment, reviewer_name, edit_count, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

    loadingEl.style.display = 'none'
    renderReviewList(reviews || [], listEl, emptyEl, summaryEl, user)

    if (!user) {
        gateEl.style.display = 'block'
        gateEl.innerHTML = `<p class="rv-gate-msg"><a href="../html/auth.html?return=${encodeURIComponent(window.location.href)}">Login</a> to leave a review.</p>`
        return
    }

    const { data: purchased } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1)

    if (!purchased || purchased.length === 0) {
        gateEl.style.display = 'block'
        gateEl.innerHTML = `<p class="rv-gate-msg">Purchase this watch to leave a review.</p>`
        return
    }

    formWrap.style.display = 'block'
    const existingReview = (reviews || []).find(r => r.user_id === user.id)
    setupReviewForm(user, existingReview)
}

function renderReviewList(reviews, listEl, emptyEl, summaryEl, user) {
    listEl.innerHTML = ''

    if (reviews.length === 0) {
        emptyEl.style.display   = 'block'
        summaryEl.style.display = 'none'
        return
    }

    emptyEl.style.display = 'none'

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    document.getElementById('summary-score').textContent = (Math.round(avg * 10) / 10).toFixed(1)
    document.getElementById('summary-stars').innerHTML   = renderStars(avg)
    document.getElementById('summary-count').textContent =
        `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`
    summaryEl.style.display = 'flex'

    reviews.forEach(review => {
        const isOwn = user && review.user_id === user.id
        const date  = new Date(review.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
        const editLabel = review.edit_count > 0
            ? `<span class="rv-edited">edited ${review.edit_count === 1 ? 'once' : review.edit_count === 2 ? 'twice' : `${review.edit_count}×`}</span>`
            : ''

        const card = document.createElement('div')
        card.className = `review-card${isOwn ? ' review-card--own' : ''}`
        card.id = `review-${review.id}`
        card.innerHTML = `
            <div class="review-header">
                <div class="review-header-left">
                    <span class="reviewer-name">${review.reviewer_name || 'Anonymous'}</span>
                    ${isOwn ? '<span class="rv-own-badge">Your review</span>' : ''}
                    ${editLabel}
                </div>
                <div class="review-header-right">
                    <span class="stars">${renderStars(review.rating)}</span>
                    <span class="rv-date">${date}</span>
                </div>
            </div>
            <p class="small text-muted mb-0">${review.comment}</p>
        `
        listEl.appendChild(card)
    })
}

function renderStars(rating) {
    const full  = Math.floor(rating)
    const half  = rating % 1 >= 0.5 ? 1 : 0
    const empty = 5 - full - half
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

function setupReviewForm(user, existingReview) {
    const titleEl   = document.getElementById('rv-form-title')
    const submitBtn = document.getElementById('rv-submit-btn')
    const deleteBtn = document.getElementById('rv-delete-btn')
    const commentEl = document.getElementById('rv-comment')
    const ratingEl  = document.getElementById('rv-rating-val')
    const stars     = document.querySelectorAll('.rv-star')
    const feedback  = document.getElementById('rv-feedback')
    const state     = { review: existingReview || null }

    function applyFormState() {
        if (state.review) {
            titleEl.textContent     = 'Edit Your Review'
            submitBtn.textContent   = 'Update Review'
            deleteBtn.style.display = 'inline-flex'
            commentEl.value         = state.review.comment
            setStars(state.review.rating, stars, ratingEl)
        } else {
            titleEl.textContent     = 'Write a Review'
            submitBtn.textContent   = 'Submit Review'
            deleteBtn.style.display = 'none'
            commentEl.value         = ''
            setStars(0, stars, ratingEl)
        }
    }

    applyFormState()

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => highlightStars(+star.dataset.val, stars))
        star.addEventListener('mouseleave', () => setStars(+ratingEl.value, stars, ratingEl))
        star.addEventListener('click',      () => setStars(+star.dataset.val, stars, ratingEl))
    })

    submitBtn.addEventListener('click', async () => {
        const rating  = +ratingEl.value
        const comment = commentEl.value.trim()

        if (rating === 0) { setFeedback(feedback, 'Please select a rating.', 'error'); return }
        if (!comment)     { setFeedback(feedback, 'Please write a comment.', 'error'); return }

        submitBtn.disabled    = true
        submitBtn.textContent = state.review ? 'Updating…' : 'Submitting…'
        feedback.textContent  = ''

        const { data: profile } = await supabase
            .from('profiles').select('name').eq('id', user.id).maybeSingle()
        const reviewerName =
            profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || 'Anonymous'

        let error, data

        if (state.review) {
            ;({ error, data } = await supabase
                .from('reviews')
                .update({ rating, comment })
                .eq('id', state.review.id)
                .select()
                .maybeSingle())
        } else {
            ;({ error, data } = await supabase
                .from('reviews')
                .insert({ user_id: user.id, product_id: productId, rating, comment, reviewer_name: reviewerName })
                .select()
                .maybeSingle())
        }

        submitBtn.disabled = false

        if (error) {
            submitBtn.textContent = state.review ? 'Update Review' : 'Submit Review'
            setFeedback(feedback, 'Could not save review. Please try again.', 'error')
            console.error(error)
            return
        }

        const wasCreate = !state.review
        state.review    = data
        commentEl.value = ''
        setStars(0, stars, ratingEl)
        applyFormState()
        setFeedback(feedback, wasCreate ? 'Review submitted. Thank you!' : 'Review updated.', 'success')
        await refreshReviews(user)
    })

    deleteBtn.addEventListener('click', async () => {
        if (!state.review) return

        deleteBtn.style.display = 'none'
        const confirmWrap = document.createElement('span')
        confirmWrap.className = 'rv-confirm-wrap'
        confirmWrap.innerHTML = `
            <span class="rv-confirm-label">Remove your review?</span>
            <button class="rv-btn-confirm-yes" type="button">Yes, remove</button>
            <button class="rv-btn-confirm-no"  type="button">Cancel</button>
        `
        deleteBtn.insertAdjacentElement('afterend', confirmWrap)

        confirmWrap.querySelector('.rv-btn-confirm-no').addEventListener('click', () => {
            confirmWrap.remove()
            deleteBtn.style.display = 'inline-flex'
        })

        confirmWrap.querySelector('.rv-btn-confirm-yes').addEventListener('click', async () => {
            confirmWrap.remove()
            deleteBtn.disabled = true
            deleteBtn.style.display = 'inline-flex'

            const { error } = await supabase.from('reviews').delete().eq('id', state.review.id)
            deleteBtn.disabled = false
            if (error) { console.error(error); return }

            state.review = null
            applyFormState()
            await refreshReviews(user)
        })
    })
}

async function refreshReviews(user) {
    const { data: reviews } = await supabase
        .from('reviews')
        .select('id, user_id, rating, comment, reviewer_name, edit_count, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

    renderReviewList(
        reviews || [],
        document.getElementById('reviews-list'),
        document.getElementById('reviews-empty'),
        document.getElementById('reviews-summary'),
        user
    )
}

function setStars(val, stars, ratingEl) {
    ratingEl.value = val
    highlightStars(val, stars)
}

function highlightStars(val, stars) {
    stars.forEach(s => s.classList.toggle('rv-star--active', +s.dataset.val <= val))
}

function setFeedback(el, msg, type) {
    el.textContent = msg
    el.className   = `rv-feedback rv-feedback--${type}`
    if (type === 'success') {
        setTimeout(() => { el.textContent = ''; el.className = 'rv-feedback' }, 4000)
    }
}

