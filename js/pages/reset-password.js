import { supabase } from '../supabase.js'

// ── DOM refs ──────────────────────────────────────────────────────────────────
const alertBox        = document.getElementById('alert-container')
const resetForm       = document.getElementById('reset-form')
const resetBtn        = document.getElementById('reset-btn')
const newPwdInput     = document.getElementById('new-password')
const confirmPwdInput = document.getElementById('confirm-password')

// ── Toggle visibility ─────────────────────────────────────────────────────────
let showNew     = false
let showConfirm = false

document.getElementById('toggle-new-password').addEventListener('click', () => {
    showNew = !showNew
    newPwdInput.type = showNew ? 'text' : 'password'
    document.getElementById('eye-icon-new').setAttribute('data-lucide', showNew ? 'eye-off' : 'eye')
    lucide.createIcons()
    updateCharacters()
})

document.getElementById('toggle-confirm-password').addEventListener('click', () => {
    showConfirm = !showConfirm
    confirmPwdInput.type = showConfirm ? 'text' : 'password'
    document.getElementById('eye-icon-confirm').setAttribute('data-lucide', showConfirm ? 'eye-off' : 'eye')
    lucide.createIcons()
    updateCharacters()
})

// ── Alert helper ──────────────────────────────────────────────────────────────
function showAlert(msg, type = 'danger') {
    alertBox.innerHTML = `<div class="auth-alert ${type}">${msg}</div>`
}

// ── Session from Supabase reset link ─────────────────────────────────────────
let sessionReady = false

supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
        sessionReady = true
    }
})

// ── Form submit ───────────────────────────────────────────────────────────────
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    alertBox.innerHTML = ''

    const newPassword     = newPwdInput.value
    const confirmPassword = confirmPwdInput.value

    if (newPassword.length < 6) {
        showAlert('Password must be at least 6 characters.')
        return
    }

    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match.')
        return
    }

    if (!sessionReady) {
        showAlert('Invalid or expired reset link. Please request a new one.')
        return
    }

    resetBtn.disabled    = true
    resetBtn.textContent = 'Updating…'

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
        showAlert(error.message)
        resetBtn.disabled    = false
        resetBtn.textContent = 'Update password'
        return
    }

    showAlert('Password updated successfully! Redirecting to login…', 'success')
    await supabase.auth.signOut()
    setTimeout(() => { window.location.href = 'auth.html' }, 2000)
})

// ══════════════════════════════════════════════════════════════════════════════
// CHARACTER ANIMATION
// ══════════════════════════════════════════════════════════════════════════════

const purpleChar  = document.getElementById('purple-char')
const blackChar   = document.getElementById('black-char')
const orangeChar  = document.getElementById('orange-char')
const yellowChar  = document.getElementById('yellow-char')

const purpleEyes  = document.getElementById('purple-eyes')
const blackEyes   = document.getElementById('black-eyes')
const orangeEyes  = document.getElementById('orange-eyes')
const yellowEyes  = document.getElementById('yellow-eyes')
const yellowMouth = document.getElementById('yellow-mouth')

let mouseX = 0
let mouseY = 0
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
    }
}

function isPasswordExposed() {
    // Characters cover eyes if either password field has text and is visible
    return (newPwdInput.value.length > 0 && showNew) ||
           (confirmPwdInput.value.length > 0 && showConfirm)
}

function isTypingPassword() {
    return newPwdInput.value.length > 0 || confirmPwdInput.value.length > 0
}

function updatePupilsOnly() {
    const exposed = isPasswordExposed()

    const purpleForce = exposed
        ? (isPurplePeeking ? { x: 4, y: 5 } : { x: -4, y: -4 })
        : null
    const blackForce  = exposed ? { x: -4, y: -4 } : null
    const orangeForce = exposed ? { x: -5, y: -4 } : null
    const yellowForce = exposed ? { x: -5, y: -4 } : null

    updatePupils(purpleEyes, purpleForce, 5)
    updatePupils(blackEyes,  blackForce,  4)
    updatePupils(orangeEyes, orangeForce, 10)
    updatePupils(yellowEyes, yellowForce, 10)

    if (!exposed) {
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
    const exposed = isPasswordExposed()
    const typing  = isTypingPassword()

    // Purple
    const pp = calculatePosition(purpleChar)
    let purpleTransform = `skewX(${pp.bodySkew}deg)`
    let purpleEyesLeft  = 45 + pp.faceX
    let purpleEyesTop   = 40 + pp.faceY

    if (exposed) {
        purpleTransform = `skewX(0deg)`
        purpleEyesLeft  = 20; purpleEyesTop = 35
    } else if (typing) {
        purpleTransform = `skewX(${pp.bodySkew - 12}deg) translateX(40px)`
    }

    purpleChar.style.transform = purpleTransform
    purpleChar.style.height    = typing ? '440px' : '400px'
    purpleEyes.style.left      = `${purpleEyesLeft}px`
    purpleEyes.style.top       = `${purpleEyesTop}px`

    // Black
    const bp = calculatePosition(blackChar)
    let blackTransform = `skewX(${bp.bodySkew}deg)`
    let blackEyesLeft  = 26 + bp.faceX
    let blackEyesTop   = 32 + bp.faceY

    if (exposed) {
        blackTransform = `skewX(0deg)`
        blackEyesLeft  = 10; blackEyesTop = 28
    } else if (typing) {
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

    if (exposed) {
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

    if (exposed) {
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

// React to typing in either password field
newPwdInput.addEventListener('input',     updateCharacters)
confirmPwdInput.addEventListener('input', updateCharacters)

// Purple peeking when password is exposed
setInterval(() => {
    if (isPasswordExposed()) {
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
