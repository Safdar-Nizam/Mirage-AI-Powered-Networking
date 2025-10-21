import { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase, Contact, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type MessagesPageProps = {
  contactId: string;
  onBack: () => void;
  prefillDraft?: boolean;
};

export default function MessagesPage({ contactId, onBack, prefillDraft }: MessagesPageProps) {
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [contactId]);

  useEffect(() => {
    if (prefillDraft && contact) {
      const draft = `Hey ${contact.name.split(' ')[0]}, hope you've been well — just wanted to reconnect. How's ${contact.profession || 'everything'} going lately?`;
      setMessageText(draft);
    }
  }, [prefillDraft, contact]);

  const loadData = async () => {
    try {
      const [contactRes, messagesRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', contactId).maybeSingle(),
        supabase.from('messages').select('*').eq('contact_id', contactId).order('created_at'),
      ]);

      if (contactRes.data) setContact(contactRes.data);
      if (messagesRes.data) setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        contact_id: contactId,
        content: messageText,
        is_ai_generated: prefillDraft || false,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase
        .from('contacts')
        .update({ last_contacted: new Date().toISOString() })
        .eq('id', contactId);

      setMessageText('');
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
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
        <div className="text-gray-600">Contact not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {contact.photo_url ? (
              <img src={contact.photo_url} alt={contact.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#008080] flex items-center justify-center text-white font-medium">
                {contact.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{contact.name}</h1>
              {contact.profession && (
                <p className="text-sm text-gray-600">{contact.profession}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No messages yet. Start the conversation below.
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">You</span>
                <div className="flex items-center gap-2">
                  {message.is_ai_generated && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      AI Generated
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleDateString()} at{' '}
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <p className="text-gray-700">{message.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className="px-6 py-3 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
