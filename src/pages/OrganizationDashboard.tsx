import { useState, useEffect } from 'react';
import { LogOut, Building2, Settings, Users, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Organization, OrganizationPreferences, Match } from '../lib/supabase';

export default function OrganizationDashboard() {
  const { user, profile, signOut } = useAuth();
  const organization = profile as Organization;

  const [preferences, setPreferences] = useState<OrganizationPreferences | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    required_skills: '',
    project_types: '',
    max_students: '1',
    preferred_programs: '',
    min_gpa: '0',
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchMatches();
      fetchNotifications();
    }
  }, [user]);

  const fetchPreferences = async () => {
    const { data } = await supabase
      .from('organization_preferences')
      .select('*')
      .eq('organization_id', user!.id)
      .maybeSingle();

    if (data) {
      setPreferences(data);
      setFormData({
        required_skills: data.required_skills.join(', '),
        project_types: data.project_types.join(', '),
        max_students: data.max_students.toString(),
        preferred_programs: data.preferred_programs.join(', '),
        min_gpa: data.min_gpa.toString(),
      });
    }
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, students(*)')
      .eq('organization_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) setMatches(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setNotifications(data);
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organization_preferences')
        .update({
          required_skills: formData.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
          project_types: formData.project_types.split(',').map((s) => s.trim()).filter(Boolean),
          max_students: parseInt(formData.max_students),
          preferred_programs: formData.preferred_programs.split(',').map((s) => s.trim()).filter(Boolean),
          min_gpa: parseFloat(formData.min_gpa),
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', user!.id);

      if (error) throw error;

      await fetchPreferences();
      setEditing(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {organization?.organization_name}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-green-600" />
                  Organization Profile
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Organization ID</p>
                  <p className="font-medium">{organization?.org_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="font-medium">{organization?.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{organization?.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium">{organization?.contact_person}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-sm">{organization?.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-green-600" />
                  Hosting Preferences
                </h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Edit Preferences
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.required_skills}
                      onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Python, JavaScript, React"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Types (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.project_types}
                      onChange={(e) => setFormData({ ...formData, project_types: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Web Development, Data Science, Research"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="inline w-4 h-4 mr-1" />
                        Maximum Students
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_students}
                        onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum GPA
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={formData.min_gpa}
                        onChange={(e) => setFormData({ ...formData, min_gpa: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Programs (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_programs}
                      onChange={(e) => setFormData({ ...formData, preferred_programs: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Computer Science, Software Engineering"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.required_skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                      {preferences?.required_skills.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Project Types</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.project_types.map((type, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {type}
                        </span>
                      ))}
                      {preferences?.project_types.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Maximum Students</p>
                      <p className="text-lg font-bold text-gray-900">{preferences?.max_students}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Minimum GPA</p>
                      <p className="text-lg font-bold text-gray-900">{preferences?.min_gpa?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Preferred Programs</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.preferred_programs.map((prog, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {prog}
                        </span>
                      ))}
                      {preferences?.preferred_programs.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Matched Students
              </h2>

              {matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No matches yet. Waiting for coordinator to initiate matching.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match: any) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{match.students.full_name}</h3>
                          <p className="text-sm text-gray-600">{match.students.student_id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          match.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : match.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Program: {match.students.program}</span>
                        <span>GPA: {match.students.gpa.toFixed(2)}</span>
                        <span>Match Score: {match.match_score}%</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.students.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-green-600" />
                Notifications
              </h2>

              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                      <p className="font-medium text-sm">{notif.subject}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
