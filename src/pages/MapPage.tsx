import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Calendar, CloudSun, Star } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import { jwtDecode } from 'jwt-decode';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});
L.Marker.prototype.options.icon = DefaultIcon;

type Activity = {
  id: number;
  title: string;
  description: string;
  event_datetime: string;
  address: { coordinates: [number, number] } | null;
  image: string;
};

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [fullscreenEvent, setFullscreenEvent] = useState<number | null>(null);
  const token = localStorage.getItem('token');
  const supabase = createAuthedSupabaseClient(token || '');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`)
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
            image: blobs?.[0]?.blob_link
              ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/activity-files/${blobs[0].blob_link}`
              : '/placeholder.jpg',
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

  const center = userLocation || { lat: 48.8566, lng: 2.3522 };

  return (
    <div className="relative h-screen w-screen">
      <MapContainer center={center} zoom={13} className="h-full w-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {activities.map((event) =>
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
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Vous êtes ici</Popup>
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
      } 
      z-50 bg-[#230022] rounded-xl p-4 shadow-xl transition-all duration-300 overflow-hidden`}
    >
      {activities
        .filter((e) => e.id === selectedEvent)
        .map((event) => (
          <div key={event.id} className="text-white flex flex-col h-full">
            {/* Partie CLIQUABLE pour toggle fullscreen */}
            <div
              onClick={() => handleCardClick(event.id)}
              className="cursor-pointer mb-2"
            >
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

            {/* Partie NON cliquable pour actions */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              <p className="text-sm text-gray-200">{event.description}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // désactive le clic parent
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
