import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Contact } from '../lib/supabase';
import { Focus, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

type MapViewProps = {
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
  selectedCountry?: string | null;
};

type LocationGroup = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  contacts: Contact[];
};

const countryCoordinates: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Saudi Arabia': { lat: 24.0, lng: 45.0, zoom: 6 },
  'USA': { lat: 37.0902, lng: -95.7129, zoom: 4 },
  'France': { lat: 46.2276, lng: 2.2137, zoom: 6 },
  'Italy': { lat: 41.8719, lng: 12.5674, zoom: 6 },
};

function MapController({ center, zoom, selectedCountry, ring1Bounds }: { center: [number, number]; zoom: number; selectedCountry?: string | null; ring1Bounds?: [[number, number], [number, number]] | null }) {
  const map = useMap();

  useEffect(() => {
    if (ring1Bounds) {
      map.fitBounds(ring1Bounds, { padding: [20, 20], animate: true, duration: 0.5 });
    } else if (selectedCountry && countryCoordinates[selectedCountry]) {
      const coords = countryCoordinates[selectedCountry];
      map.setView([coords.lat, coords.lng], coords.zoom, { animate: true, duration: 1 });
    } else {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, selectedCountry, ring1Bounds, map]);

  return null;
}

export default function MapView({ contacts, onContactClick, selectedCountry }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [focusRing1, setFocusRing1] = useState(false);
  const [ring1Bounds, setRing1Bounds] = useState<[[number, number], [number, number]] | null>(null);

  const locationGroups = contacts.reduce((acc, contact) => {
    if (!contact.city || !contact.country || contact.latitude === null || contact.longitude === null) {
      return acc;
    }

    const key = `${contact.city}-${contact.country}`;
    if (!acc[key]) {
      acc[key] = {
        city: contact.city,
        country: contact.country,
        latitude: contact.latitude,
        longitude: contact.longitude,
        contacts: [],
      };
    }
    acc[key].contacts.push(contact);
    return acc;
  }, {} as Record<string, LocationGroup>);

  const locations = Object.values(locationGroups);

  const ring1Contacts = contacts.filter(c => c.layer === 1);
  const displayContacts = focusRing1 ? ring1Contacts : contacts;

  const handleFocusRing1 = () => {
    if (ring1Contacts.length === 0) return;

    const lats = ring1Contacts.filter(c => c.latitude !== null).map(c => c.latitude as number);
    const lngs = ring1Contacts.filter(c => c.longitude !== null).map(c => c.longitude as number);

    if (lats.length === 0 || lngs.length === 0) return;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    setRing1Bounds([[minLat, minLng], [maxLat, maxLng]]);
    setFocusRing1(true);
  };

  const handleResetView = () => {
    setFocusRing1(false);
    setRing1Bounds(null);
  };

  const getMarkerColor = (count: number): string => {
    if (count >= 30) return '#EF4444';
    if (count >= 16) return '#FF7A00';
    if (count >= 6) return '#008080';
    return '#10B981';
  };

  const getMarkerRadius = (count: number): number => {
    if (count >= 30) return 18;
    if (count >= 16) return 15;
    if (count >= 6) return 12;
    return 10;
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[25, 20]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapController center={[25, 20]} zoom={2} selectedCountry={selectedCountry} ring1Bounds={ring1Bounds} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {locations.map((location) => {
          const key = `${location.city}-${location.country}`;
          const filteredLocationContacts = location.contacts.filter(c => displayContacts.includes(c));
          if (filteredLocationContacts.length === 0) return null;

          const count = filteredLocationContacts.length;
          const color = getMarkerColor(count);
          const radius = getMarkerRadius(count);
          const isHovered = hoveredLocation === key;
          const isRing1Location = filteredLocationContacts.some(c => c.layer === 1);
          const opacity = focusRing1 && !isRing1Location ? 0.3 : 0.7;

          return (
            <CircleMarker
              key={key}
              center={[location.latitude, location.longitude]}
              radius={isHovered ? radius + 3 : radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: opacity,
                color: color,
                weight: 2,
                opacity: focusRing1 && !isRing1Location ? 0.3 : 0.9,
              }}
              eventHandlers={{
                click: () => setSelectedLocation(location),
                mouseover: () => setHoveredLocation(key),
                mouseout: () => setHoveredLocation(null),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">
                    {location.city}, {location.country}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {count} Contact{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        {!focusRing1 ? (
          <button
            onClick={handleFocusRing1}
            className="p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Focus: Inner Circle"
          >
            <Focus className="w-5 h-5 text-[#008080]" />
          </button>
        ) : (
          <button
            onClick={handleResetView}
            className="p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5 text-[#008080]" />
          </button>
        )}
      </div>

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-[1000]">
        <div className="text-xs font-semibold text-gray-900 mb-2">Contact Count</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-xs text-gray-700">1-5 contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#008080' }}></div>
            <span className="text-xs text-gray-700">6-15 contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF7A00' }}></div>
            <span className="text-xs text-gray-700">16-30 contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
            <span className="text-xs text-gray-700">30+ contacts</span>
          </div>
        </div>
      </div>

      {selectedLocation && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-[1000] max-h-[calc(100%-2rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedLocation.city}, {selectedLocation.country}</h3>
              <p className="text-sm text-gray-600">{selectedLocation.contacts.length} contacts</p>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {selectedLocation.contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  onContactClick(contact.id);
                  setSelectedLocation(null);
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                {contact.photo_url ? (
                  <img
                    src={contact.photo_url}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#008080] flex items-center justify-center text-white text-sm font-medium">
                    {contact.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{contact.name}</div>
                  {contact.profession && (
                    <div className="text-xs text-gray-600 truncate">{contact.profession}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
