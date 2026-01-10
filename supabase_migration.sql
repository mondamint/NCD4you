-- NCDs 4YOU Database Migration for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension (optional, if you want to use UUIDs in future)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (use with caution in production!)
-- DROP TABLE IF EXISTS home_opd CASCADE;
-- DROP TABLE IF EXISTS appointments CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plain_password VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'hospital', 'hc')),
    location_name VARCHAR(255),
    name VARCHAR(255),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    hn VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cid VARCHAR(13) UNIQUE NOT NULL,
    phone VARCHAR(50),
    medical_rights VARCHAR(255),
    clinic VARCHAR(255),
    house_no VARCHAR(100),
    moo VARCHAR(50),
    tumbol VARCHAR(100),
    amphoe VARCHAR(100),
    province VARCHAR(100),
    color VARCHAR(50),
    created_at DATE,
    hc_zone VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_hn ON patients(hn);
CREATE INDEX idx_patients_cid ON patients(cid);
CREATE INDEX idx_patients_hc_zone ON patients(hc_zone);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    bp_sys INTEGER,
    bp_dia INTEGER,
    bp_sys_2 INTEGER,
    bp_dia_2 INTEGER,
    blood_sugar INTEGER,
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'referred_back')),
    refer_back_note TEXT,
    req_bp BOOLEAN DEFAULT FALSE,
    req_bs BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Home OPD Table
CREATE TABLE IF NOT EXISTS home_opd (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    cid VARCHAR(13),
    name VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('patient', 'osm')),
    note TEXT,
    source VARCHAR(50) CHECK (source IN ('hospital', 'hc')),
    location VARCHAR(255),
    created_at VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_home_opd_patient_id ON home_opd(patient_id);
CREATE INDEX idx_home_opd_cid ON home_opd(cid);
CREATE INDEX idx_home_opd_location ON home_opd(location);

-- Create a default admin user
-- Password is 'admin123' (you should change this immediately after first login)
INSERT INTO users (username, password_hash, plain_password, role, name, position)
VALUES (
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzVJvBBCGu', -- bcrypt hash of 'admin123'
    'admin123',
    'admin',
    'System Administrator',
    'Admin'
) ON CONFLICT (username) DO NOTHING;

-- Optional: Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_opd_updated_at BEFORE UPDATE ON home_opd
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE home_opd ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (customize based on your security needs)
-- Example: Allow all operations for now (you can restrict later)
-- CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON patients FOR ALL USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON appointments FOR ALL USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON home_opd FOR ALL USING (true);

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
