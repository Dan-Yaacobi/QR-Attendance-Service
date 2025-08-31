CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;    -- case-insensitive email

-- People
CREATE TABLE users (
  user_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT,
  last_name      TEXT,
  phone          TEXT UNIQUE NOT NULL,
  email          CITEXT UNIQUE,
  sign_in_times  DATE[] NOT NULL DEFAULT '{}',  -- array of sign-in dates
  created_at     DATE NOT NULL DEFAULT current_date
);

-- Device/browser token stored in localStorage
CREATE TABLE device_ids (
  device_uuid    UUID PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  first_seen_at  DATE NOT NULL DEFAULT current_date,
  last_seen_at   DATE NOT NULL DEFAULT current_date
);
CREATE INDEX device_ids_user_idx ON device_ids (user_id);

-- Courses (static metadata)
CREATE TABLE courses (
  course_id      TEXT PRIMARY KEY,
  title          TEXT
);

-- Class dates per course
CREATE TABLE course_dates (
  course_id      TEXT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  class_date     DATE NOT NULL,
  PRIMARY KEY (course_id, class_date)
);

-- Attendance
CREATE TABLE attendance (
  attendance_id  BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id      TEXT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  signed_at      DATE NOT NULL DEFAULT current_date
);

-- Prevent duplicates: 1 check-in per user per course per date
CREATE UNIQUE INDEX uniq_att_user_course_day
  ON attendance (user_id, course_id, signed_at);
