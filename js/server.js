require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const path    = require('path')
const express = require('express')
const cors    = require('cors')
const { sendOrderEmail, sendGiftTeaser } = require('./email-service')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '..')))

app.post('/api/send-order-email', async (req, res) => {
    const { order, items, userEmail, userName } = req.body
    if (!order || !items || !userEmail) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    try {
        await sendOrderEmail({ order, items, userEmail, userName })
        console.log(`📧 Order email sent via Brevo → ${userEmail}`)
        res.json({ success: true })
    } catch (err) {
        console.error('❌ Order email error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

app.post('/api/send-gift-teaser', async (req, res) => {
    const { recipientName, recipientEmail, senderName } = req.body
    if (!recipientEmail || !recipientName) {
        return res.status(400).json({ error: 'Missing recipient details' })
    }

    try {
        await sendGiftTeaser({ recipientName, recipientEmail, senderName })
        console.log(`🎁 Gift teaser sent via Brevo → ${recipientEmail}`)
        res.json({ success: true })
    } catch (err) {
        console.error('❌ Teaser email error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

app.listen(PORT, () => {
    console.log(`🚀 WatchEase server running at http://localhost:${PORT}`)
})
