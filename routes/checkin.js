import express from 'express'
import { verifyCourseToken } from '../utilities/tokens.js'
import { isTodayCourseDate, insertAttendanceIfNew, createUser, getUserByPhone } from '../db/flows.js'
import { findParticipant } from '../utilities/sheets.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { course_id, token, phone, device_id } = req.body
  if (!course_id || !token) return res.status(400).json({ error: 'course_id and token required' })
  const payload = verifyCourseToken(token)
  if (!payload || payload.courseId !== course_id) return res.status(401).json({ error: 'invalid token' })

  const validDate = await isTodayCourseDate(course_id)
  if (!validDate) return res.status(403).json({ error: 'No session today' })

  // Fast path by device_id (if you already linked device earlier)
  if (device_id) {
    const ok = await insertAttendanceIfNew({ course_id, device_id })
    return res.json(ok ? { ok: true, mode: 'device' } : { ok: false, reason: 'duplicate_or_bad_device' })
  }

  // Reauth by phone (Google Sheets whitelist)
  if (!phone) return res.status(400).json({ error: 'phone required when no device_id' })
  let user = await getUserByPhone(phone)
  if (!user) {
    const row = await findParticipant(course_id, phone) // from Google Sheets
    if (!row) return res.status(403).json({ error: 'Not registered for this course (check phone)' })
    user = await createUser(row.firstName, row.lastName, phone, row.email)
  }

  const ok = await insertAttendanceIfNew({ course_id, user_id: user.user_id })
  res.json(ok ? { ok: true, mode: 'phone' } : { ok: false, reason: 'duplicate' })
})

export default router
