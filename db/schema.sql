-- earn.mindwaveja.com — Database Schema
-- PostgreSQL — run once on the earn-db instance

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  phone           TEXT,                        -- for JMD transfer
  -- trust boosters (at least one required at signup, email counts)
  trn             TEXT,                        -- Jamaican TRN
  national_id     TEXT,
  linkedin_url    TEXT,
  facebook_url    TEXT,
  instagram_url   TEXT,
  -- tier: bronze | silver | gold | diamond
  tier            TEXT NOT NULL DEFAULT 'bronze',
  accuracy_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
  jobs_completed  INTEGER NOT NULL DEFAULT 0,
  -- daily cap enforcement for new users
  daily_job_count INTEGER NOT NULL DEFAULT 0,
  daily_reset_at  TIMESTAMPTZ,
  -- preferences
  ts_display      TEXT NOT NULL DEFAULT 'inline',   -- inline | margin | hidden
  ts_format       TEXT NOT NULL DEFAULT 'short',    -- short [0:04] | long [0:04.2]
  -- standings opt-in
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── JOBS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  video_url       TEXT NOT NULL,               -- YouTube / TikTok / IG link
  platform        TEXT NOT NULL,               -- youtube | tiktok | instagram | other
  duration_secs   INTEGER NOT NULL,
  -- pay tier derived from duration but stored for history
  pay_jmd         NUMERIC(10,2) NOT NULL,
  reward_type     TEXT NOT NULL DEFAULT 'cash', -- cash | voucher | gift_code
  reward_detail   TEXT,                        -- e.g. "KFC Meal Voucher" or "Amazon Gift Card"
  -- addon rewards for long videos
  addon_enabled   BOOLEAN NOT NULL DEFAULT false,
  addon_type      TEXT,                        -- user_choice | choice_plus_random
  language_tags   TEXT[] NOT NULL DEFAULT '{}', -- ['patois','english']
  -- topic: how jobs are grouped on the board
  topic           TEXT NOT NULL DEFAULT 'general',
  -- priority: 1=high (rare/critical for dataset), 2=medium, 3=low
  priority        INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  -- status: available | claimed | submitted | grading | approved | rejected | paid
  status          TEXT NOT NULL DEFAULT 'available',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CLAIMS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  claimed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,        -- claimed_at + 24h or 48h
  submitted_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active', -- active | submitted | expired | abandoned
  UNIQUE(job_id, user_id)
);

-- ─── SUBMISSIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id        UUID NOT NULL REFERENCES claims(id),
  job_id          UUID NOT NULL REFERENCES jobs(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  -- transcript stored as structured JSON segments for STT integration
  -- shape: [{ ts_start: "0:04", ts_end: "0:08", speaker: "Deego", text: "...", gaps: [4.2] }]
  transcript      JSONB NOT NULL DEFAULT '[]',
  -- raw text for quick grader view
  transcript_text TEXT,
  participants    JSONB NOT NULL DEFAULT '[]',  -- [{ name: "Deego" }, { name: "Woman on left" }]
  events          JSONB NOT NULL DEFAULT '[]',  -- [{ label: "laughter" }, { label: "bottle dropped" }]
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- grading
  grader_id       UUID REFERENCES users(id),
  quality_score   INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  grader_notes    TEXT,
  graded_at       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending' -- pending | approved | rejected
);

-- ─── RATINGS ─────────────────────────────────────────────────────────────────
-- Materialised per-submission rating snapshot
CREATE TABLE IF NOT EXISTS ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  submission_id   UUID NOT NULL REFERENCES submissions(id),
  quality_score   INTEGER NOT NULL,            -- 0–100 from grader
  speed_score     INTEGER NOT NULL,            -- 0–100 based on submission time vs claim window
  composite_score INTEGER NOT NULL,            -- weighted average
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  submission_id   UUID NOT NULL REFERENCES submissions(id),
  amount_jmd      NUMERIC(10,2) NOT NULL,
  reward_type     TEXT NOT NULL,               -- cash | voucher | gift_code
  reward_detail   TEXT,
  proof_sent_at   TIMESTAMPTZ,
  proof_email     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | sent | confirmed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_topic ON jobs(topic);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_job ON claims(job_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_grader ON submissions(grader_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
