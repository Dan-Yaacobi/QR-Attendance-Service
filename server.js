import 'dotenv/config'
import session from 'express-session'
import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'
import {sendEmail} from './utilities/mailer.js'
import { createUser} from './db.js'

// __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))
app.use(session({
  secret: process.env.SESSION_CODE,
  resave: false,
  saveUninitialized: false
}))
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const time = new Date().toISOString()
  console.log(`[${time}] ${req.method} ${req.url}`)
  next()
})

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'qr_page.html'))
})

app.get('/login', (req,res) => {
  res.sendFile(path.join(__dirname, 'view','login.html'))
});

app.get('/sign_in_success',(req,res) => {
res.sendFile(path.join(__dirname, 'view', 'sign_in_success.html'))
});

app.post('/login', async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const {userId, deviceId} = await createUser(firstName, lastName, phone, email);
    console.log(deviceId)
    res.redirect('/sign_in_success')
    // res.json({ ok: true, userId });
  }
  catch (err) {
    if (err.code === '23505') { //UNIQUE VIOLATION POSTGRES ERROR
      res.status(409).json({ ok: false, error: 'User already exists' });
    }
    else if (err.code === '23502') { //NULL VIOLATION POSTGRES ERROR
      res.status(400).json({ ok: false, error: 'Phone is required' });
    }
    else {
      console.error(err);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  }
});

app.post('/login_failed', async (req,res) =>{
  
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
