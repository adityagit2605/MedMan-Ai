-- ============================================================
-- Healthcare Appointment Manager — Database Schema (V1)
-- Run against a PostgreSQL 15+ database named "healthcare"
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() if using Postgres < 13
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(255)  NOT NULL,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    password_hash  TEXT          NOT NULL,
    role           VARCHAR(20)   NOT NULL CHECK (role IN ('PATIENT','DOCTOR','ADMIN')),
    phone          VARCHAR(20),
    gcal_refresh_token TEXT,
    refresh_token  TEXT,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── DOCTOR PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialisation        VARCHAR(255) NOT NULL,
    slot_duration_minutes INT          NOT NULL DEFAULT 30,
    bio                   TEXT,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── DOCTOR WORKING HOURS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_working_hours (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    day_of_week INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    UNIQUE (doctor_id, day_of_week)
);

-- ── DOCTOR LEAVES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_leaves (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    leave_date  DATE NOT NULL,
    reason      TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_id, leave_date)
);

-- ── APPOINTMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id           UUID NOT NULL REFERENCES users(id),
    doctor_id            UUID NOT NULL REFERENCES doctor_profiles(id),
    appt_date            DATE NOT NULL,
    start_time           TIME NOT NULL,
    end_time             TIME NOT NULL,
    status               VARCHAR(30) NOT NULL CHECK (
        status IN ('HELD','CONFIRMED','CANCELLED','COMPLETED','LEAVE_CONFLICT','CANCELLED_RESCHEDULED')
    ),
    hold_expires_at      TIMESTAMP,
    gcal_event_id_patient VARCHAR(255),
    gcal_event_id_doctor  VARCHAR(255),
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Partial unique index — the core double-booking guard at DB level
-- Only one HELD or CONFIRMED appointment can exist per (doctor, date, start_time)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_appt_no_double_book
    ON appointments (doctor_id, appt_date, start_time)
    WHERE status IN ('HELD','CONFIRMED');

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date  ON appointments (doctor_id, appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient      ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_status       ON appointments (status);

-- ── SYMPTOM FORMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS symptom_forms (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id   UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    symptoms_raw     TEXT NOT NULL,
    urgency_level    VARCHAR(20) DEFAULT 'PENDING' CHECK (urgency_level IN ('LOW','MEDIUM','HIGH','PENDING')),
    chief_complaint  TEXT,
    suggested_questions JSONB,
    llm_status       VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (llm_status IN ('PENDING','SUCCESS','FAILED')),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── VISIT NOTES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_notes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id   UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    clinical_notes   TEXT NOT NULL,
    patient_summary  TEXT,
    llm_status       VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (llm_status IN ('PENDING','SUCCESS','FAILED')),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── PRESCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_note_id  UUID NOT NULL REFERENCES visit_notes(id) ON DELETE CASCADE,
    medicine_name  VARCHAR(255) NOT NULL,
    dosage         VARCHAR(100) NOT NULL,
    frequency      VARCHAR(50)  NOT NULL,    -- e.g. "1-0-1", "every 8h"
    duration_days  INT          NOT NULL
);

-- ── MEDICATION REMINDERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_reminders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
    retry_count     INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_med_reminder_scheduled ON medication_reminders (scheduled_at, status);

-- ── NOTIFICATIONS (outbox) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    appointment_id  UUID REFERENCES appointments(id),
    type            VARCHAR(50)  NOT NULL CHECK (type IN (
        'BOOKING_CONFIRMATION','REMINDER_24H','CANCELLATION',
        'LEAVE_CONFLICT','MEDICATION_REMINDER','POST_VISIT_SUMMARY'
    )),
    channel         VARCHAR(20)  NOT NULL CHECK (channel IN ('EMAIL','CALENDAR')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','RETRYING')),
    retry_count     INT NOT NULL DEFAULT 0,
    last_error      TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_status ON notifications (status, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_appt   ON notifications (appointment_id);
