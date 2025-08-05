import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Calendar, CloudSun, Star } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import userIconUrl from '../assets/user.png';

// Icône par défaut Leaflet
const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});
L.Marker.prototype.options.icon = DefaultIcon;

// Icône utilisateur custom
const userIcon = L.icon({
  iconUrl: userIconUrl,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

type Activity = {
  id: number;
  title: string;
  description: string;
  event_datetime: string;
  address: { coordinates: [number, number] } | null;
  image: string;
};

const MapPage: React.FC = () => {
  const userPopupRef = useRef<L.Popup>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const visibleTags = tags.slice(0, 3);
  const hiddenTags = tags.slice(3);
  const [showAllTags, setShowAllTags] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [fullscreenEvent, setFullscreenEvent] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null); // ✅ typage explicite
  const token = localStorage.getItem('token');
  const supabase = createAuthedSupabaseClient(token || '');

  // Géolocalisation + météo
  useEffect(() => {

     const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('name'); // ou 'label' selon ta table

    if (error) {
      console.error('Erreur chargement des tags :', error.message);
    } else {
      setTags(data.map((tag) => tag.name)); // ou tag.label
    }
  };

  fetchTags();

    navigator.geolocation.getCurrentPosition((position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(coords);
      setTimeout(() => {
  userPopupRef.current?.openOn(mapRef.current!);
}, 100);

      // Centre la carte si disponible
      if (mapRef.current) {
        mapRef.current.flyTo([coords.lat, coords.lng], 13);
      }

      // Récupération météo
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weathercode&timezone=auto`)
        .then((res) => res.json())
        .then((data) => {
          const temp = data.current.temperature_2m;
          const code = data.current.weathercode;
          const descriptions: Record<number, string> = {
            0: 'Ensoleillé', 1: 'Principalement clair', 2: 'Partiellement nuageux', 3: 'Couvert',
            45: 'Brouillard', 48: 'Brouillard givrant', 51: 'Bruine faible', 53: 'Bruine modérée',
            55: 'Bruine dense', 61: 'Pluie faible', 63: 'Pluie modérée', 65: 'Pluie forte',
            80: 'Averses légères', 81: 'Averses modérées', 82: 'Averses fortes'
          };
          setWeather({ temp, description: descriptions[code] || 'Inconnu' });
        });
    });
  }, []);

  // Chargement des activités
  useEffect(() => {
    const fetchActivities = async () => {
      const { data: raw } = await supabase
        .from('activities')
        .select('id, title, description, event_datetime, address')
        .eq('status_id', 3);

      const enriched = await Promise.all(
        (raw || []).map(async (activity) => {
          const { data: blobs } = await supabase
            .from('activity_blobs')
            .select('blob_link')
            .eq('activity_id', activity.id)
            .limit(1);

          return {
          ...activity,
            image: blobs?.[0]?.blob_link || '/placeholder.jpg',
          };
        })
      );

      setActivities(enriched);
    };

    fetchActivities();
  }, [token]);

  const handleCardClick = (eventId: number) => {
    setFullscreenEvent(fullscreenEvent === eventId ? null : eventId);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === 'overlay') {
      setFullscreenEvent(null);
      setSelectedEvent(null);
    }
  };

  const handleJeSors = async (event: Activity) => {
    const { error } = await supabase
      .from('user_activities')
      .upsert({
        activity_id: event.id,
        user_participates: true,
      });

    if (error) {
      console.error('❌ Erreur Supabase user_activities:', error.message);
      alert("Une erreur est survenue.");
    } else {
      alert("✅ Sortie ajoutée à votre profil !");
    }
  };

return (
  <div className="relative h-screen w-screen">
    {/* Barre de recherche + tags (en ligne, haut gauche, sans fond) */}
 <div className="absolute top-4 left-16 z-40 flex items-start gap-3 pr-4">
  {/* Barre de recherche bien visible */}
  <input
    type="text"
    placeholder="Recherche..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="px-4 py-2 rounded-full border border-[#C30D9B] bg-[#EFEFEF] text-white placeholder-black text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-white w-[180px] sm:w-[240px]"
  />

{/* Tags colorés + bouton "+" */}
<div className="flex gap-2 relative z-40">
  {/* Affiche les 3 premiers tags */}
  {visibleTags.map((tag) => (
    <button
      key={tag}
      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 whitespace-nowrap shadow-md ${
        selectedTag === tag
          ? 'bg-white text-[#C30D9B] border border-white'
          : 'bg-[#230022] text-white border border-[#C30D9B] hover:bg-[#C30D9B] hover:text-white'
      }`}
    >
      #{tag}
    </button>
  ))}

  {/* Bouton + avec menu déroulant */}
  {hiddenTags.length > 0 && (
    <div className="relative">
      <button
        onClick={() => setShowAllTags(!showAllTags)}
        className="px-3 py-1 rounded-full bg-[#C30D9B] text-white text-sm font-medium shadow-md hover:bg-white hover:text-[#C30D9B] border border-white transition"
      >
        +
      </button>

      {/* Menu déroulant tags supplémentaires */}
      {showAllTags && (
  <div className="absolute left-0 top-10 bg-[#230022] text-white rounded-xl shadow-xl z-50 p-2 w-48 max-h-60 overflow-y-auto border border-[#561447]">
    {hiddenTags.map((tag) => (
      <button
        key={tag}
        onClick={() => {
          setSelectedTag(selectedTag === tag ? null : tag);
          setShowAllTags(false);
        }}
        className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${
          selectedTag === tag
            ? 'bg-[#C30D9B] text-white'
            : 'hover:bg-[#C30D9B] hover:text-white'
        }`}
      >
        #{tag}
      </button>
    ))}
  </div>
)}
    </div>
  )}
</div>
</div>

<MapContainer
  center={[48.8566, 2.3522]}
  zoom={13}
  className="h-full w-full z-0"
  ref={mapRef}
>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {activities
  .filter((event) => {
    const matchesTag = selectedTag ? event.title.toLowerCase().includes(selectedTag.toLowerCase()) : true;
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  })
  .map((event) =>
          event.address?.coordinates ? (
            <Marker
              key={`s_${event.id}`}
              position={[event.address.coordinates[1], event.address.coordinates[0]]}
              eventHandlers={{ click: () => setSelectedEvent(event.id) }}
            >
              <Popup>{event.title}</Popup>
            </Marker>
          ) : null
        )}

        {userLocation && (
<Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
  <Popup ref={userPopupRef} autoClose={false} closeOnClick={false} autoPan={false}>
    Vous êtes ici
  </Popup>
</Marker>
)}
      </MapContainer>

      {weather && (
        <div className="absolute top-4 right-4 z-30 bg-[#230022] rounded-xl shadow-lg px-4 py-3 w-60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Météo actuelle</h3>
            <CloudSun className="text-yellow-300" />
          </div>
          <p className="text-3xl font-bold text-white">{weather.temp}°C</p>
          <p className="text-sm text-gray-200">{weather.description}</p>
        </div>
      )}

      {selectedEvent && (
        <div
          id="overlay"
          className={`absolute top-0 left-0 z-40 h-screen w-screen ${fullscreenEvent ? 'bg-black/60' : ''}`}
          onClick={handleOutsideClick}
        >
          <div
            className={`absolute ${
              fullscreenEvent
                ? 'top-10 left-1/2 transform -translate-x-1/2 w-[90%] h-[80%]'
                : 'top-[100px] left-4 w-[360px]'
            } z-50 bg-[#230022] rounded-xl p-4 shadow-xl transition-all duration-300 overflow-hidden`}
          >
            {activities
              .filter((e) => e.id === selectedEvent)
              .map((event) => (
                <div key={event.id} className="text-white flex flex-col h-full">
                  <div onClick={() => handleCardClick(event.id)} className="cursor-pointer mb-2">
                    <h2 className="text-lg font-semibold mb-1">{event.title}</h2>
                    <p className="text-sm text-gray-300 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      {new Date(event.event_datetime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-300 mb-2">
                      <Star className="inline w-4 h-4 mr-1" />
                      Adresse géolocalisée
                    </p>
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-md mb-2"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    <p className="text-sm text-gray-200">{event.description}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJeSors(event);
                      }}
                      className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-xl w-full transition"
                    >
                      Je sors !
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
