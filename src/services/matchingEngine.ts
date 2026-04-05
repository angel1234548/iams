import { supabase } from '../lib/supabase';

interface StudentData {
  id: string;
  student_id: string;
  full_name: string;
  program: string;
  year_of_study: number;
  gpa: number;
  skills: string[];
  preferences: {
    preferred_locations: string[];
    preferred_industries: string[];
    project_types: string[];
    interests: string[];
  };
}

interface OrganizationData {
  id: string;
  org_id: string;
  organization_name: string;
  industry: string;
  location: string;
  preferences: {
    required_skills: string[];
    project_types: string[];
    max_students: number;
    preferred_programs: string[];
    min_gpa: number;
  };
}

interface MatchResult {
  student_id: string;
  organization_id: string;
  match_score: number;
  breakdown: {
    skills_score: number;
    location_score: number;
    industry_score: number;
    project_type_score: number;
    gpa_score: number;
    program_score: number;
  };
}

export class MatchingEngine {
  private weights = {
    skills: 0.30,
    location: 0.15,
    industry: 0.15,
    project_type: 0.20,
    gpa: 0.10,
    program: 0.10,
  };

  async fetchStudentData(): Promise<StudentData[]> {
    const { data: students } = await supabase
      .from('students')
      .select('*, student_preferences(*)')
      .eq('iams_access', true);

    if (!students) return [];

    return students.map((student) => ({
      id: student.id,
      student_id: student.student_id,
      full_name: student.full_name,
      program: student.program,
      year_of_study: student.year_of_study,
      gpa: student.gpa,
      skills: student.skills,
      preferences: {
        preferred_locations: student.student_preferences[0]?.preferred_locations || [],
        preferred_industries: student.student_preferences[0]?.preferred_industries || [],
        project_types: student.student_preferences[0]?.project_types || [],
        interests: student.student_preferences[0]?.interests || [],
      },
    }));
  }

  async fetchOrganizationData(): Promise<OrganizationData[]> {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('*, organization_preferences(*)');

    if (!organizations) return [];

    return organizations.map((org) => ({
      id: org.id,
      org_id: org.org_id,
      organization_name: org.organization_name,
      industry: org.industry,
      location: org.location,
      preferences: {
        required_skills: org.organization_preferences[0]?.required_skills || [],
        project_types: org.organization_preferences[0]?.project_types || [],
        max_students: org.organization_preferences[0]?.max_students || 1,
        preferred_programs: org.organization_preferences[0]?.preferred_programs || [],
        min_gpa: org.organization_preferences[0]?.min_gpa || 0,
      },
    }));
  }

  calculateSkillsMatch(studentSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 100;
    const matchedSkills = studentSkills.filter((skill) =>
      requiredSkills.some((req) => req.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(req.toLowerCase()))
    );
    return (matchedSkills.length / requiredSkills.length) * 100;
  }

  calculateLocationMatch(studentLocations: string[], orgLocation: string): number {
    if (studentLocations.length === 0) return 50;
    const isMatch = studentLocations.some((loc) =>
      orgLocation.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(orgLocation.toLowerCase())
    );
    return isMatch ? 100 : 0;
  }

  calculateIndustryMatch(studentIndustries: string[], orgIndustry: string): number {
    if (studentIndustries.length === 0) return 50;
    const isMatch = studentIndustries.some((ind) =>
      orgIndustry.toLowerCase().includes(ind.toLowerCase()) || ind.toLowerCase().includes(orgIndustry.toLowerCase())
    );
    return isMatch ? 100 : 0;
  }

  calculateProjectTypeMatch(studentProjectTypes: string[], orgProjectTypes: string[]): number {
    if (studentProjectTypes.length === 0 || orgProjectTypes.length === 0) return 50;
    const matchedTypes = studentProjectTypes.filter((type) =>
      orgProjectTypes.some((orgType) => orgType.toLowerCase().includes(type.toLowerCase()) || type.toLowerCase().includes(orgType.toLowerCase()))
    );
    return matchedTypes.length > 0 ? 100 : 0;
  }

  calculateGPAMatch(studentGPA: number, minGPA: number): number {
    if (studentGPA < minGPA) return 0;
    if (minGPA === 0) return 100;
    return Math.min(100, 100 + ((studentGPA - minGPA) * 10));
  }

  calculateProgramMatch(studentProgram: string, preferredPrograms: string[]): number {
    if (preferredPrograms.length === 0) return 100;
    const isMatch = preferredPrograms.some((prog) =>
      studentProgram.toLowerCase().includes(prog.toLowerCase()) || prog.toLowerCase().includes(studentProgram.toLowerCase())
    );
    return isMatch ? 100 : 30;
  }

  calculateMatchScore(student: StudentData, organization: OrganizationData): MatchResult {
    const skillsScore = this.calculateSkillsMatch(student.skills, organization.preferences.required_skills);
    const locationScore = this.calculateLocationMatch(student.preferences.preferred_locations, organization.location);
    const industryScore = this.calculateIndustryMatch(student.preferences.preferred_industries, organization.industry);
    const projectTypeScore = this.calculateProjectTypeMatch(student.preferences.project_types, organization.preferences.project_types);
    const gpaScore = this.calculateGPAMatch(student.gpa, organization.preferences.min_gpa);
    const programScore = this.calculateProgramMatch(student.program, organization.preferences.preferred_programs);

    const totalScore =
      (skillsScore * this.weights.skills) +
      (locationScore * this.weights.location) +
      (industryScore * this.weights.industry) +
      (projectTypeScore * this.weights.project_type) +
      (gpaScore * this.weights.gpa) +
      (programScore * this.weights.program);

    return {
      student_id: student.id,
      organization_id: organization.id,
      match_score: Math.round(totalScore),
      breakdown: {
        skills_score: Math.round(skillsScore),
        location_score: Math.round(locationScore),
        industry_score: Math.round(industryScore),
        project_type_score: Math.round(projectTypeScore),
        gpa_score: Math.round(gpaScore),
        program_score: Math.round(programScore),
      },
    };
  }

  // Simplified score for override recalculation (works with raw DB rows)
  calculateMatchScoreSimple(student: any, org: any): number {
    const skills = this.calculateSkillsMatch(student.skills || [], []);
    return Math.round(skills * this.weights.skills * 100) / 100;
  }

  async generateMatches(alreadyMatchedStudentIds: Set<string> = new Set()): Promise<MatchResult[]> {
    const students = await this.fetchStudentData();
    const organizations = await this.fetchOrganizationData();

    // Skip students who already have a confirmed or pending match
    const eligibleStudents = students.filter((s) => !alreadyMatchedStudentIds.has(s.id));

    const allMatches: MatchResult[] = [];

    for (const student of eligibleStudents) {
      for (const organization of organizations) {
        const match = this.calculateMatchScore(student, organization);
        allMatches.push(match);
      }
    }

    allMatches.sort((a, b) => b.match_score - a.match_score);

    const finalMatches: MatchResult[] = [];
    const assignedStudents = new Set<string>();
    const orgStudentCount = new Map<string, number>();

    // Count existing confirmed/pending matches per org so max_students is respected
    const { data: existingOrgMatches } = await supabase
      .from('matches')
      .select('organization_id')
      .in('status', ['confirmed', 'pending']);

    for (const m of existingOrgMatches || []) {
      orgStudentCount.set(m.organization_id, (orgStudentCount.get(m.organization_id) || 0) + 1);
    }

    for (const match of allMatches) {
      if (assignedStudents.has(match.student_id)) continue;

      const org = organizations.find((o) => o.id === match.organization_id);
      if (!org) continue;

      const currentCount = orgStudentCount.get(match.organization_id) || 0;
      if (currentCount >= org.preferences.max_students) continue;

      finalMatches.push(match);
      assignedStudents.add(match.student_id);
      orgStudentCount.set(match.organization_id, currentCount + 1);
    }

    return finalMatches;
  }

  async saveMatches(matches: MatchResult[], skipStudentIds: Set<string> = new Set()): Promise<void> {
    // Only delete rejected matches for students not yet matched — never delete confirmed/pending
    await supabase
      .from('matches')
      .delete()
      .eq('status', 'rejected');

    if (matches.length === 0) return;

    const matchRecords = matches.map((match) => ({
      student_id: match.student_id,
      organization_id: match.organization_id,
      match_score: match.match_score,
      algorithm_type: 'weighted_scoring',
      status: 'pending',
    }));

    await supabase.from('matches').insert(matchRecords);
  }
}

export const matchingEngine = new MatchingEngine();
