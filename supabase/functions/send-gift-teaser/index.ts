import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEASER_SUBJECTS: Array<(name: string) => string> = [
  (name) => `${name}, something is on its way to you`,
  (name) => `A surprise is coming your way, ${name}`,
  (name) => `${name} — someone is thinking of you`,
  (name) => `Something special has been sent to you, ${name}`,
]

function getTeaserSubject(recipientName: string): string {
  const idx = recipientName.charCodeAt(0) % TEASER_SUBJECTS.length
  return TEASER_SUBJECTS[idx](recipientName)
}

function buildTeaserHTML(recipientName: string, senderName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Something is coming your way</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Georgia',Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr>
    <td style="padding-bottom:48px;text-align:center;">
      <div style="font-family:'Georgia',Georgia,serif;font-size:42px;font-style:italic;color:#000000;letter-spacing:1px;line-height:1;">WatchEase</div>
      <div style="font-size:10px;letter-spacing:5px;text-transform:uppercase;color:rgba(18,18,18,0.3);margin-top:10px;">Timeless Elegance</div>
    </td>
  </tr>
  <tr><td style="padding-bottom:48px;"><div style="height:1px;background:#e5b3a3;"></div></td></tr>
  <tr>
    <td style="padding-bottom:28px;">
      <div style="font-family:'Georgia',Georgia,serif;font-size:26px;color:#121212;font-style:italic;line-height:1.35;">
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
        "The finest things arrive quietly.<br>Yours is already in motion."
      </div>
      <div style="margin-top:12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e5b3a3;">— WatchEase</div>
    </td>
  </tr>
  <tr><td style="padding-bottom:32px;"><div style="height:1px;background:#e5b3a3;"></div></td></tr>
  <tr>
    <td style="text-align:center;padding-bottom:48px;">
      <div style="font-size:11px;color:rgba(18,18,18,0.25);line-height:2;">
        You're receiving this because someone who cares about you<br>
        chose to send you something through WatchEase.<br><br>
        <a href="mailto:watchease.lux@gmail.com" style="color:#e5b3a3;text-decoration:none;">watchease.lux@gmail.com</a>
      </div>
      <div style="margin-top:20px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(18,18,18,0.15);">WatchEase © 2026</div>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientName, recipientEmail, senderName } = await req.json()

    if (!recipientEmail || !recipientName) {
      return new Response(JSON.stringify({ error: 'Missing recipientEmail or recipientName' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const name    = recipientName || 'there'
    const sender  = senderName    || 'Someone special'
    const subject = getTeaserSubject(name)
    const html    = buildTeaserHTML(name, sender)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WatchEase <onboarding@resend.dev>',
        to: [recipientEmail],
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
    console.error('send-gift-teaser error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
