import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, X, Heart, MessageSquare } from 'lucide-react';

const Sorties: React.FC = () => {
  const [savedEvents, setSavedEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const storedIds = JSON.parse(localStorage.getItem("mesSorties") || "[]");

    const allEvents = [
      {
        id: 1,
        title: "Concert Électronique Immersif",
        description: "Une expérience sonore unique avec des artistes internationaux dans un cadre exceptionnel.",
        image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg",
        date: "15 Mars 2024",
        location: "Palais des Sports",
        participants: 850,
      },
      {
        id: 2,
        title: "Festival Jazz & Blues",
        description: "Trois jours de musique exceptionnelle avec les plus grands noms du jazz contemporain.",
        image: "https://images.pexels.com/photos/1424954/pexels-photo-1424954.jpeg",
        date: "22 Mars 2024",
        location: "Centre Culturel",
        participants: 1200,
      },
      {
        id: 3,
        title: "Exposition Art Numérique",
        description: "Découvrez l'art du futur à travers des installations interactives révolutionnaires.",
        image: "https://images.pexels.com/photos/442584/pexels-photo-442584.jpeg",
        date: "10 Avril 2024",
        location: "Musée d'Art Moderne",
        participants: 300,
      },
    ];

    const filteredEvents = allEvents.filter((event) => storedIds.includes(event.id));
    setSavedEvents(filteredEvents);
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const removeEvent = (id: number) => {
    const updatedEvents = savedEvents.filter(event => event.id !== id);
    setSavedEvents(updatedEvents);
    const updatedIds = updatedEvents.map(event => event.id);
    localStorage.setItem("mesSorties", JSON.stringify(updatedIds));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-12">Mes sorties préférées</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {savedEvents.length > 0 ? (
          savedEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                setSelectedEvent(event);
                setShowComments(false);
              }}
              className="bg-[#2e0033] rounded-2xl overflow-hidden border border-[#c30d9b] hover:border-[#e52d52] transition-all duration-300 cursor-pointer"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                <p className="text-white/80 text-sm mb-4 leading-snug line-clamp-3">
                  {truncateText(event.description, 100)}
                </p>
                <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center text-white/80 gap-1">
                    <Users className="h-4 w-4" />
                    <span>{event.participants} participants</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEvent(event.id);
                    }}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full transition"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white/70 col-span-full text-center">Aucune sortie sélectionnée pour le moment.</p>
        )}
      </div>

      {/* Modale d'événement */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#2e0033] rounded-2xl p-6 max-w-3xl w-full relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-[#e52d52]"
              onClick={() => setSelectedEvent(null)}
            >
              <X size={28} />
            </button>
            <img
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="w-full h-[400px] object-cover rounded-xl mb-6"
            />
            <h2 className="text-[36px] font-bold text-[#c30d9b] mb-4">{selectedEvent.title}</h2>
            <div className="overflow-y-scroll max-h-[250px] pr-3 scrollbar-thin scrollbar-thumb-[#e52d52] scrollbar-track-[#230022] mb-4">
              <p className="text-[25px] text-white/90 leading-relaxed">
                {selectedEvent.description}
              </p>
              <p className="text-white/80 text-lg mt-4"><strong>Date :</strong> {selectedEvent.date}</p>
              <p className="text-white/80 text-lg"><strong>Lieu :</strong> {selectedEvent.location}</p>
            </div>
            <div className="border-t border-[#e52d52] pt-4 mt-4">
              <div className="flex justify-between items-center">
                <button className="flex items-center gap-2 text-[#e52d52] hover:text-white transition">
                  <Heart className="h-5 w-5" /> J'aime
                </button>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 text-[#e52d52] hover:text-white transition"
                >
                  <MessageSquare className="h-5 w-5" /> Commenter
                </button>
              </div>
              {showComments && (
                <div className="mt-4 max-h-32 overflow-y-scroll scrollbar-thin scrollbar-thumb-[#c30d9b] scrollbar-track-[#230022] text-white/80 text-sm bg-[#230022] p-3 rounded-lg">
                  <p className="mb-2">💬 Super événement !</p>
                  <p className="mb-2">🔥 J’y étais l’an dernier, incroyable !</p>
                  <p>😍 Trop hâte !</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sorties;
