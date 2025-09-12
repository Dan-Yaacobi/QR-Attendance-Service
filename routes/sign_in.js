import express from 'express';
import { findCourseById , createUser} from '../db.js';
import { checkIn}  from '../utilities/check_in.js';
import { findParticipant } from '../utilities/googlesheets.js';

const router = express.Router();

router.get('/', async (req,res,next) => {
    const course_id = req.query.course_id
    console.log(course_id)
    if(!course_id){
      const error = new Error("Invalid Course ID")
      error.status = 400
      return next(error)
    }
    res.redirect(`/sign_in.html?course_id=${encodeURIComponent(course_id)}`)
});

router.post('/', async (req, res, next) => {
  console.log("posting")
  try {
    const courseId = req.query.course_id ?? req.body.course_id;
    if(!findCourseById(courseId)){
        const error = new Error("Invalid Course ID")
        error.status = 400
        return next(error)
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
        const error = new Error("Phone number is incorrect")
        error.status = 403
        return next(error)
      }
    }

  }
  catch (err) {
    const error = new Error(err.message)
    error.status = err.code
    next(error)
    // const message = "" 
    // const status = ""
    // if (err.code === '23505') { //UNIQUE VIOLATION POSTGRES ERROR
    //   message = 'User already exists'
    //   status = 409
    // }
    // else if (err.code === '23502') { //NULL VIOLATION POSTGRES ERROR
    //   message = 'Phone is required';
    //   status = 400;
    // }
    // else {
    //   message = 'Internal server error' ;
    //   status = 500
    // }

  }
});

export default router;