import { Router } from 'express'
import { query } from '../config/db.js'
import { sendConfirmationEmail } from '../services/email.js'

export const router = Router()

// Parse body for JSON check-ins
router.post('/checkin', async (req, res, next) => {
  try {
    const { course_id, participant_uuid, session_date } = req.body || {}
    if (!course_id || !participant_uuid || !session_date) {
      return res.status(400).json({ error: 'course_id, participant_uuid, session_date required' })
    }
    // Upsert participant (demo: phone/email omitted)
    await query(`INSERT INTO participants (uuid) VALUES ($1) ON CONFLICT (uuid) DO NOTHING`, [participant_uuid])
    // Ensure course exists (demo)
    await query(`INSERT INTO courses (id, title) VALUES ($1, $1) ON CONFLICT (id) DO NOTHING`, [course_id])
    // Ensure session exists (demo)
    await query(`INSERT INTO sessions (course_id, session_date) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [course_id, session_date])
    // Prevent double check-in
    const existing = await query(`SELECT 1 FROM attendance WHERE course_id=$1 AND participant_uuid=$2 AND session_date=$3`, [course_id, participant_uuid, session_date])
    if (existing.rowCount > 0) return res.status(200).json({ ok: true, duplicate: true })

    await query(`INSERT INTO attendance (course_id, participant_uuid, session_date) VALUES ($1, $2, $3)`, [course_id, participant_uuid, session_date])

    // demo email (replace with real recipient)
    try {
      await sendConfirmationEmail({
        to: 'recipient@example.com',
        text: `Checked in to ${course_id} on ${session_date} (uuid=${participant_uuid})`
      })
    } catch (e) {
      // Don't fail the request if email fails
      console.warn('email error', e.message)
    }

    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Simple GET variant using query param ?data=
router.get('/checkin', async (req, res, next) => {
  try {
    const blob = req.query.data
    if (!blob) return res.status(400).json({ error: 'missing data param' })
    const { courseId, token } = JSON.parse(blob)
    // In a real app, validate token & date, then redirect to UI
    res.json({ ok: true, courseId, token })
  } catch (e) { next(e) }
})
