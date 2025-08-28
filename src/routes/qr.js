import { Router } from 'express'
import { generateCourseQrDataUrl } from '../services/qrService.js'
export const router = Router()

router.get('/test', async (_req, res, next) => {
  try {
    const dataUrl = await generateCourseQrDataUrl({ courseId: 'C001', token: 'demo' })
    res.json({ dataUrl })
  } catch (e) { next(e) }
})
