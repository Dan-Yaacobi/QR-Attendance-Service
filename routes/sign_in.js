import express from 'express';
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const courseId = req.query.course_id ?? req.body.course_id;
    if(!findCourseById(courseId)){
        const error = new Error("Invalid Course ID")
        error.status = 404
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

export default router;