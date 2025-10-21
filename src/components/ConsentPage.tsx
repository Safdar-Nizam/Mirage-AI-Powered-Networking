import { useState, useEffect } from 'react';
import { Network, Check, X } from 'lucide-react';
import { supabase, Contact } from '../lib/supabase';

type ConsentPageProps = {
  contactId: string;
};

export default function ConsentPage({ contactId }: ConsentPageProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [responded, setResponded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();

      if (contactError) throw contactError;
      if (!contactData) {
        setLoading(false);
        return;
      }

      setContact(contactData);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', contactData.user_id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profileData) setOwnerName(profileData.full_name);
    } catch (error) {
      console.error('Error loading contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (accepted: boolean) => {
    if (!contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ consent_status: accepted ? 'accepted' : 'declined' })
        .eq('id', contactId);

      if (error) throw error;
      setResponded(true);
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Invitation not found</div>
      </div>
    );
  }

  if (responded || contact.consent_status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You</h2>
          <p className="text-gray-600">
            Your response has been recorded. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
          <Network className="w-8 h-8 text-[#008080]" />
          <span className="text-2xl font-bold text-[#008080]">Mirage</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Connection Invitation
          </h1>

          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-4">
              <span className="font-semibold">{ownerName}</span> would like to stay in touch with you using Mirage.
            </p>
            <p className="text-gray-600 mb-4">
              Mirage is a professional networking tool that helps maintain meaningful connections through periodic check-ins.
            </p>
          </div>

          <div className="bg-[#E0F2F1] rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-3">What This Means:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-[#008080] font-bold">•</span>
                <span>You may receive periodic messages to stay connected</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#008080] font-bold">•</span>
                <span>Messages will be sent every 30-90 days, depending on settings</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#008080] font-bold">•</span>
                <span>Some messages may be AI-assisted, but always reviewed by {ownerName}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#008080] font-bold">•</span>
                <span>You can opt-out at any time by replying to any message</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#008080] text-white rounded-lg hover:bg-[#006D6D] transition-colors font-medium text-lg"
            >
              <Check className="w-6 h-6" />
              Accept
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-lg"
            >
              <X className="w-6 h-6" />
              Decline
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Your privacy is important. This invitation is sent with full transparency and you have complete control
            over your preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
