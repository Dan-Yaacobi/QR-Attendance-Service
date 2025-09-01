import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: 'attendance_db',
  password: process.env.DB_PASS,
  port: 5432,
});

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

export async function getUserById(user_id, opts ={}){
  const client = opts.client || pool
 try {
    const { rows } = await client.query(
      `
      SELECT user_id, first_name, last_name, phone, email, sign_in_times, created_at
      FROM users
      WHERE user_id = $1::uuid
      LIMIT 1
      `,
      [userId]
    );

    return rows[0] ?? null; // null = not found
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
