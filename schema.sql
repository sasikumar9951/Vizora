-- ─────────────────────────────────────────────────────────────────────────────
-- VIZORA 2026 — Neon PostgreSQL Schema
-- Run this once in your Neon SQL Editor (neon.tech → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registrations (
  id           SERIAL PRIMARY KEY,
  team_name    VARCHAR(120) NOT NULL,
  college_name VARCHAR(200) NOT NULL,
  dept_name    VARCHAR(150) NOT NULL,

  m1_name      VARCHAR(120) NOT NULL,
  m1_phone     VARCHAR(20)  NOT NULL,
  m1_email     VARCHAR(150) NOT NULL,

  m2_name      VARCHAR(120) NOT NULL,
  m2_phone     VARCHAR(20)  NOT NULL,
  m2_email     VARCHAR(150) NOT NULL,

  demo_link    TEXT         NOT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Optional: index for faster searches
CREATE INDEX IF NOT EXISTS idx_college ON registrations (college_name);
CREATE INDEX IF NOT EXISTS idx_created ON registrations (created_at DESC);
