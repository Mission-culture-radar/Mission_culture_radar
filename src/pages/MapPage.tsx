import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Star, Menu, CloudSun } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [fullscreenEvent, setFullscreenEvent] = useState<number | null>(null);
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`)
          .then((res) => res.json())
          .then((data) => {
            const temp = data.current.temperature_2m;
            const code = data.current.weathercode;
            const descriptions: Record<number, string> = {
              0: 'Ensoleillé',
              1: 'Principalement clair',
              2: 'Partiellement nuageux',
              3: 'Couvert',
              45: 'Brouillard',
              48: 'Brouillard givrant',
              51: 'Bruine faible',
              53: 'Bruine modérée',
              55: 'Bruine dense',
              61: 'Pluie faible',
              63: 'Pluie modérée',
              65: 'Pluie forte',
              80: 'Averses légères',
              81: 'Averses modérées',
              82: 'Averses fortes'
            };
            setWeather({ temp, description: descriptions[code] || 'Inconnu' });
          });
      });
    }
  }, []);

  const categories = [
    { id: 'all', name: 'Tous', color: 'bg-[#230022]' },
    { id: 'music', name: 'Musique', color: 'bg-[#230022]' },
    { id: 'theater', name: 'Théâtre', color: 'bg-[#230022]' },
    { id: 'art', name: 'Art', color: 'bg-[#230022]' },
    { id: 'dance', name: 'Danse', color: 'bg-[#230022]' },
  ];

  const events = [
    {
      id: 1,
      title: "Festival Électronique",
      category: "music",
      date: "15 Mars 2024",
      location: "Parc des Expositions",
      distance: "2.3 km",
      price: "45€",
      rating: 4.8,
      image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    {
      id: 2,
      title: "Spectacle de Danse Contemporaine",
      category: "dance",
      date: "18 Mars 2024",
      location: "Théâtre National",
      distance: "1.8 km",
      price: "30€",
      rating: 4.6,
      image: "https://images.pexels.com/photos/1484883/pexels-photo-1484883.jpeg",
      latitude: 48.8606,
      longitude: 2.3376,
    },
    {
      id: 3,
      title: "Exposition Interactive",
      category: "art",
      date: "20 Mars 2024",
      location: "Galerie Moderne",
      distance: "3.1 km",
      price: "15€",
      rating: 4.7,
      image: "https://images.pexels.com/photos/442584/pexels-photo-442584.jpeg",
      latitude: 48.8534,
      longitude: 2.3488,
    },
  ];
  const filteredEvents = selectedCategory === 'all'
    ? events
    : events.filter(event => event.category === selectedCategory);

  const center = {
    lat: 48.8566,
    lng: 2.3522,
  };

  const handleCardClick = (eventId: number) => {
    if (fullscreenEvent === eventId) {
      setFullscreenEvent(null); // toggle off
    } else {
      setFullscreenEvent(eventId); // show fullscreen
    }
  };

  const handleAddToSorties = (event: any) => {
    const saved = JSON.parse(localStorage.getItem('mesSorties') || '[]');
    if (!saved.includes(event.id)) {
      saved.push(event.id);
      localStorage.setItem('mesSorties', JSON.stringify(saved));
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2500);
    }
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === 'overlay') {
      setFullscreenEvent(null);
    }
  };

  return (
    <div className="relative h-screen w-screen">
      <MapContainer center={center} zoom={13} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredEvents.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            eventHandlers={{ click: () => setSelectedEvent(event.id) }}
          >
            <Popup>{event.title}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Filtres + Recherche */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 max-w-6xl mx-auto">
        <div className="flex items-center bg-white rounded-full shadow-md px-4 py-2">
          <Menu className="text-gray-600 mr-3 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher dans CultureRadar"
            className="flex-1 text-gray-800 placeholder-gray-500 bg-transparent outline-none"
          />
          <Search className="text-gray-600 ml-3 w-5 h-5" />
        </div>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                selectedCategory === category.id
                  ? `${category.color} text-white`
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Météo */}
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

      {/* Fiche à gauche */}
      {selectedEvent && !fullscreenEvent && (
        <div className="absolute top-[100px] left-4 z-40 bg-[#230022] rounded-xl p-4 w-[360px] shadow-xl cursor-pointer"
             onClick={() => handleCardClick(selectedEvent)}>
          {events
            .filter(e => e.id === selectedEvent)
            .map(event => (
              <div key={event.id} className="text-white">
                <img src={event.image} alt={event.title} className="rounded-lg h-32 w-full object-cover mb-2" />
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="text-sm text-gray-300"><Calendar className="inline w-4 h-4" /> {event.date}</p>
                <p className="text-sm text-gray-300"><MapPin className="inline w-4 h-4" /> {event.location}</p>
                <p className="text-sm text-gray-300"><Star className="inline w-4 h-4" /> {event.rating} • {event.price}</p>
              </div>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreenEvent && (
        <div id="overlay" onClick={handleOutsideClick} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          {events.filter(e => e.id === fullscreenEvent).map(event => (
            <div key={event.id} className="bg-[#230022] rounded-xl p-6 w-[600px] max-w-full text-white relative shadow-2xl">
              <img src={event.image} alt={event.title} className="rounded-lg h-64 w-full object-cover mb-4" />
              <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
              <p><Calendar className="inline w-5 h-5" /> {event.date}</p>
              <p><MapPin className="inline w-5 h-5" /> {event.location}</p>
              <p><Star className="inline w-5 h-5" /> {event.rating} • {event.price}</p>
              <button
                onClick={() => handleAddToSorties(event)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full hover:scale-105 transition"
              >
                Je sors !
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Popup notification */}
      {showPopup && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg z-[9999] animate-fadeInOut">
          Sortie ajoutée à vos événements !
        </div>
      )}
    </div>
  );
};

export default MapPage;
