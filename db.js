import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: 'attendance_db',
  password: process.env.DB_PASS,
  port: 5432,
});

export async function generateQrsForToday(actor = 'server') {
  const BASE_URL = process.env.PUBLIC_BASE_URL;
  const JWT_SECRET = process.env.JWT_SECRET;
  const OUT_DIR = process.env.QR_OUTPUT_DIR || './qrs';

  if (!BASE_URL || !JWT_SECRET) throw new Error('Missing PUBLIC_BASE_URL or JWT_SECRET');
  await fs.mkdir(OUT_DIR, { recursive: true });

  const client = await pool.connect();
  const results = [];
  try {
    const { rows: sessions } = await client.query(
      `SELECT course_id, session_date
       FROM course_sessions
       WHERE session_date = CURRENT_DATE AND status='scheduled'
       ORDER BY course_id`
    );

    for (const s of sessions) {
      const d = new Date(s.session_date).toISOString().slice(0, 10);
      const jti = crypto.randomUUID();

      const token = jwt.sign({ c: s.course_id, d, jti }, JWT_SECRET, { expiresIn: '20h' });

      // persist token if you want to validate later
      await client.query(
        `INSERT INTO qr_tokens(course_id, session_date, jti, token, expires_at, is_active, created_by)
         VALUES ($1,$2,$3,$4, NOW() + interval '20 hours', TRUE, $5)
         ON CONFLICT DO NOTHING`,
        [s.course_id, s.session_date, jti, token, actor]
      );

      const url = `${BASE_URL}/signin?c=${encodeURIComponent(s.course_id)}&d=${d}&t=${encodeURIComponent(token)}`;
      const pngName = `${s.course_id}_${d}.png`;
      const pngPath = `${OUT_DIR}/${pngName}`;

      await QRCode.toFile(pngPath, url, { width: 512, margin: 2 });

      results.push({ course_id: s.course_id, session_date: d, url, png_path: pngPath });
    }
    return results;
  } finally {
    client.release();
  }
}

export async function createUser(first_name, last_name, phone, email) {
  //atomic single query to create both user_id and device_id
  const sql = `
    WITH ins_user AS (
      INSERT INTO users (first_name, last_name, phone, email)
      VALUES ($1, $2, $3, LOWER($4))
      RETURNING user_id
    ),
    ins_dev AS (
      INSERT INTO device_ids (user_id)
      SELECT user_id FROM ins_user
      RETURNING device_uuid, user_id
    )
    SELECT user_id, device_uuid
    FROM ins_dev;
  `;

  const { rows } = await pool.query(sql, [first_name, last_name, phone, email]);
  const { user_id: userId, device_uuid: deviceId } = rows[0];
  return { userId, deviceId };
}

export async function getUserPhoneById(user_id, opts ={}){
  const client = opts.client || pool
 try {
    const sql = `
      SELECT phone
      FROM users
      WHERE user_id = $1::uuid
      LIMIT 1
    `;

    const { rows } = await client.query(sql,[user_id]);
    return rows[0] ? rows[0].phone : null;  
  } 
  catch (err) {
    if (err.code === '22P02') { // invalid input syntax for type uuid
      const e = new Error('Invalid user_id format');
      e.code = 'BAD_REQUEST';
      throw e;
    }
    throw err;
  }
}

export async function getUserByPhone(phone, opts = {}) {
  const client = opts.client || pool
  const p = String(phone ?? '').trim();
  if (!p) {
    const err = new Error('Phone is required');
    err.code = 'BAD_REQUEST';
    throw err;
  }

  const sql = `
    SELECT user_id, first_name, last_name, phone, email, sign_in_times, created_at
    FROM users
    WHERE phone = $1
    LIMIT 1
  `;

  const { rows } = await client.query(sql, [p]);

  return rows[0] ?? null;
}

export async function getUserByEmail(email, opts = {}){
  
}

export async function updateUserPhone(){

}

export async function updateUserEmail(){

}

export async function updateUserName(){

}

export async function appendUserSignInDate(){

}

export async function deleteUser(){

}

export async function getUserIdByDevice(device_uuid, opts = {}) {
  const client = opts.client || pool;

  const sql = `
    SELECT user_id
    FROM device_ids
    WHERE device_uuid = $1::uuid
    LIMIT 1
  `;

  const { rows } = await client.query(sql, [device_uuid]);
  return rows[0] ? rows[0].user_id : null;
}

export async function getUserNameByUserId(userId, opts = {}){
  const client = opts.client || pool;
  const sql = `
    SELECT first_name
    FROM users
    WHERE user_id = $1
  `;
  const { rows } = await client.query(sql, [userId]);
  return rows[0] ? rows[0].first_name : null;
}

export async function linkDeviceToUser(user_id, device_uuid, opts = {}) {
  const client = opts.client || pool;

  const sql = `
    INSERT INTO device_ids (device_uuid, user_id)
    VALUES ($1::uuid, $2::uuid)
    RETURNING device_uuid, user_id
  `;

  const { rows } = await client.query(sql, [device_uuid, user_id]);
  return rows[0]; // { device_uuid, user_id }
}

export async function findCourseById(course_id, opts = {}){
  const client = opts.client || pool;
  const sql = ` 
    SELECT title
    FROM courses
    WHERE course_id = $1
  `;

  const { rows } = await client.query(sql, [course_id]);
  return rows[0] ? rows[0].title : null;
}
