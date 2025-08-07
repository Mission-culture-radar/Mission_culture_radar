import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Calendar, CloudSun, Star } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import markerGreen from '../assets/marker-icon-2x-green.png';
import markerRed from '../assets/marker-icon-2x-red.png';
import markerShadow from '../assets/marker-shadow.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

import userIconUrl from '../assets/user.png';

// Icône par défaut Leaflet
const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});
L.Marker.prototype.options.icon = DefaultIcon;

const greenIcon = L.icon({
  iconUrl: markerGreen,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const redIcon = L.icon({
  iconUrl: markerRed,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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
  tags?: string[];
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
  const [locationCache, setLocationCache] = useState<Record<number, string>>({});
  const [locationText, setLocationText] = useState<string>('Adresse géolocalisée');

  const getUserAgent = (): string => {
    const host = window.location.hostname;
    if (host.includes('localhost')) return 'CultureRadarDev/0.1 (+http://localhost:5173)';
    if (host.includes('ias-b3-lyon-g2.site')) return 'CultureRadar/1.0 (+https://ias-b3-lyon-g2.site/)';
    return 'CultureRadar/1.0 (+https://cultureradar.fr)';
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const cacheKey = `geocode:${lat.toFixed(6)}:${lng.toFixed(6)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: { 'User-Agent': getUserAgent() },
        }
      );
      const json = await response.json();
      const display = json.display_name || 'Adresse non trouvée';
      const parts = display.split(',').map((s: string) => s.trim());
      const isFirstPartNumeric = /^\d+/.test(parts[0]);
      const truncated = parts.slice(0, isFirstPartNumeric ? 2 : 3).join(', ');
      localStorage.setItem(cacheKey, truncated);
      return truncated;
    } catch (error) {
      console.warn('Erreur de géocodage inversé:', error);
      return 'Lieu non précisé';
    }
  };


  const fetchLocationText = async (activity: Activity) => {
    if (!activity || !activity.address?.coordinates) {
      console.warn('❌ Invalid activity or missing coordinates:', activity);
      return;
    }

    const [lng, lat] = activity.address.coordinates;

    // Already cached?
    if (locationCache[activity.id]) {
      setLocationText(locationCache[activity.id]);
      return;
    }

    const loc = await reverseGeocode(lat, lng);
    setLocationCache((prev) => ({ ...prev, [activity.id]: loc }));
    setLocationText(loc);
  };




  // Géolocalisation + météo
  useEffect(() => {

    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
      activity_tags (
        tags (
          name
        )
      )
    `)
        .eq('status_id', 3);

      if (error) {
        console.error('Erreur chargement des tags :', error.message);
      } else {
        // Flatten all tag names from all activities
        const allTagNames = data.flatMap(activity =>
          activity.activity_tags.map(tagObj => tagObj.tags?.name)
        );

        // Remove duplicates
        const uniqueTagNames = [...new Set(allTagNames.filter(Boolean))];

        setTags(uniqueTagNames);
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
          console.log("🌡️ Température détectée :", temp, "-", descriptions[code]);
        });
    });
  }, []);

  // Chargement des activités
  useEffect(() => {
    const fetchActivities = async () => {
      const { data: raw } = await supabase
        .from('activities')
        .select(`
          id,
          title,
          description,
          event_datetime,
          address,
          activity_tags (
            tags (
              name
            )
          )
        `)
        .eq('status_id', 3);

      const enriched = await Promise.all(
        (raw || []).map(async (activity) => {
          const { data: blobs } = await supabase
            .from('activity_blobs')
            .select('blob_link')
            .eq('activity_id', activity.id)
            .limit(1);

          const tagNames =
            activity.activity_tags?.map((tagObj) => tagObj.tags?.name?.toLowerCase()) || [];

          return {
            ...activity,
            tags: tagNames,
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

  const isBadWeather = (weather: { temp: number; description: string } | null) => {
    if (!weather) return false;

    const desc = weather.description.toLowerCase();
    const temp = weather.temp;

    const isRainy =
      desc.includes("pluie") || desc.includes("averses") || desc.includes("brouillard") || desc.includes("orage");
    const isTooCold = temp < 10;
    const isTooHot = temp > 30;

    return isRainy || isTooCold || isTooHot;
  };

  const isOutdoorEvent = (title: string, description: string) => {
    const keywords = ["extérieur", "exterieur", "outdoor", "plein air"];
    const combinedText = `${title} ${description}`.toLowerCase();

    return keywords.some((kw) => combinedText.includes(kw));
  };

  return (
    <div className="relative h-screen w-full">
      {/* Barre de recherche + tags (en ligne, haut gauche, sans fond) */}
      <div className="absolute top-4 left-4 right-4 sm:left-16 z-40 flex flex-wrap items-start gap-3 pr-4">
        {/* Barre de recherche bien visible */}
        <input
          type="text"
          placeholder="Recherche..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded-full border border-[#C30D9B] bg-[#EFEFEF] text-black placeholder-black text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-white w-[180px] sm:w-[240px]"
        />

        {/* Tags colorés + bouton "+" */}
        <div className="flex gap-2 relative z-40">
          {/* Affiche les 3 premiers tags */}
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 whitespace-nowrap shadow-md ${selectedTag === tag
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
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${selectedTag === tag
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
            const matchesTag = selectedTag
              ? event.tags?.includes(selectedTag.toLowerCase()) ||
              event.title.toLowerCase().includes(selectedTag.toLowerCase())
              : true;

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
                icon={
                  isOutdoorEvent(event.title, event.description) && isBadWeather(weather)
                    ? redIcon
                    : greenIcon
                }
                eventHandlers={{
                  click: async () => {
                    await fetchLocationText(event); // pass whole event
                    setSelectedEvent(event.id);
                  }
                }}

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
        <div className="absolute top-4 right-4 z-30 bg-[#230022] rounded-xl shadow-lg px-4 py-3 w-52 sm:w-60">
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
          className={`fixed inset-0 z-40 ${fullscreenEvent ? 'bg-black/60' : ''} overflow-y-auto`}
          onClick={handleOutsideClick}
        >
          <div
            className={`absolute ${fullscreenEvent
              ? 'top-10 left-1/2 transform -translate-x-1/2 w-[90%] h-[80%]'
              : 'top-[100px] left-4 right-4 max-w-sm mx-auto'
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
                      {locationText}
                    </p>
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-md mb-2"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    <p className="text-sm text-gray-200">{event.description}</p>
                    {isOutdoorEvent(event.title, event.description) && isBadWeather(weather) && (
                      <div className="mt-2 p-2 bg-red-700 text-white rounded text-sm text-center">
                        ⚠️ Événement extérieur & météo défavorable
                      </div>
                    )}
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
