/*
  # IAMS (Industrial Attachment Management System) Database Schema
  
  ## Overview
  This migration creates the complete database schema for IAMS + ASAS integration system.
  
  ## 1. New Tables
  
  ### `users` - Base authentication table
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `password` (text) - Hashed password
  - `role` (text) - User role: 'student', 'organization', 'coordinator'
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `students` - Student profile data
  - `id` (uuid, primary key, references users)
  - `student_id` (text, unique) - Student ID from ASAS
  - `full_name` (text) - Student full name
  - `program` (text) - Academic program
  - `year_of_study` (int) - Current year
  - `gpa` (decimal) - Grade point average
  - `skills` (text[]) - Array of skills
  - `asas_registered` (boolean) - Whether registered in ASAS
  - `iams_access` (boolean) - Whether has IAMS access
  
  ### `student_preferences` - Student attachment preferences
  - `id` (uuid, primary key)
  - `student_id` (uuid, references students)
  - `preferred_locations` (text[]) - Preferred work locations
  - `preferred_industries` (text[]) - Industry preferences
  - `project_types` (text[]) - Preferred project types
  - `interests` (text[]) - General interests
  - `updated_at` (timestamptz) - Last update time
  
  ### `organizations` - Organization profiles
  - `id` (uuid, primary key, references users)
  - `org_id` (text, unique) - Organization identifier
  - `organization_name` (text) - Company name
  - `industry` (text) - Industry sector
  - `location` (text) - Physical location
  - `description` (text) - Company description
  - `contact_person` (text) - Contact person name
  - `phone` (text) - Contact phone number
  
  ### `organization_preferences` - Organization hosting preferences
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `required_skills` (text[]) - Skills they look for
  - `project_types` (text[]) - Types of projects offered
  - `max_students` (int) - Maximum students they can host
  - `preferred_programs` (text[]) - Preferred academic programs
  - `min_gpa` (decimal) - Minimum GPA requirement
  - `updated_at` (timestamptz) - Last update time
  
  ### `coordinators` - Coordinator profiles
  - `id` (uuid, primary key, references users)
  - `coord_id` (text, unique) - Coordinator identifier
  - `full_name` (text) - Coordinator name
  - `department` (text) - Department they manage
  
  ### `asas_registrations` - ASAS course registration records
  - `id` (uuid, primary key)
  - `student_id` (uuid, references students)
  - `course_code` (text) - Industrial attachment course code
  - `course_name` (text) - Course name
  - `semester` (text) - Registration semester
  - `academic_year` (text) - Academic year
  - `registration_date` (timestamptz) - When registered
  - `status` (text) - Registration status
  
  ### `matches` - Student-Organization matching results
  - `id` (uuid, primary key)
  - `student_id` (uuid, references students)
  - `organization_id` (uuid, references organizations)
  - `match_score` (decimal) - Calculated match score
  - `algorithm_type` (text) - Algorithm used for matching
  - `status` (text) - Match status: 'pending', 'confirmed', 'rejected'
  - `coordinator_notes` (text) - Manual override notes
  - `created_at` (timestamptz) - Match creation time
  - `confirmed_at` (timestamptz) - Confirmation time
  
  ### `notifications` - Notification queue for email service
  - `id` (uuid, primary key)
  - `recipient_id` (uuid, references users)
  - `recipient_email` (text) - Email address
  - `subject` (text) - Email subject
  - `body` (text) - Email body content
  - `notification_type` (text) - Type: 'match_confirmation', 'system', etc.
  - `status` (text) - Status: 'pending', 'sent', 'failed'
  - `match_id` (uuid, references matches) - Related match if applicable
  - `created_at` (timestamptz) - Notification creation time
  - `sent_at` (timestamptz) - When sent
  
  ## 2. Security
  - Enable RLS on all tables
  - Create policies for authenticated users based on their roles
  - Students can only view/edit their own data
  - Organizations can only view/edit their own data
  - Coordinators have broader access for management
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'organization', 'coordinator')),
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  program text NOT NULL,
  year_of_study int NOT NULL DEFAULT 1,
  gpa decimal(3,2) DEFAULT 0.00,
  skills text[] DEFAULT '{}',
  asas_registered boolean DEFAULT false,
  iams_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create student_preferences table
CREATE TABLE IF NOT EXISTS student_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  preferred_locations text[] DEFAULT '{}',
  preferred_industries text[] DEFAULT '{}',
  project_types text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  org_id text UNIQUE NOT NULL,
  organization_name text NOT NULL,
  industry text NOT NULL,
  location text NOT NULL,
  description text DEFAULT '',
  contact_person text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create organization_preferences table
CREATE TABLE IF NOT EXISTS organization_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  required_skills text[] DEFAULT '{}',
  project_types text[] DEFAULT '{}',
  max_students int DEFAULT 1,
  preferred_programs text[] DEFAULT '{}',
  min_gpa decimal(3,2) DEFAULT 0.00,
  updated_at timestamptz DEFAULT now()
);

-- Create coordinators table
CREATE TABLE IF NOT EXISTS coordinators (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  coord_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  department text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create asas_registrations table
CREATE TABLE IF NOT EXISTS asas_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  course_code text NOT NULL,
  course_name text NOT NULL,
  semester text NOT NULL,
  academic_year text NOT NULL,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'approved', 'completed'))
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  match_score decimal(5,2) DEFAULT 0.00,
  algorithm_type text DEFAULT 'weighted_scoring',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  coordinator_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  notification_type text DEFAULT 'system',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE asas_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for students table
CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Students can update own data"
  ON students FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Coordinators can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- RLS Policies for student_preferences table
CREATE POLICY "Students can view own preferences"
  ON student_preferences FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own preferences"
  ON student_preferences FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own preferences"
  ON student_preferences FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Coordinators can view all student preferences"
  ON student_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- RLS Policies for organizations table
CREATE POLICY "Organizations can view own data"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Organizations can update own data"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Coordinators can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- RLS Policies for organization_preferences table
CREATE POLICY "Organizations can view own preferences"
  ON organization_preferences FOR SELECT
  TO authenticated
  USING (organization_id = auth.uid());

CREATE POLICY "Organizations can insert own preferences"
  ON organization_preferences FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Organizations can update own preferences"
  ON organization_preferences FOR UPDATE
  TO authenticated
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Coordinators can view all organization preferences"
  ON organization_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- RLS Policies for coordinators table
CREATE POLICY "Coordinators can view own data"
  ON coordinators FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for asas_registrations table
CREATE POLICY "Students can view own registrations"
  ON asas_registrations FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
  );

CREATE POLICY "Students can insert own registrations"
  ON asas_registrations FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Coordinators can view all registrations"
  ON asas_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- RLS Policies for matches table
CREATE POLICY "Students can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Organizations can view their matches"
  ON matches FOR SELECT
  TO authenticated
  USING (organization_id = auth.uid());

CREATE POLICY "Coordinators can view all matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinators can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinators can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Coordinators can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinators can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

CREATE POLICY "Coordinators can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'coordinator'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_organizations_org_id ON organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_matches_student_id ON matches(student_id);
CREATE INDEX IF NOT EXISTS idx_matches_organization_id ON matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);