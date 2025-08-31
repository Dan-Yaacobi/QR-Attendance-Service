import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: 'attendance_db',
  password: process.env.DB_PASS,
  port: 5432,
});

export async function createUser(first_name, last_name, phone, email) {
  const sql = `
    INSERT INTO users (first_name, last_name, phone, email)
    VALUES ($1, $2, $3, LOWER($4))
    RETURNING user_id;
  `;
  const { rows } = await pool.query(sql, [first_name, last_name, phone, email]);
  return rows[0].user_id;
}


export async function getUserById(user_id){

}