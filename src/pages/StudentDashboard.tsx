import { useState, useEffect } from 'react';
import { LogOut, User, MapPin, Briefcase, Target, Mail, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Student, StudentPreferences, Match } from '../lib/supabase';

export default function StudentDashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const student = profile as Student;

  const [preferences, setPreferences] = useState<StudentPreferences | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    preferred_locations: '',
    preferred_industries: '',
    project_types: '',
    interests: '',
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
      .from('student_preferences')
      .select('*')
      .eq('student_id', user!.id)
      .maybeSingle();

    if (data) {
      setPreferences(data);
      setFormData({
        preferred_locations: data.preferred_locations.join(', '),
        preferred_industries: data.preferred_industries.join(', '),
        project_types: data.project_types.join(', '),
        interests: data.interests.join(', '),
      });
    }
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, organizations(*)')
      .eq('student_id', user!.id)
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
        .from('student_preferences')
        .update({
          preferred_locations: formData.preferred_locations.split(',').map((s) => s.trim()).filter(Boolean),
          preferred_industries: formData.preferred_industries.split(',').map((s) => s.trim()).filter(Boolean),
          project_types: formData.project_types.split(',').map((s) => s.trim()).filter(Boolean),
          interests: formData.interests.split(',').map((s) => s.trim()).filter(Boolean),
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', user!.id);

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
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {student?.full_name}</p>
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
                  <User className="w-6 h-6 text-blue-600" />
                  Academic Profile
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-medium">{student?.student_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Program</p>
                  <p className="font-medium">{student?.program}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-medium">Year {student?.year_of_study}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GPA</p>
                  <p className="font-medium">{student?.gpa?.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {student?.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Preferences
                </h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Preferred Locations (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_locations}
                      onChange={(e) => setFormData({ ...formData, preferred_locations: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Gaborone, Francistown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="inline w-4 h-4 mr-1" />
                      Preferred Industries (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_industries}
                      onChange={(e) => setFormData({ ...formData, preferred_industries: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Technology, Finance, Healthcare"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Software Development, Data Analysis, Research"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interests (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="AI, Web Development, Mobile Apps"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Preferred Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.preferred_locations.map((loc, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {loc}
                        </span>
                      ))}
                      {preferences?.preferred_locations.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Preferred Industries</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.preferred_industries.map((ind, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {ind}
                        </span>
                      ))}
                      {preferences?.preferred_industries.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Project Types</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.project_types.map((type, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {type}
                        </span>
                      ))}
                      {preferences?.project_types.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.interests.map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {interest}
                        </span>
                      ))}
                      {preferences?.interests.length === 0 && (
                        <span className="text-gray-400 text-sm">No preferences set</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                Match Status
              </h2>

              {matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No matches yet. The coordinator will initiate matching soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match: any) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">
                          {match.organizations.organization_name}
                        </h3>
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
                      <p className="text-sm text-gray-600 mb-2">{match.organizations.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Match Score: {match.match_score}%</span>
                        <span>Location: {match.organizations.location}</span>
                        <span>Industry: {match.organizations.industry}</span>
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
                <Mail className="w-6 h-6 text-blue-600" />
                Notifications
              </h2>

              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
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
