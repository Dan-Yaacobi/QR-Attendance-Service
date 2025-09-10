import 'dotenv/config'
import session from 'express-session'
import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'

import {sendEmail} from './utilities/mailer.js'
import { createUser, getUserIdByDevice, getUserPhoneById, getUserNameByUserId, findCourseById} from './db.js'
import { Pool } from 'pg';
import qrRouter from './routes/qr.js'
import { findParticipant, markParticipant } from './utilities/googlesheets.js'

// __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('view'))
app.use(express.static('first_page'))
app.use(session({
  secret: process.env.SESSION_CODE,
  resave: false,
  saveUninitialized: false
}))

app.use(express.urlencoded({ extended: true }));
app.use('/api/qr', qrRouter);
app.use(express.static(path.join(__dirname, "view")));
app.use((req, res, next) => {
  const time = new Date().toISOString()
  console.log(`[${time}] ${req.method} ${req.url}`)
  next()
})

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'first_page', 'reroute.html'))
})

  app.get('/sign_in', (req,res) => {
    res.sendFile(path.join(__dirname, 'view','sign_in.html'))
  });


app.get('/admin', (req,res) => {
  res.sendFile(path.join(__dirname, 'view', 'admin.html'))
})

app.get('/sign_in_success', (req,res) => {
    res.sendFile(path.join(__dirname, 'view', 'sign_in_success.html'))

})
app.get('/sign_in_failed', (req,res) =>{
  res.sendFile(path.join(__dirname, 'view', 'sign_in_failed.html'))

})
app.post('/api/check_in', async (req,res)=>{
  try{
    const { deviceId, courseId } = req.body ?? {};
    if(!findCourseById(courseId)){
      res.redirect("/view/sign_in_failed")
    }
    else{
      if (!deviceId){
        res.redirect("/view/sign_in.html?course_id="+encodeURIComponent(courseId))
      }
      else{
        const {name, ok} = await checkIn(courseId,deviceId)
        if(name && ok){
          res.redirect(`/sign_in_success?name=${encodeURIComponent(name)}`)
        }
        else{
          res.redirect("/view/sign_in_failed")
        }
      }
    }
  }
  catch(err){
    console.error(err);
  }
})


async function checkIn(courseId, deviceId){
  try{
    const userId = await getUserIdByDevice(deviceId)
    if(!userId){ // device ID does not match any user id

    }
    const userPhone = await getUserPhoneById(userId)
    const row = await findParticipant(courseId,userPhone)
    const mark = await markParticipant(row,courseId)
    if (mark == 0){
          const name = await getUserNameByUserId(userId)
          return {name: name, ok: true}
    }
    else if(mark == 1){
      return {name: 1, ok : false}
    }
    else{
          return {name: null, ok: false}
    }
  }
  catch(err){
    console.error(err)
    return {name: null, ok: false}
  }
}

//this is reached via scanning the login
app.post('/sign_in', async (req, res) => {
  try {
    const courseId = req.query.course_id ?? req.body.course_id;
    if(!findCourseById(courseId)){
      res.redirect("/view/sign_in_failed")
    }
      else{
      const { firstName, lastName, phone, email } = req.body;
      if(await findParticipant(courseId, phone)){
        const {userId, deviceId} = await createUser(firstName, lastName, phone, email); // creates user in the DB as well as a device id which connects to it
        const {name, ok} = await checkIn(courseId,deviceId)
        
        if(userId && ok){
          res.redirect(`/sign_in_success?id=${encodeURIComponent(deviceId)}&name=${encodeURIComponent(name)}`);
        }
        else if(name == 1 && !ok){
          res.redirect("/view/sign_in_failed")
        }
      }
      else{
        res.redirect("/view/sign_in_failed")
      }
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
