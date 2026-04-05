-- Seed Data for IAMS System
-- This file contains initial data for testing the system

-- Insert a default coordinator
INSERT INTO users (id, email, password, role, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'coordinator@university.edu', 'admin123', 'coordinator', now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO coordinators (id, coord_id, full_name, department, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'COORD001', 'Dr. Jane Smith', 'Computer Science', now())
ON CONFLICT (id) DO NOTHING;

-- Note: Students and Organizations should register through the application UI
-- Students: Use ASAS Registration
-- Organizations: Use Organization Signup
