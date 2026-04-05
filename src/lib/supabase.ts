import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'student' | 'organization' | 'coordinator';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  program: string;
  year_of_study: number;
  gpa: number;
  skills: string[];
  asas_registered: boolean;
  iams_access: boolean;
}

export interface StudentPreferences {
  id: string;
  student_id: string;
  preferred_locations: string[];
  preferred_industries: string[];
  project_types: string[];
  interests: string[];
  updated_at: string;
}

export interface Organization {
  id: string;
  org_id: string;
  organization_name: string;
  industry: string;
  location: string;
  description: string;
  contact_person: string;
  phone: string;
}

export interface OrganizationPreferences {
  id: string;
  organization_id: string;
  required_skills: string[];
  project_types: string[];
  max_students: number;
  preferred_programs: string[];
  min_gpa: number;
  updated_at: string;
}

export interface Coordinator {
  id: string;
  coord_id: string;
  full_name: string;
  department: string;
}

export interface Match {
  id: string;
  student_id: string;
  organization_id: string;
  match_score: number;
  algorithm_type: string;
  status: 'pending' | 'confirmed' | 'rejected';
  coordinator_notes: string;
  created_at: string;
  confirmed_at?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  notification_type: string;
  status: 'pending' | 'sent' | 'failed';
  match_id?: string;
  created_at: string;
  sent_at?: string;
}

export interface ASASRegistration {
  id: string;
  student_id: string;
  course_code: string;
  course_name: string;
  semester: string;
  academic_year: string;
  registration_date: string;
  status: 'registered' | 'approved' | 'completed';
}
