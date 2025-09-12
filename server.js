import 'dotenv/config'
import session from 'express-session'
import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'
import {sendEmail} from './utilities/mailer.js'
import { createUser, getUserIdByDevice, getUserPhoneById, getUserNameByUserId, findCourseById} from './db.js'
import { Pool } from 'pg';
import { findParticipant, markParticipant } from './utilities/googlesheets.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/error.js'
import sign_in from './routes/sign_in.js';

// __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('view'))
app.use(session({
  secret: process.env.SESSION_CODE,
  resave: false,
  saveUninitialized: false
}))
app.use(express.urlencoded({ extended: true }));
app.use(logger)

app.use('/api/sign_in', sign_in)

// Routes
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


//Error handler
app.use((req,res,next)=>{
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
})
app.use(errorHandler);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
