import express from 'express';
const router = express.Router();

router.get('/',async (req,res) =>{
    const {status, msg} = req.query
    res.redirect(`../view/error_page.html?status=${status}&msg=${encodeURIComponent(msg)}`);
});

export default router;