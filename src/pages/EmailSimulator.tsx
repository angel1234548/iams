import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailSimulatorProps {
  onBack: () => void;
}

export default function EmailSimulator({ onBack }: EmailSimulatorProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false });

    if (data) setEmails(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-8 h-8 text-blue-600" />
                Email Service Simulator
              </h1>
              <p className="text-sm text-gray-600 mt-1">Simulated email inbox for testing</p>
            </div>
          </div>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200">
            <div className="md:col-span-1 max-h-[600px] overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Inbox ({emails.length})</h2>
              </div>

              {emails.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No emails yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedEmail?.id === email.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 mb-1">
                        To: {email.recipient_email}
                      </p>
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(email.sent_at).toLocaleString()}
                      </p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        email.notification_type === 'match_confirmation'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {email.notification_type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 p-6">
              {!selectedEmail ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Select an email to view its contents</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        <strong>To:</strong> {selectedEmail.recipient_email}
                      </span>
                      <span>
                        <strong>Sent:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {selectedEmail.body}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This is a simulated email. In a production environment, these would be sent via a real email service like SendGrid or AWS SES.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
