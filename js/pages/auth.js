import { supabase } from '../supabase.js'

// ── URL params ────────────────────────────────────────────────────────────────
const urlParams  = new URLSearchParams(window.location.search)
let isSignupMode = urlParams.get('mode') === 'signup'

// ── DOM refs ──────────────────────────────────────────────────────────────────
const nameField    = document.getElementById('name-field')
const formTitle    = document.getElementById('form-title')
const formSubtitle = document.getElementById('form-subtitle')
const submitBtn    = document.getElementById('submit-btn')
const toggleText   = document.getElementById('toggle-text')
const toggleLink   = document.getElementById('toggle-link')
const alertBox     = document.getElementById('alert-container')
const loginOptions = document.getElementById('login-options')
const signupLinkRow = document.getElementById('signup-link-row')

const emailInput    = document.getElementById('email')
const passwordInput = document.getElementById('password')
const togglePwdBtn  = document.getElementById('toggle-password')
const eyeIcon       = document.getElementById('eye-icon')

// Forgot password panel
const forgotLink   = document.getElementById('forgot-link')
const forgotPanel  = document.getElementById('forgot-panel')
const forgotBack   = document.getElementById('forgot-back')
const forgotAlert  = document.getElementById('forgot-alert')
const forgotEmail  = document.getElementById('forgot-email')
const forgotSubmit = document.getElementById('forgot-submit')
const authForm     = document.getElementById('auth-form')

// ── Mode switching ────────────────────────────────────────────────────────────
function applyMode() {
    if (isSignupMode) {
        nameField.style.display    = 'flex'
        formTitle.textContent      = 'Create account'
        formSubtitle.textContent   = 'Fill in your details to get started'
        submitBtn.textContent      = 'Sign Up'
        toggleText.textContent     = 'Already have an account?'
        toggleLink.textContent     = 'Log in'
        loginOptions.style.display = 'none'
    } else {
        nameField.style.display    = 'none'
        formTitle.textContent      = 'Welcome back!'
        formSubtitle.textContent   = 'Please enter your details'
        submitBtn.textContent      = 'Log in'
        toggleText.textContent     = "Don't have an account?"
        toggleLink.textContent     = 'Sign Up'
        loginOptions.style.display = 'flex'
    }
}

applyMode()

toggleLink.addEventListener('click', (e) => {
    e.preventDefault()
    isSignupMode = !isSignupMode
    alertBox.innerHTML = ''
    applyMode()
})

// ── Forgot password panel ─────────────────────────────────────────────────────
forgotLink.addEventListener('click', (e) => {
    e.preventDefault()
    authForm.classList.add('hidden')
    signupLinkRow.classList.add('hidden')
    document.querySelector('.header').classList.add('hidden')
    forgotPanel.classList.remove('hidden')
    forgotAlert.innerHTML = ''
    // Pre-fill email if already typed
    forgotEmail.value = emailInput.value
    lucide.createIcons()
})

forgotBack.addEventListener('click', () => {
    forgotPanel.classList.add('hidden')
    authForm.classList.remove('hidden')
    signupLinkRow.classList.remove('hidden')
    document.querySelector('.header').classList.remove('hidden')
    forgotAlert.innerHTML = ''
    lucide.createIcons()
})

forgotSubmit.addEventListener('click', async () => {
    const email = forgotEmail.value.trim()
    if (!email) {
        forgotAlert.innerHTML = '<div class="auth-alert danger">Please enter your email address.</div>'
        return
    }

    forgotSubmit.disabled = true
    forgotSubmit.textContent = 'Sending…'
    forgotAlert.innerHTML = ''

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/html/reset-password.html`
    })

    forgotSubmit.disabled = false
    forgotSubmit.textContent = 'Send reset link'

    if (error) {
        forgotAlert.innerHTML = `<div class="auth-alert danger">${error.message}</div>`
    } else {
        forgotAlert.innerHTML = '<div class="auth-alert success">Reset link sent — check your inbox.</div>'
        forgotEmail.value = ''
    }
})

// ── Alert helper ──────────────────────────────────────────────────────────────
function showAlert(msg, type = 'danger') {
    alertBox.innerHTML = `<div class="auth-alert ${type}">${msg}</div>`
}

function setLoading(loading) {
    submitBtn.disabled    = loading
    submitBtn.textContent = loading
        ? (isSignupMode ? 'Creating account…' : 'Logging in…')
        : (isSignupMode ? 'Sign Up' : 'Log in')
}

// ── Redirect if already logged in ────────────────────────────────────────────
supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
        const returnUrl = urlParams.get('return') || '../index.html'
        window.location.href = returnUrl
    }
})

// ── Form submit ───────────────────────────────────────────────────────────────
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    alertBox.innerHTML = ''

    const email     = emailInput.value.trim()
    const password  = passwordInput.value
    const name      = document.getElementById('name').value.trim()
    const returnUrl = urlParams.get('return') || '../index.html'

    setLoading(true)

    if (isSignupMode) {
        if (!name) {
            showAlert('Please enter your full name.')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
        })

        if (error) {
            showAlert(error.message)
            setLoading(false)
            return
        }

        showAlert('Account created! Redirecting…', 'success')
        setTimeout(() => window.location.href = returnUrl, 1200)

    } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            if (error.message.toLowerCase().includes('email not confirmed')) {
                showAlert('Please confirm your email address first. Check your inbox for a confirmation link.')
            } else {
                showAlert(error.message || 'Invalid email or password.')
            }
            setLoading(false)
            return
        }

        window.location.href = returnUrl
    }
})

// ── Password visibility toggle ────────────────────────────────────────────────
let showPassword = false

togglePwdBtn.addEventListener('click', () => {
    showPassword = !showPassword
    passwordInput.type = showPassword ? 'text' : 'password'
    eyeIcon.setAttribute('data-lucide', showPassword ? 'eye-off' : 'eye')
    lucide.createIcons()
    updateCharacters()
})

// ══════════════════════════════════════════════════════════════════════════════
// CHARACTER ANIMATION
// ══════════════════════════════════════════════════════════════════════════════

const purpleChar = document.getElementById('purple-char')
const blackChar  = document.getElementById('black-char')
const orangeChar = document.getElementById('orange-char')
const yellowChar = document.getElementById('yellow-char')

const purpleEyes = document.getElementById('purple-eyes')
const blackEyes  = document.getElementById('black-eyes')
const orangeEyes = document.getElementById('orange-eyes')
const yellowEyes = document.getElementById('yellow-eyes')
const yellowMouth = document.getElementById('yellow-mouth')

let mouseX = 0
let mouseY = 0
let isTyping = false
let isLookingAtEachOther = false
let isPurplePeeking = false
let idleTimer = null
const IDLE_DELAY = 120

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
    updatePupilsOnly()
    clearTimeout(idleTimer)
    idleTimer = setTimeout(updateBodiesAndEyes, IDLE_DELAY)
})

function calculatePosition(element) {
    if (!element) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const rect    = element.getBoundingClientRect()
    const centerX = rect.left + rect.width  / 2
    const centerY = rect.top  + rect.height / 3
    const deltaX  = mouseX - centerX
    const deltaY  = mouseY - centerY
    return {
        faceX:    Math.max(-15, Math.min(15, deltaX / 20)),
        faceY:    Math.max(-10, Math.min(10, deltaY / 30)),
        bodySkew: Math.max(-6,  Math.min(6, -deltaX / 120)),
        deltaX, deltaY
    }
}

function updatePupilsOnly() {
    const hasPassword   = passwordInput.value.length > 0
    const pwVisible     = showPassword

    const purpleForce = (hasPassword && pwVisible)
        ? (isPurplePeeking ? { x: 4, y: 5 } : { x: -4, y: -4 })
        : (isLookingAtEachOther ? { x: 3, y: 4 } : null)

    const blackForce  = (hasPassword && pwVisible)
        ? { x: -4, y: -4 }
        : (isLookingAtEachOther ? { x: 0, y: -4 } : null)

    const orangeForce = (hasPassword && pwVisible) ? { x: -5, y: -4 } : null
    const yellowForce = (hasPassword && pwVisible) ? { x: -5, y: -4 } : null

    updatePupils(purpleEyes, purpleForce, 5)
    updatePupils(blackEyes,  blackForce,  4)
    updatePupils(orangeEyes, orangeForce, 10)
    updatePupils(yellowEyes, yellowForce, 10)

    if (!(hasPassword && pwVisible)) {
        const rect    = yellowMouth.getBoundingClientRect()
        const centerX = rect.left + rect.width  / 2
        const centerY = rect.top  + rect.height / 2
        const deltaX  = mouseX - centerX
        const deltaY  = mouseY - centerY
        const dist    = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), 10)
        const angle   = Math.atan2(deltaY, deltaX)
        yellowMouth.style.left = `${40 + Math.cos(angle) * dist}px`
        yellowMouth.style.top  = `${88 + Math.sin(angle) * dist}px`
    }
}

function updateBodiesAndEyes() {
    const hasPassword = passwordInput.value.length > 0
    const pwVisible   = showPassword

    // Purple
    const pp = calculatePosition(purpleChar)
    let purpleTransform  = `skewX(${pp.bodySkew}deg)`
    let purpleEyesLeft   = 45 + pp.faceX
    let purpleEyesTop    = 40 + pp.faceY

    if (hasPassword && pwVisible) {
        purpleTransform = `skewX(0deg)`
        purpleEyesLeft  = 20; purpleEyesTop = 35
    } else if (isTyping || (hasPassword && !pwVisible)) {
        purpleTransform = `skewX(${pp.bodySkew - 12}deg) translateX(40px)`
        if (isLookingAtEachOther) { purpleEyesLeft = 55; purpleEyesTop = 65 }
    }

    purpleChar.style.transform = purpleTransform
    purpleChar.style.height    = (isTyping || (hasPassword && !pwVisible)) ? '440px' : '400px'
    purpleEyes.style.left      = `${purpleEyesLeft}px`
    purpleEyes.style.top       = `${purpleEyesTop}px`

    // Black
    const bp = calculatePosition(blackChar)
    let blackTransform = `skewX(${bp.bodySkew}deg)`
    let blackEyesLeft  = 26 + bp.faceX
    let blackEyesTop   = 32 + bp.faceY

    if (hasPassword && pwVisible) {
        blackTransform = `skewX(0deg)`
        blackEyesLeft  = 10; blackEyesTop = 28
    } else if (isLookingAtEachOther) {
        blackTransform = `skewX(${bp.bodySkew * 1.5 + 10}deg) translateX(20px)`
        blackEyesLeft  = 32; blackEyesTop = 12
    } else if (isTyping || (hasPassword && !pwVisible)) {
        blackTransform = `skewX(${bp.bodySkew * 1.5}deg)`
    }

    blackChar.style.transform = blackTransform
    blackEyes.style.left      = `${blackEyesLeft}px`
    blackEyes.style.top       = `${blackEyesTop}px`

    // Orange
    const op = calculatePosition(orangeChar)
    let orangeTransform = `skewX(${op.bodySkew}deg)`
    let orangeEyesLeft  = 82 + op.faceX
    let orangeEyesTop   = 90 + op.faceY

    if (hasPassword && pwVisible) {
        orangeTransform = `skewX(0deg)`
        orangeEyesLeft  = 50; orangeEyesTop = 85
    }

    orangeChar.style.transform = orangeTransform
    orangeEyes.style.left      = `${orangeEyesLeft}px`
    orangeEyes.style.top       = `${orangeEyesTop}px`

    // Yellow
    const yp = calculatePosition(yellowChar)
    let yellowTransform = `skewX(${yp.bodySkew}deg)`
    let yellowEyesLeft  = 52 + yp.faceX
    let yellowEyesTop   = 40 + yp.faceY

    if (hasPassword && pwVisible) {
        yellowTransform = `skewX(0deg)`
        yellowEyesLeft  = 20; yellowEyesTop = 35
        yellowMouth.style.left = `10px`
        yellowMouth.style.top  = `88px`
    }

    yellowChar.style.transform = yellowTransform
    yellowEyes.style.left      = `${yellowEyesLeft}px`
    yellowEyes.style.top       = `${yellowEyesTop}px`
}

function updateCharacters() {
    updateBodiesAndEyes()
    updatePupilsOnly()
}

function updatePupils(container, forceLook, maxDistance) {
    container.querySelectorAll('.pupil').forEach(pupil => {
        let x = 0, y = 0
        if (forceLook) {
            x = forceLook.x; y = forceLook.y
        } else {
            const rect    = pupil.getBoundingClientRect()
            const centerX = rect.left + rect.width  / 2
            const centerY = rect.top  + rect.height / 2
            const deltaX  = mouseX - centerX
            const deltaY  = mouseY - centerY
            const dist    = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
            const angle   = Math.atan2(deltaY, deltaX)
            x = Math.cos(angle) * dist
            y = Math.sin(angle) * dist
        }
        pupil.style.transform = `translate(${x}px, ${y}px)`
    })
}

// Blinking
function setupBlink(charId, eyeSelector, eyeSize) {
    const eyes = document.querySelectorAll(`#${charId} ${eyeSelector}`)
    function blink() {
        eyes.forEach(eye => {
            eye.style.height = '2px'
            const pupil = eye.querySelector('.pupil')
            if (pupil) pupil.style.display = 'none'
        })
        setTimeout(() => {
            eyes.forEach(eye => {
                eye.style.height = eyeSize
                const pupil = eye.querySelector('.pupil')
                if (pupil) pupil.style.display = 'block'
            })
            setTimeout(blink, Math.random() * 4000 + 3000)
        }, 150)
    }
    setTimeout(blink, Math.random() * 4000 + 3000)
}

setupBlink('purple-char', '.eye-ball', '18px')
setupBlink('black-char',  '.eye-ball', '16px')

// Email focus — characters look at each other
emailInput.addEventListener('focus', () => {
    isTyping = true
    isLookingAtEachOther = true
    updateCharacters()
    setTimeout(() => {
        isLookingAtEachOther = false
        updateCharacters()
    }, 800)
})

emailInput.addEventListener('blur', () => {
    isTyping = false
    updateCharacters()
})

passwordInput.addEventListener('input', updateCharacters)

// Purple peeking when password is visible
setInterval(() => {
    if (passwordInput.value.length > 0 && showPassword) {
        isPurplePeeking = true
        updateCharacters()
        setTimeout(() => {
            isPurplePeeking = false
            updateCharacters()
        }, 800)
    }
}, 4000)

// Initial render
updateCharacters()
