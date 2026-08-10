import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  return '₹' + Number(n).toLocaleString('en-IN')
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const LUXURY_NOTES: Array<(name: string) => string> = [
  (name) => `Dear ${name},<br><br>A timepiece is never merely an object — it is a declaration. The watch you have chosen today speaks before you do, and it will continue speaking long after the moment has passed. At WatchEase, we do not simply ship watches. We deliver a piece of someone's legacy.<br><br>We are deeply honoured that you chose us for yours.`,
  (name) => `Dear ${name},<br><br>Great taste is rarely accidental. The piece you have selected carries with it decades of horological tradition and the quiet confidence of those who understand that true luxury never announces itself — it simply is.<br><br>Welcome to that circle. We are glad you are here.`,
  (name) => `Dear ${name},<br><br>Some purchases are transactions. This one is different. You have chosen a companion that will mark your milestones, outlast trends, and grow more meaningful with every passing year.<br><br>We crafted it for someone exactly like you. Wear it well.`,
  (name) => `Dear ${name},<br><br>The finest things in life are not rushed. Your timepiece has been prepared with the same patience and precision that went into engineering every component within it. It is on its way — and we promise, it has been worth the wait.<br><br>Thank you for your trust.`,
  (name) => `Dear ${name},<br><br>At WatchEase, we hold a firm belief: a watch is the one accessory a person never truly takes off. It becomes part of how the world reads you. That is why we hold every single order to an impossibly high standard.<br><br>Yours is no exception. We hope it exceeds every expectation.`,
  (name) => `Dear ${name},<br><br>There is a reason the world's most accomplished people wear exceptional watches. It is not vanity — it is the quiet acknowledgement that time is the only currency that truly matters, and how you carry it says everything.<br><br>You have chosen to carry it beautifully.`,
  (name) => `Dear ${name},<br><br>Luxury is not about price. It is about the feeling of holding something that was made with absolute intention — where every detail was deliberate, every finish considered, every second of engineering time justified.<br><br>That is what you hold now. We hope you feel it the moment it arrives.`,
]

function getLuxuryNote(userName: string, orderId: string): string {
  const idx = orderId.charCodeAt(orderId.length - 1) % LUXURY_NOTES.length
  return LUXURY_NOTES[idx](userName)
}

const SUBJECT_LINES: Array<(name: string, ref: string) => string> = [
  (name, ref) => `${name}, your WatchEase order #${ref} is confirmed`,
  (name, ref) => `Your timepiece is on its way, ${name} — Order #${ref}`,
  (name, ref) => `Order #${ref} confirmed — thank you, ${name}`,
  (name, ref) => `${name} — your WatchEase collection is being prepared (#${ref})`,
  (name, ref) => `It's official, ${name}. Order #${ref} is in motion.`,
]

function getSubjectLine(userName: string, orderId: string): string {
  const ref = orderId.slice(0, 8).toUpperCase()
  const idx = orderId.charCodeAt(0) % SUBJECT_LINES.length
  return SUBJECT_LINES[idx](userName, ref)
}

function buildEmailHTML(order: any, items: any[], userName: string): string {
  const orderDate    = new Date(order.created_at)
  const deliveryDate = new Date(orderDate)
  deliveryDate.setDate(deliveryDate.getDate() + 7)

  const subtotal   = Number(order.total_amount)
  const tax        = Math.round(subtotal * 0.05)
  const grandTotal = subtotal + tax
  const orderRef   = order.id.slice(0, 8).toUpperCase()
  const luxuryNote = getLuxuryNote(userName, order.id)

  const itemRows = items.map((item: any) => `
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
      <div style="font-family:'Georgia',Georgia,serif;font-size:36px;font-style:italic;color:#ffffff;letter-spacing:2px;line-height:1;font-weight:normal;">WatchEase</div>
      <div style="font-size:9px;letter-spacing:6px;text-transform:uppercase;color:rgba(229,179,163,0.5);margin-top:10px;">Timeless Elegance</div>
    </td>
  </tr>

  <tr>
    <td style="background:#1a1410;padding:44px 48px 40px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
      <div style="display:inline-block;margin-bottom:24px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:rgba(229,179,163,0.1);border:1px solid rgba(229,179,163,0.3);border-radius:20px;padding:6px 18px;">
            <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e5b3a3;">Order Confirmed</span>
          </td>
        </tr></table>
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
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
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
      </tr></table>
    </td>
  </tr>

  <tr>
    <td style="background:#0f0f0f;padding:36px 48px 0;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:4px;color:rgba(229,179,163,0.5);">Your Collection</div>
      <div style="height:1px;background:rgba(229,179,163,0.15);margin:16px 0 0;"></div>
    </td>
  </tr>
  <tr>
    <td style="background:#0f0f0f;padding:0 48px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
      <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
    </td>
  </tr>

  <tr>
    <td style="background:#0f0f0f;padding:0 48px 36px;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
        <tr>
          <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.28);">Subtotal</td>
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
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.25);margin-bottom:6px;">Estimated Arrival</div>
          <div style="font-family:'Georgia',Georgia,serif;font-size:20px;color:#ffffff;font-style:italic;">${formatDate(deliveryDate)}</div>
        </td>
        <td style="vertical-align:middle;text-align:right;">
          <div style="font-size:10px;color:rgba(255,255,255,0.22);letter-spacing:0.5px;line-height:1.8;">5–7 business days<br>Standard delivery</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr>
    <td style="background:#0a0a0a;border-radius:0 0 4px 4px;padding:36px 48px 40px;text-align:center;border-top:2px solid #e5b3a3;border-left:1px solid rgba(229,179,163,0.12);border-right:1px solid rgba(229,179,163,0.12);border-bottom:1px solid rgba(229,179,163,0.12);">
      <div style="font-size:11px;color:rgba(255,255,255,0.2);line-height:2.2;">
        <a href="mailto:watchease.lux@gmail.com" style="color:rgba(229,179,163,0.45);text-decoration:none;">watchease.lux@gmail.com</a>
        &nbsp;&nbsp;·&nbsp;&nbsp;Vasna Rd, Ahmedabad, Gujarat
      </div>
      <div style="margin-top:18px;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.1);">WatchEase © 2026</div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, userEmail, userName } = await req.json()

    if (!orderId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing orderId or userEmail' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data: order, error: orderError } = await supabase
      .from('orders').select('*').eq('id', orderId).single()

    if (orderError || !order) throw new Error('Order not found')

    const { data: items, error: itemsError } = await supabase
      .from('order_items').select('*').eq('order_id', orderId)

    if (itemsError) throw new Error('Could not fetch order items')

    const name    = userName || 'Valued Customer'
    const html    = buildEmailHTML(order, items, name)
    const subject = getSubjectLine(name, order.id)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WatchEase <onboarding@resend.dev>',
        to: [userEmail],
        subject,
        html,
      }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) throw new Error(resendData.message || 'Resend API error')

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('send-order-email error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
