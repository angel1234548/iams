# IAMS - Industrial Attachment Management System

A comprehensive web application for managing industrial attachment matching between students and organizations, with ASAS (Academic System for Attachment Selection) integration.

## Features

### Sprint 1 & 2 Implementation

1. **ASAS Course Registration Simulation**
   - Students register for industrial attachment course
   - Captures student information and preferences
   - Automatic IAMS access grant

2. **Role-Based Authentication System**
   - Three user roles: Student, Organization, Coordinator
   - Secure login with role-specific dashboards
   - Organization self-registration

3. **Student Dashboard**
   - View academic profile and registration status
   - Edit and update preferences (locations, industries, project types, interests)
   - View match status and notifications

4. **Organization Dashboard**
   - Manage organization profile
   - Set hosting preferences (required skills, project types, max students, min GPA)
   - View matched students

5. **Coordinator Dashboard**
   - System analytics and statistics
   - Matching engine control
   - Match confirmation/rejection
   - Notification management

6. **Intelligent Matching Engine**
   - Weighted scoring algorithm considering:
     - Skills match (30%)
     - Project types (20%)
     - Location preferences (15%)
     - Industry preferences (15%)
     - GPA requirements (10%)
     - Program preferences (10%)
   - Automatic optimal matching
   - Manual override capability

7. **Email Notification Simulation**
   - Simulated email service for testing
   - Match confirmation notifications
   - Email inbox viewer

## Technology Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database with auto-generated REST APIs)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Installation

1. Clone the repository and ```cd iams```

2. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. ```docker compose build```
4. ```docker compose up```
5. Open at ```http://localhost:8080/``` 

## Default Login Credentials

### Coordinator
- Email: admin@ub.ac.bw
- Password: admin123

### Test Users
- Students and Organizations must register through the application:
  - Students: Use ASAS Registration
  - Organizations: Use Organization Signup from login page

## User Workflows

### For Students

1. Register through ASAS Course Registration
2. Login with registered credentials
3. Update preferences (locations, industries, interests)
4. Wait for coordinator to run matching
5. View match results and notifications

### For Organizations

1. Register through Organization Signup
2. Login with registered credentials
3. Set hosting preferences (skills needed, max students, etc.)
4. Wait for coordinator to run matching
5. View matched students

### For Coordinators

1. Login with provided credentials
2. View system statistics
3. Run matching engine to generate matches
4. Review and confirm/reject/override matches
5. Send notifications to students and organizations
6. Monitor email simulator for sent notifications

## Database Schema

The system uses the following main tables:
- `users` - Base authentication
- `students` - Student profiles
- `student_preferences` - Student matching preferences
- `organizations` - Organization profiles
- `organization_preferences` - Organization hosting preferences
- `coordinators` - Coordinator profiles
- `matches` - Student-organization matches
- `notifications` - Email notifications
- `asas_registrations` - ASAS course registrations

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Users can only access their own data
- Coordinators have elevated permissions for management

## TEAM MEMBERS

//


## Future Enhancements (Sprint 3 & 4)

## License

NOTE::This project is for educational purposes.
