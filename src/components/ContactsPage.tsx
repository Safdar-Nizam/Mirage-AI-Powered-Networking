import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Filter, MapPin, X } from 'lucide-react';
import { supabase, Contact, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ContactsPageProps = {
  onBack: () => void;
};

export default function ContactsPage({ onBack }: ContactsPageProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filterLayer, setFilterLayer] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterConsent, setFilterConsent] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [contactsRes, categoriesRes] = await Promise.all([
      supabase.from('contacts').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (contactsRes.data) setContacts(contactsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const uniqueLocations = Array.from(new Set(
    contacts.map(c => [c.city, c.country].filter(Boolean).join(', ')).filter(Boolean)
  ));

  const updateLocationSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const matches = uniqueLocations.filter(loc =>
      loc.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
    setLocationSuggestions(matches);
  }, [uniqueLocations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateLocationSuggestions(locationQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [locationQuery, updateLocationSuggestions]);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationQuery ||
      contact.city?.toLowerCase().includes(locationQuery.toLowerCase()) ||
      contact.country?.toLowerCase().includes(locationQuery.toLowerCase());
    const matchesLayer = filterLayer === null || contact.layer === filterLayer;
    const matchesCategory = filterCategory === null || contact.category_id === filterCategory;
    const matchesConsent = filterConsent === null || contact.consent_status === filterConsent;
    return matchesSearch && matchesLocation && matchesLayer && matchesCategory && matchesConsent;
  });

  const toggleAI = async (contactId: string, currentValue: boolean) => {
    await supabase
      .from('contacts')
      .update({ ai_enabled: !currentValue })
      .eq('id', contactId);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Contact
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
                {locationQuery && (
                  <button
                    onClick={() => {
                      setLocationQuery('');
                      setLocationSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {locationSuggestions.map((location, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLocationQuery(location);
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <select
              value={filterLayer || ''}
              onChange={(e) => setFilterLayer(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            >
              <option value="">All Layers</option>
              <option value="1">Layer 1</option>
              <option value="2">Layer 2</option>
              <option value="3">Layer 3</option>
            </select>
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filterConsent || ''}
              onChange={(e) => setFilterConsent(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            >
              <option value="">All Consent Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profession
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Layer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contacted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Enabled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => {
                const category = categories.find(c => c.id === contact.category_id);
                return (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {contact.photo_url ? (
                          <img src={contact.photo_url} alt={contact.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#008080] flex items-center justify-center text-white text-sm font-medium">
                            {contact.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.profession || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Layer {contact.layer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.last_contacted
                        ? new Date(contact.last_contacted).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contact.consent_status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : contact.consent_status === 'declined'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contact.consent_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAI(contact.id, contact.ai_enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          contact.ai_enabled ? 'bg-[#008080]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            contact.ai_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No contacts found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
