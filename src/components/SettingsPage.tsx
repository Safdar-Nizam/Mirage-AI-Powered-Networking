import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { supabase, UserSettings } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createDemoData } from '../utils/demoData';

type SettingsPageProps = {
  onBack: () => void;
};

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [reminderFrequency, setReminderFrequency] = useState(60);
  const [aiMessagingEnabled, setAiMessagingEnabled] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings(data);
      setReminderFrequency(data.reminder_frequency_days);
      setAiMessagingEnabled(data.ai_messaging_enabled);
      setRequireApproval(data.require_approval);
      setEmailNotifications(data.email_notifications);
      setInAppNotifications(data.in_app_notifications);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          reminder_frequency_days: reminderFrequency,
          ai_messaging_enabled: aiMessagingEnabled,
          require_approval: requireApproval,
          email_notifications: emailNotifications,
          in_app_notifications: inAppNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setMessage('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!user) return;
    if (!confirm('This will delete all your contacts and messages and recreate demo data. Continue?')) return;

    setResetting(true);
    setMessage('');

    try {
      await supabase.from('messages').delete().eq('user_id', user.id);
      await supabase.from('contacts').delete().eq('user_id', user.id);
      await supabase.from('categories').delete().eq('user_id', user.id);

      await createDemoData(user.id);

      setMessage('Demo data reset successfully! Refresh the page to see changes.');
    } catch (error) {
      console.error('Error resetting demo data:', error);
      setMessage('Error resetting demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reminder Cadence</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose how often you want to be reminded to reconnect with contacts
            </p>
            <select
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            >
              <option value={30}>Every 30 days</option>
              <option value={60}>Every 60 days</option>
              <option value={90}>Every 90 days</option>
            </select>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Messaging</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Enable AI Messaging</p>
                  <p className="text-sm text-gray-600">Allow AI to generate catch-up message drafts</p>
                </div>
                <button
                  onClick={() => setAiMessagingEnabled(!aiMessagingEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiMessagingEnabled ? 'bg-[#008080]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiMessagingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Require Approval</p>
                  <p className="text-sm text-gray-600">Review AI-generated messages before sending</p>
                </div>
                <button
                  onClick={() => setRequireApproval(!requireApproval)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    requireApproval ? 'bg-[#008080]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      requireApproval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive reminders via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? 'bg-[#008080]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">In-App Notifications</p>
                  <p className="text-sm text-gray-600">Receive reminders within the app</p>
                </div>
                <button
                  onClick={() => setInAppNotifications(!inAppNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    inAppNotifications ? 'bg-[#008080]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      inAppNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Consent</h2>
            <p className="text-sm text-gray-600 mb-4">
              Mirage is built with a consent-first approach. Contacts must opt-in to receive automated messages.
              You can manage individual consent settings from the Contacts page.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Your Data Rights</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contacts can opt-out at any time</li>
                <li>• You control the frequency and content of messages</li>
                <li>• All AI-generated messages can be reviewed before sending</li>
                <li>• Export your data at any time from your profile</li>
              </ul>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reset your account with fresh demo data including profile pictures for all contacts.
            </p>
            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {resetting ? 'Resetting...' : 'Reset Demo Data'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors disabled:opacity-50 font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
