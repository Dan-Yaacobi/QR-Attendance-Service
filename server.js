import 'dotenv/config'
import session from 'express-session'
import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'

// import { getAllReports, saveReport, deleteReport } from './db.js'
import {sendEmail} from './utilities/mailer.js'

// __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))
app.use(session({
  secret: process.env.SESSION_CODE,
  resave: false,
  saveUninitialized: false
}))
app.use((req, res, next) => {
  const time = new Date().toISOString()
  console.log(`[${time}] ${req.method} ${req.url}`)
  next()
})

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'qr_page.html'))
})

// Example usage of DB + email
app.post('/reports', async (req, res) => {
  try {
    const { text } = req.body
    await saveReport(text)
    await sendEmail('admin@example.com', 'New report', text)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
