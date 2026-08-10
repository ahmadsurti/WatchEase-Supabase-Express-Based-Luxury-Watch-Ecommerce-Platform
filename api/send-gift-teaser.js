const { sendGiftTeaser } = require('../js/email-service')

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { recipientName, recipientEmail, senderName } = req.body || {}

    if (!recipientEmail || !recipientName) {
        return res.status(400).json({ error: 'Missing recipient details' })
    }

    try {
        await sendGiftTeaser({ recipientName, recipientEmail, senderName })
        res.status(200).json({ success: true })
    } catch (err) {
        console.error('❌ Gift teaser email error:', err.message)
        res.status(500).json({ error: err.message })
    }
}
