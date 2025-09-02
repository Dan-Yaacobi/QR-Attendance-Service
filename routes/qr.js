import express from 'express'
import QRCode from 'qrcode'

const router = express.Router()

router.get('/course', async (req, res) => {
  try {
    const { course_id } = req.query
    if (!course_id) return res.status(400).json({ error: 'course_id required' })

    const url = `https://your-landing-page.example/scan?course_id=${encodeURIComponent(course_id)}`
    const png = await QRCode.toBuffer(url, { type: 'png', errorCorrectionLevel: 'M' })

    res.type('png').send(png)
  } 
  catch (err){
    console.error(err)
    res.status(500).json({ error: 'QR generation failed' })
  }
});

export default router
