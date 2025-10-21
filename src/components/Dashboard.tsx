import { useState, useEffect } from 'react';
import { Network, Search, LogOut, Settings as SettingsIcon, MessageSquare, List, Globe, ChevronDown, ChevronRight, Shuffle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Contact, Category } from '../lib/supabase';
import NetworkGraph from './NetworkGraph';
import MapView from './MapView';

type DashboardProps = {
  onNavigate: (page: 'contacts' | 'messages' | 'settings' | 'message-log', contactId?: string) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, signOut } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'circle' | 'map'>('circle');
  const [sidebarMode, setSidebarMode] = useState<'categories' | 'countries'>('categories');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar.categories.collapsed');
    return saved === 'true';
  });
  const [countriesCollapsed, setCountriesCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar.countries.collapsed');
    return saved === 'true';
  });
  const [randomSeed, setRandomSeed] = useState(Date.now());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar.categories.collapsed', categoriesCollapsed.toString());
  }, [categoriesCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar.countries.collapsed', countriesCollapsed.toString());
  }, [countriesCollapsed]);

  const loadData = async () => {
    try {
      const [contactsRes, categoriesRes] = await Promise.all([
        supabase.from('contacts').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setContacts(contactsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const countryGroups = (() => {
    const groups: Record<string, number> = {};
    contacts.forEach(contact => {
      if (contact.country) {
        groups[contact.country] = (groups[contact.country] || 0) + 1;
      }
    });
    return groups;
  })();

  const filteredContacts = (() => {
    let filtered = contacts;

    if (searchQuery) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sidebarMode === 'categories' && selectedCategory) {
      const layer1InCategory = filtered.filter(
        c => c.layer === 1 && c.category_id === selectedCategory
      );
      const layer1Ids = new Set(layer1InCategory.map(c => c.id));

      const layer2InBranch = filtered.filter(
        c => c.layer === 2 && c.parent_contact_id && layer1Ids.has(c.parent_contact_id)
      );
      const layer2Ids = new Set(layer2InBranch.map(c => c.id));

      const layer3InBranch = filtered.filter(
        c => c.layer === 3 && c.parent_contact_id && layer2Ids.has(c.parent_contact_id)
      );

      filtered = [...layer1InCategory, ...layer2InBranch, ...layer3InBranch];
    }

    if (sidebarMode === 'countries' && selectedCountry) {
      filtered = filtered.filter(c => c.country === selectedCountry);
    }

    return filtered;
  })();

  const handleContactClick = (contactId: string) => {
    onNavigate('messages', contactId);
  };

  const handleAICatchup = (contactId: string) => {
    onNavigate('messages', contactId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Network className="w-8 h-8 text-[#008080]" />
                <span className="text-2xl font-bold text-[#008080]">Mirage</span>
              </div>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent w-64"
                />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('circle')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'circle'
                      ? 'bg-white text-[#008080] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  Circle View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-[#008080] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Map View
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt={profile.full_name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#008080] flex items-center justify-center text-white text-sm font-medium">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{profile?.full_name}</span>
              </div>
            </div>
          </div>
          <nav className="flex gap-1 py-3">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-b-2 border-[#008080]"
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('contacts')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              Contacts
            </button>
            <button
              onClick={() => onNavigate('message-log')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              Messages
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0 flex flex-col">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => {
                setSidebarMode('categories');
                setSelectedCountry(null);
              }}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sidebarMode === 'categories'
                  ? 'bg-white text-[#008080] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => {
                setSidebarMode('countries');
                setSelectedCategory(null);
              }}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sidebarMode === 'countries'
                  ? 'bg-white text-[#008080] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Countries
            </button>
          </div>

          <div className={`transition-opacity duration-300 ${sidebarMode === 'categories' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
            <button
              onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-all duration-200 mb-2"
            >
              <h3 className="text-sm font-semibold text-gray-900">
                Categories {categoriesCollapsed && `(${contacts.length})`}
              </h3>
              {categoriesCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <div className={`space-y-1 overflow-hidden transition-all duration-200 ${categoriesCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setRandomSeed(Date.now());
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory
                    ? 'bg-[#008080] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Contacts ({contacts.length})
              </button>
              {categories.map((category) => {
                const count = contacts.filter(c => c.category_id === category.id).length;
                return (
                  <div key={category.id} className="relative">
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setRandomSeed(Date.now());
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-[#008080] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.name} ({count})
                    </button>
                    {selectedCategory === category.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRandomSeed(Date.now());
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
                        title="Shuffle branches"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${sidebarMode === 'countries' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
            <button
              onClick={() => setCountriesCollapsed(!countriesCollapsed)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-all duration-200 mb-2"
            >
              <h3 className="text-sm font-semibold text-gray-900">
                Countries {countriesCollapsed && `(${Object.keys(countryGroups).length})`}
              </h3>
              {countriesCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <div className={`space-y-1 overflow-hidden transition-all duration-200 ${countriesCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
              <button
                onClick={() => setSelectedCountry(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCountry
                    ? 'bg-[#008080] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Countries ({Object.keys(countryGroups).length})
              </button>
              {Object.entries(countryGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([country, count]) => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCountry === country
                        ? 'bg-[#008080] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {country} ({count})
                  </button>
                ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'circle' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <NetworkGraph
                contacts={filteredContacts}
                profile={profile}
                onContactClick={handleContactClick}
                onAICatchup={handleAICatchup}
                selectedCategoryId={selectedCategory}
                randomSeed={randomSeed}
              />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <MapView
                contacts={filteredContacts}
                onContactClick={handleContactClick}
                selectedCountry={selectedCountry}
              />
            </div>
          </div>

          {selectedContact && (
            <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                {selectedContact.photo_url ? (
                  <img
                    src={selectedContact.photo_url}
                    alt={selectedContact.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#008080] flex items-center justify-center text-white text-lg font-medium">
                    {selectedContact.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                  {selectedContact.profession && (
                    <p className="text-sm text-gray-600">{selectedContact.profession}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Layer</label>
                  <p className="text-gray-900">Layer {selectedContact.layer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Warmth Status</label>
                  <p className="text-gray-900 capitalize">{selectedContact.warmth_status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Contacted</label>
                  <p className="text-gray-900">
                    {selectedContact.last_contacted
                      ? new Date(selectedContact.last_contacted).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900">{selectedContact.notes || 'No notes'}</p>
                </div>
                <button
                  onClick={() => handleAICatchup(selectedContact.id)}
                  className="w-full py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors font-medium"
                >
                  AI Catch-up
                </button>
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}
