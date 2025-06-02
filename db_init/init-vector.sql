-- db_init/init-vector.sql

-- 1) Enable pgvector extension (if not already present)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Create the tasks table if it doesn’t exist
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  status      TEXT NOT NULL,
  embedding   VECTOR(384)  -- 384 dims for all-MiniLM-L6-v2
);
