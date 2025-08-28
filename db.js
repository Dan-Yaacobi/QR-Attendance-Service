import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bugtracker',
  password: process.env.DB_PASS,
  port: 5432,
});

export async function createUser(phone, email, first_name, last_name) {
  const sql = `
    INSERT INTO users (phone, email, first_name, last_name)
    VALUES ($1, LOWER($2), $3, $4)
    RETURNING user_id;
  `;
  const { rows } = await pool.query(sql, [phone, email, first_name, last_name]);
  return rows[0].user_id;
}


export async function getUserById(user_id){

}