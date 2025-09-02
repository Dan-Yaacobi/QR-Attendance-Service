import jwt from 'jsonwebtoken'

const TTL = Number(process.env.QR_TOKEN_TTL_SECONDS || 900)

export function issueCourseToken(courseId) {
  return jwt.sign({ courseId, typ: 'course' }, process.env.SESSION_SECRET, { expiresIn: TTL })
}

export function verifyCourseToken(token) {
  try {
    const payload = jwt.verify(token, process.env.SESSION_SECRET)
    if (payload.typ !== 'course') return null
    return payload
  } catch { return null }
}
