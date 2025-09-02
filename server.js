import 'dotenv/config'
import session from 'express-session'
import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'

import {sendEmail} from './utilities/mailer.js'
import { createUser, getUserIdByDevice, getUserPhoneById} from './db.js'
import { Pool } from 'pg';
import qrRouter from './routes/qr.js'
import { findParticipant } from './utilities/googlesheets.js'

import { saveDeviceId, findDeviceId } from './utilities/device_id_storage.js'
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
app.use('/api/qr', qrRouter);

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

app.get('/admin', (req,res) => {
  res.sendFile(path.join(__dirname, 'view', 'admin.html'))
})

//this is reached via scanning the QR
app.post('/sign_in', async (req, res) => {
  try {
    const courseId = req.params.course_id;
    if (await findDeviceId()){

      const user_id = await getUserIdByDevice()
      if (user_id){ // user device_id is found in the DB
        const user_phone = await getUserPhoneById(user_id) // this will never be NULL because of DB constraint
        const [row,marked] = await findParticipant(courseId,user_phone)
        if (marked){
          console.log("check in success")
        }
        else{
          console.log("check in failed")
        }
      }
      else{ // the scenario where there exist a device_id in the user's web local storage but it doesn't match any user_id

      }
    }
    else{
    // get paramaters
    const { firstName, lastName, phone, email } = req.body;
    const [row,marked] = await findParticipant(courseId,phone)
    if (row){
      const {userId, deviceId} = await createUser(firstName, lastName, phone, email);
      
      saveDeviceId(deviceId)
      console.log("Success")
      res.redirect('/sign_in_success')

    }
    else{
      console.log("Participant not found")
      res.redirect('/sign_in_failed')

    }
    // res.json({ ok: true, userId });
    }

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

app.get('/sign_in_failed', async (req,res) =>{
  res.sendFile(path.join(__dirname, 'view', 'sign_in_failed.html'))
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
