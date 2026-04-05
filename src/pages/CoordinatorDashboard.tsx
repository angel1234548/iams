import { useState, useEffect } from 'react';
import { LogOut, Users, Building2, CheckCircle, PlayCircle, BarChart3, RefreshCw, Send, Edit2, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Coordinator } from '../lib/supabase';
import { matchingEngine } from '../services/matchingEngine';

export default function CoordinatorDashboard() {
  const { profile, signOut } = useAuth();
  const coordinator = profile as Coordinator;

  const [stats, setStats] = useState({ totalStudents: 0, totalOrganizations: 0, totalMatches: 0, confirmedMatches: 0 });
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');

  // Override state
  const [overrideMatchId, setOverrideMatchId] = useState<string | null>(null);
  const [overrideStudentId, setOverrideStudentId] = useState('');
  const [overrideOrgId, setOverrideOrgId] = useState('');
  const [overrideNote, setOverrideNote] = useState('');

  useEffect(() => {
    fetchStats();
    fetchMatches();
    fetchAllStudents();
    fetchAllOrganizations();
  }, []);

  const fetchStats = async () => {
    const { data: students } = await supabase.from('students').select('id').eq('iams_access', true);
    const { data: organizations } = await supabase.from('organizations').select('id');
    const { data: allMatches } = await supabase.from('matches').select('id, status');
    setStats({
      totalStudents: students?.length || 0,
      totalOrganizations: organizations?.length || 0,
      totalMatches: allMatches?.length || 0,
      confirmedMatches: allMatches?.filter((m) => m.status === 'confirmed').length || 0,
    });
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*, students(*), organizations(*)')
      .order('match_score', { ascending: false });

    if (data) {
      // Only show pending in the pending tab — hide rejected and overridden ones
      setPendingMatches(data.filter((m) => m.status === 'pending'));
      setConfirmedMatches(data.filter((m) => m.status === 'confirmed'));
    }
  };

  const fetchAllStudents = async () => {
    const { data } = await supabase.from('students').select('*').eq('iams_access', true);
    if (data) setAllStudents(data);
  };

  const fetchAllOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('*');
    if (data) setAllOrganizations(data);
  };

  const handleRunMatching = async () => {
    setMatchingInProgress(true);
    try {
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('student_id')
        .in('status', ['confirmed', 'pending']);

      const alreadyMatchedStudentIds = new Set(existingMatches?.map((m) => m.student_id) || []);
      const generatedMatches = await matchingEngine.generateMatches(alreadyMatchedStudentIds);
      await matchingEngine.saveMatches(generatedMatches);
      await fetchMatches();
      await fetchStats();
    } catch (error) {
      console.error('Error running matching:', error);
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleConfirmMatch = async (matchId: string) => {
    setLoading(true);
    try {
      await supabase.from('matches').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', matchId);
      await fetchMatches();
      await fetchStats();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    setLoading(true);
    try {
      await supabase.from('matches').update({ status: 'rejected' }).eq('id', matchId);
      // Remove immediately from UI without waiting for refetch
      setPendingMatches((prev) => prev.filter((m) => m.id !== matchId));
      await fetchStats();
    } finally {
      setLoading(false);
    }
  };

  const handleStartOverride = (match: any) => {
    setOverrideMatchId(match.id);
    setOverrideStudentId(match.student_id);
    setOverrideOrgId(match.organization_id);
    setOverrideNote(match.coordinator_notes || '');
  };

  const handleSaveOverride = async () => {
    if (!overrideMatchId || !overrideStudentId || !overrideOrgId) return;
    setLoading(true);
    try {
      await supabase.from('matches').update({
        student_id: overrideStudentId,
        organization_id: overrideOrgId,
        coordinator_notes: overrideNote,
        algorithm_type: 'manual_override',
        status: 'pending',
        match_score: 0,
      }).eq('id', overrideMatchId);

      setOverrideMatchId(null);
      // Remove from confirmed tab immediately if it was there
      setConfirmedMatches((prev) => prev.filter((m) => m.id !== overrideMatchId));
      await fetchMatches();
      await fetchStats();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOverride = () => {
    setOverrideMatchId(null);
    setOverrideStudentId('');
    setOverrideOrgId('');
    setOverrideNote('');
  };

  const handleSendNotifications = async () => {
    setLoading(true);
    try {
      for (const match of confirmedMatches) {
        const { data: studentUser } = await supabase.from('users').select('email').eq('id', match.student_id).maybeSingle();
        const { data: orgUser } = await supabase.from('users').select('email').eq('id', match.organization_id).maybeSingle();

        if (studentUser) {
          await supabase.from('notifications').insert({
            recipient_id: match.student_id,
            recipient_email: studentUser.email,
            subject: 'Industrial Attachment Match Confirmed',
            body: `Congratulations! You have been matched with ${match.organizations.organization_name}. They will contact you soon.`,
            notification_type: 'match_confirmation',
            status: 'sent',
            match_id: match.id,
            sent_at: new Date().toISOString(),
          });
        }
        if (orgUser) {
          await supabase.from('notifications').insert({
            recipient_id: match.organization_id,
            recipient_email: orgUser.email,
            subject: 'Industrial Attachment Match Confirmed',
            body: `A student has been matched with your organization: ${match.students.full_name} from ${match.students.program}.`,
            notification_type: 'match_confirmation',
            status: 'sent',
            match_id: match.id,
            sent_at: new Date().toISOString(),
          });
        }
      }
      alert('Notifications sent successfully!');
    } finally {
      setLoading(false);
    }
  };

  const MatchCard = ({ match, showConfirmed }: { match: any; showConfirmed: boolean }) => (
    <div className="border border-gray-200 rounded-lg p-6">
      {overrideMatchId === match.id ? (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-orange-500" /> Manual Override
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Student</label>
              <select
                value={overrideStudentId}
                onChange={(e) => setOverrideStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select student...</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.student_id}) — {s.program}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Organization</label>
              <select
                value={overrideOrgId}
                onChange={(e) => setOverrideOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select organization...</option>
                {allOrganizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.organization_name} — {o.industry}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coordinator Notes</label>
            <textarea
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              rows={2}
              placeholder="Reason for manual override..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveOverride} disabled={loading || !overrideStudentId || !overrideOrgId}
              className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm">
              <Check className="w-4 h-4" /> Save Override
            </button>
            <button onClick={handleCancelOverride}
              className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <h3 className="font-bold text-lg">{match.students?.full_name}</h3>
                <p className="text-sm text-gray-600">{match.students?.student_id} • {match.students?.program}</p>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div>
                <h3 className="font-bold text-lg">{match.organizations?.organization_name}</h3>
                <p className="text-sm text-gray-600">{match.organizations?.industry} • {match.organizations?.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>GPA: {match.students?.gpa?.toFixed(2)}</span>
              <span>Year: {match.students?.year_of_study}</span>
              {match.algorithm_type !== 'manual_override' && (
                <span className="font-semibold text-blue-600">Match Score: {match.match_score}%</span>
              )}
              {match.algorithm_type === 'manual_override' && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">Manual Override</span>
              )}
            </div>

            {match.students?.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {match.students.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{skill}</span>
                ))}
              </div>
            )}

            {match.coordinator_notes && (
              <p className="mt-2 text-sm text-orange-700 italic">Note: {match.coordinator_notes}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            {showConfirmed ? (
              <>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">Confirmed</span>
                <button onClick={() => handleStartOverride(match)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center gap-1 mt-2">
                  <Edit2 className="w-3 h-3" /> Override
                </button>
              </>
            ) : (
              <>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">Pending</span>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleConfirmMatch(match.id)} disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">Confirm</button>
                  <button onClick={() => handleRejectMatch(match.id)} disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">Reject</button>
                  <button onClick={() => handleStartOverride(match)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Override
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {coordinator?.full_name}</p>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Students', value: stats.totalStudents, icon: <Users className="w-12 h-12 text-blue-600" /> },
            { label: 'Organizations', value: stats.totalOrganizations, icon: <Building2 className="w-12 h-12 text-green-600" /> },
            { label: 'Pending Matches', value: pendingMatches.length, icon: <BarChart3 className="w-12 h-12 text-orange-600" /> },
            { label: 'Confirmed', value: stats.confirmedMatches, icon: <CheckCircle className="w-12 h-12 text-teal-600" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                </div>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-blue-600" /> Matching Engine
            </h2>
            <div className="flex gap-3">
              <button onClick={handleRunMatching} disabled={matchingInProgress}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {matchingInProgress
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Running...</>
                  : <><PlayCircle className="w-5 h-5" /> Run Matching Algorithm</>}
              </button>
              <button onClick={handleSendNotifications} disabled={loading || confirmedMatches.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-5 h-5" /> Send Notifications
              </button>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            Already confirmed or pending students are skipped on re-run. Rejected matches are removed. Use <strong>Override</strong> to manually reassign any match.
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Pending ({pendingMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'confirmed' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Confirmed ({confirmedMatches.length})
            </button>
          </div>

          {activeTab === 'pending' && (
            pendingMatches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No pending matches</p>
                <p className="text-sm mt-2">Click "Run Matching Algorithm" to generate new matches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMatches.map((match) => <MatchCard key={match.id} match={match} showConfirmed={false} />)}
              </div>
            )
          )}

          {activeTab === 'confirmed' && (
            confirmedMatches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No confirmed matches yet</p>
                <p className="text-sm mt-2">Confirm pending matches to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {confirmedMatches.map((match) => <MatchCard key={match.id} match={match} showConfirmed={true} />)}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
