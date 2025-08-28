import pool from 'pg'

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bugtracker',
  password: process.env.DB_PASS,
  port: 5432
})