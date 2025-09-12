import express from 'express';
import { findCourseById } from '../db.js';
const router = express.Router();


router.get('/', async (req,res) =>{
    const { course_id, token} = req.query;
    if(!findCourseById(course_id)){
        res.redirect()
    }
});