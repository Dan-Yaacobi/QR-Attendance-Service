-- Minimal tables; adapt to your full model later
CREATE TABLE IF NOT EXISTS participants (
  uuid TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  PRIMARY KEY (course_id, session_date)
);

CREATE TABLE IF NOT EXISTS attendance (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  participant_uuid TEXT NOT NULL REFERENCES participants(uuid) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (course_id, participant_uuid, session_date)
);
