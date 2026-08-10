// Brevo REST API helper & Email Templates

async function sendBrevoEmail({ toEmail, toName, subject, htmlContent }) {
    const apiKey = process.env.BREVO_API_KEY
    const senderEmail = process.env.SENDER_EMAIL || 'hello.tractionagency@gmail.com'
    const senderName = process.env.SENDER_NAME || 'WatchEase'

    if (!apiKey) {
        throw new Error('BREVO_API_KEY environment variable is not set')
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: toEmail, name: toName || toEmail }],
            subject,
            htmlContent
        })
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Brevo API Error (${res.status}): ${errText}`)
    }

    return await res.json()
}

function formatINR(n) {
    return '₹' + Number(n).toLocaleString('en-IN')
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    })
}

const LUXURY_NOTES = [
    (name) => `Dear ${name},<br><br>A timepiece is never merely an object — it is a declaration. The watch you have chosen today speaks before you do, and it will continue speaking long after the moment has passed. At WatchEase, we do not simply ship watches. We deliver a piece of someone's legacy.<br><br>We are deeply honoured that you chose us for yours.`,
    (name) => `Dear ${name},<br><br>Great taste is rarely accidental. The piece you have selected carries with it decades of horological tradition and the quiet confidence of those who understand that true luxury never announces itself — it simply is.<br><br>Welcome to that circle. We are glad you are here.`,
    (name) => `Dear ${name},<br><br>Some purchases are transactions. This one is different. You have chosen a companion that will mark your milestones, outlast trends, and grow more meaningful with every passing year.<br><br>We crafted it for someone exactly like you. Wear it well.`,
    (name) => `Dear ${name},<br><br>The finest things in life are not rushed. Your timepiece has been prepared with the same patience and precision that went into engineering every component within it. It is on its way — and we promise, it has been worth the wait.<br><br>Thank you for your trust.`,
    (name) => `Dear ${name},<br><br>At WatchEase, we hold a firm belief: a watch is the one accessory a person never truly takes off. It becomes part of how the world reads you. That is why we hold every single order to an impossibly high standard.<br><br>Yours is no exception. We hope it exceeds every expectation.`,
    (name) => `Dear ${name},<br><br>There is a reason the world's most accomplished people wear exceptional watches. It is not vanity — it is the quiet acknowledgement that time is the only currency that truly matters, and how you carry it says everything.<br><br>You have chosen to carry it beautifully.`,
    (name) => `Dear ${name},<br><br>Luxury is not about price. It is about the feeling of holding something that was made with absolute intention — where every detail was deliberate, every finish considered, every second of engineering time justified.<br><br>That is what you hold now. We hope you feel it the moment it arrives.`,
]

function getLuxuryNote(userName, orderId) {
    const idStr = String(orderId || 'WE00000000')
    const idx = idStr.charCodeAt(idStr.length - 1) % LUXURY_NOTES.length
    return LUXURY_NOTES[idx](userName)
}

const SUBJECT_LINES = [
    (name, ref) => `${name}, your WatchEase order #${ref} is confirmed ✓`,
    (name, ref) => `Your timepiece is on its way, ${name} — Order #${ref}`,
    (name, ref) => `Order #${ref} confirmed — thank you, ${name}`,
    (name, ref) => `${name} — your WatchEase collection is being prepared (#${ref})`,
    (name, ref) => `It's official, ${name}. Order #${ref} is in motion.`,
]

function getSubjectLine(userName, orderId) {
    const idStr = String(orderId || 'WE00000000')
    const ref = idStr.slice(0, 8).toUpperCase()
    const idx = idStr.charCodeAt(0) % SUBJECT_LINES.length
    return SUBJECT_LINES[idx](userName, ref)
}

function buildEmailHTML({ order, items, userName }) {
    const orderDate = new Date(order.created_at)
    const deliveryDate = new Date(orderDate)
    deliveryDate.setDate(deliveryDate.getDate() + 7)

    const subtotal = Number(order.total_amount)
    const tax = Math.round(subtotal * 0.05)
    const grandTotal = subtotal + tax
    const orderRef = order.id.slice(0, 8).toUpperCase()
    const luxuryNote = getLuxuryNote(userName, order.id)

    const itemRows = items.map(item => `
        <tr>
            <td style="padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
                <div style="font-family:'Georgia',Georgia,serif;font-size:15px;color:#ffffff;font-style:italic;line-height:1.4;">${item.name}</div>
                <div style="font-size:10px;color:rgba(255,255,255,0.28);text-transform:uppercase;letter-spacing:2.5px;margin-top:5px;">
                    ${item.gender === 'women' ? 'Women' : 'Men'} &nbsp;&middot;&nbsp; Qty ${item.quantity}
                </div>
            </td>
            <td style="padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.07);text-align:right;vertical-align:top;">
                <div style="font-family:'Georgia',Georgia,serif;font-size:15px;color:#e5b3a3;white-space:nowrap;">${formatINR(item.price * item.quantity)}</div>
            </td>
        </tr>
    `).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Order Confirmed — WatchEase</title>
</head>
<body style="margin:0;padding:0;background:#111111;font-family:'Georgia',Georgia,serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:0;">
<tr><td align="center" style="padding:48px 16px 64px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr>
        <td style="background:#0a0a0a;border-radius:4px 4px 0 0;padding:40px 48px 36px;text-align:center;border-bottom:2px solid #e5b3a3;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                <tr>
                    <td style="vertical-align:middle;padding-right:16px;">
                        <img src="https://i.ibb.co/B5q4FhnB/logo-dark-crop.png" alt="WatchEase Logo" width="52" height="52" style="display:block;border:0;">
                    </td>
                    <td style="vertical-align:middle;">
                        <div style="font-family:'Georgia',Georgia,serif;font-size:36px;font-style:italic;color:#ffffff;letter-spacing:2px;line-height:1;font-weight:normal;">WatchEase</div>
                    </td>
                </tr>
            </table>
            <div style="font-size:9px;letter-spacing:6px;text-transform:uppercase;color:rgba(229,179,163,0.5);">✦ &nbsp; Timeless Elegance &nbsp; ✦</div>
        </td>
    </tr>
    <tr>
        <td style="background:#1a1410;padding:44px 48px 40px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
            <div style="display:inline-block;margin-bottom:24px;">
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="background:rgba(229,179,163,0.1);border:1px solid rgba(229,179,163,0.3);border-radius:20px;padding:6px 18px;">
                            <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e5b3a3;">&#10003;&nbsp; Order Confirmed</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="font-family:'Georgia',Georgia,serif;font-size:30px;color:#ffffff;font-style:italic;line-height:1.3;font-weight:normal;margin-bottom:20px;">
                ${userName},<br>your timepiece is secured.
            </div>
            <div style="font-family:'Georgia',Georgia,serif;font-size:14px;color:rgba(255,255,255,0.42);line-height:2;font-style:italic;border-left:2px solid rgba(229,179,163,0.35);padding-left:20px;">
                ${luxuryNote}
            </div>
        </td>
    </tr>
    <tr>
        <td style="background:#161616;padding:0;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="width:33.33%;padding:24px 28px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">
                        <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.22);margin-bottom:8px;">Order Ref</div>
                        <div style="font-family:'Georgia',Georgia,serif;font-size:14px;color:#e5b3a3;letter-spacing:1.5px;">#${orderRef}</div>
                    </td>
                    <td style="width:33.33%;padding:24px 28px;border-right:1px solid rgba(255,255,255,0.06);text-align:center;">
                        <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.22);margin-bottom:8px;">Date Placed</div>
                        <div style="font-family:'Georgia',Georgia,serif;font-size:13px;color:rgba(255,255,255,0.6);">${formatDate(orderDate)}</div>
                    </td>
                    <td style="width:33.33%;padding:24px 28px;text-align:center;">
                        <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.22);margin-bottom:8px;">Est. Delivery</div>
                        <div style="font-family:'Georgia',Georgia,serif;font-size:13px;color:rgba(255,255,255,0.6);">${formatDate(deliveryDate)}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="background:#0f0f0f;padding:36px 48px 0;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:4px;color:rgba(229,179,163,0.5);margin-bottom:4px;">Your Collection</div>
            <div style="height:1px;background:rgba(229,179,163,0.15);margin:16px 0 0;"></div>
        </td>
    </tr>
    <tr>
        <td style="background:#0f0f0f;padding:0 48px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
            <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
            </table>
        </td>
    </tr>
    <tr>
        <td style="background:#0f0f0f;padding:0 48px 36px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
                <tr>
                    <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.28);letter-spacing:0.3px;">Subtotal</td>
                    <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.28);text-align:right;">${formatINR(subtotal)}</td>
                </tr>
                <tr>
                    <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.28);">Shipping</td>
                    <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.28);text-align:right;">Complimentary</td>
                </tr>
                <tr>
                    <td style="padding:5px 0 16px;font-size:12px;color:rgba(255,255,255,0.28);">GST (5%)</td>
                    <td style="padding:5px 0 16px;font-size:12px;color:rgba(255,255,255,0.28);text-align:right;">${formatINR(tax)}</td>
                </tr>
                <tr>
                    <td style="padding:18px 0 0;border-top:1px solid rgba(229,179,163,0.2);">
                        <div style="font-family:'Georgia',Georgia,serif;font-size:19px;color:#ffffff;font-style:italic;">Total</div>
                    </td>
                    <td style="padding:18px 0 0;border-top:1px solid rgba(229,179,163,0.2);text-align:right;">
                        <div style="font-family:'Georgia',Georgia,serif;font-size:22px;color:#e5b3a3;font-style:italic;">${formatINR(grandTotal)}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="background:#1a1410;padding:28px 48px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="vertical-align:middle;">
                        <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.25);margin-bottom:6px;">Estimated Arrival</div>
                        <div style="font-family:'Georgia',Georgia,serif;font-size:20px;color:#ffffff;font-style:italic;">${formatDate(deliveryDate)}</div>
                    </td>
                    <td style="vertical-align:middle;text-align:right;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.22);letter-spacing:0.5px;line-height:1.8;">5–7 business days<br>Standard delivery</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="background:#0a0a0a;border-radius:0 0 4px 4px;padding:36px 48px 40px;text-align:center;border-top:2px solid #e5b3a3;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);border-bottom:1px solid rgba(229,179,163,0.12);">
            <img src="https://i.ibb.co/B5q4FhnB/logo-dark-crop.png" alt="WatchEase" width="32" height="32" style="display:block;margin:0 auto 14px;opacity:0.5;border:0;">
            <div style="font-size:11px;color:rgba(255,255,255,0.2);line-height:2.2;letter-spacing:0.5px;">
                <a href="mailto:watchease.lux@gmail.com" style="color:rgba(229,179,163,0.45);text-decoration:none;">watchease.lux@gmail.com</a>
                &nbsp;&nbsp;&#10022;&nbsp;&nbsp;
                Vasna Rd, Ahmedabad, Gujarat
            </div>
            <div style="margin-top:18px;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.1);">
                WatchEase &copy; 2026
            </div>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

const TEASER_SUBJECTS = [
    (name) => `${name}, something is on its way to you 🎁`,
    (name) => `A surprise is coming your way, ${name}`,
    (name) => `${name} — someone is thinking of you`,
    (name) => `Something special has been sent to you, ${name}`,
]

function buildTeaserHTML({ recipientName, senderName }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Something is coming your way</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Georgia',Georgia,serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
    <tr>
        <td style="padding-bottom:48px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                    <td style="vertical-align:middle;padding-right:14px;">
                        <img src="https://i.ibb.co/3Y8KKJkH/logo-soft-creme-crop.png" alt="WatchEase" width="48" height="48" style="display:block;border:0;">
                    </td>
                    <td style="vertical-align:middle;">
                        <div style="font-family:'Lora','Georgia',Georgia,serif;font-size:42px;font-style:italic;color:#000000;letter-spacing:1px;line-height:1;">
                            WatchEase
                        </div>
                    </td>
                </tr>
            </table>
            <div style="font-size:10px;letter-spacing:5px;text-transform:uppercase;color:rgba(18,18,18,0.3);margin-top:10px;">
                ✦ &nbsp; Timeless Elegance &nbsp; ✦
            </div>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom:48px;">
            <div style="height:1px;background:#e5b3a3;"></div>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom:28px;">
            <div style="font-family:'Georgia',Georgia,serif;font-size:26px;color:#121212;font-style:italic;line-height:1.35;font-weight:normal;">
                ${recipientName},<br>something is on its way to you.
            </div>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom:40px;">
            <div style="font-family:'Georgia',Georgia,serif;font-size:15px;color:rgba(18,18,18,0.55);line-height:1.9;font-style:italic;">
                <strong style="color:#121212;font-style:normal;">${senderName}</strong> has sent you a gift through WatchEase.<br>
                We can't tell you what it is — that would ruin the surprise.
            </div>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom:48px;">
            <div style="font-family:'Georgia',Georgia,serif;font-size:14px;color:rgba(18,18,18,0.45);line-height:1.9;font-style:italic;">
                "The finest things arrive quietly.<br>
                Yours is already in motion."
            </div>
            <div style="margin-top:12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e5b3a3;">
                — WatchEase
            </div>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom:32px;">
            <div style="height:1px;background:#e5b3a3;"></div>
        </td>
    </tr>
    <tr>
        <td style="text-align:center;padding-bottom:48px;">
            <div style="font-size:11px;color:rgba(18,18,18,0.25);line-height:2;letter-spacing:0.5px;">
                You're receiving this because someone who cares about you<br>
                chose to send you something through WatchEase.<br><br>
                <a href="mailto:watchease.lux@gmail.com" style="color:#e5b3a3;text-decoration:none;">watchease.lux@gmail.com</a>
            </div>
            <div style="margin-top:20px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(18,18,18,0.15);">
                WatchEase &copy; 2026
            </div>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

async function sendOrderEmail({ order, items, userEmail, userName }) {
    const name = userName || 'Valued Customer'
    const htmlContent = buildEmailHTML({ order, items, userName: name })
    const subject = getSubjectLine(name, order.id)
    return await sendBrevoEmail({ toEmail: userEmail, toName: name, subject, htmlContent })
}

async function sendGiftTeaser({ recipientName, recipientEmail, senderName }) {
    const name = recipientName || 'there'
    const sender = senderName || 'Someone special'
    const idx = name.charCodeAt(0) % TEASER_SUBJECTS.length
    const subject = TEASER_SUBJECTS[idx](name)
    const htmlContent = buildTeaserHTML({ recipientName: name, senderName: sender })
    return await sendBrevoEmail({ toEmail: recipientEmail, toName: name, subject, htmlContent })
}

module.exports = {
    sendOrderEmail,
    sendGiftTeaser
}
