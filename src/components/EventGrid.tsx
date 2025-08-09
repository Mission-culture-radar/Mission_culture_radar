import React, { useState } from 'react';
import { Calendar, MapPin, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type EventItem = {
  id: number;
  image: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  participants: number;
  status_id: number;
};

interface EventGridProps {
  events: EventItem[];
  onClick?: (id: number) => void;
  truncateText?: (text: string, max: number) => string;
  onDeleteClick?: (id: number) => void; // ✅ New prop
}

const EventGrid: React.FC<EventGridProps> = ({ events, onClick, truncateText, onDeleteClick }) => {
  const navigate = useNavigate();
  const INITIAL_COUNT = 4;
  const INCREMENT = 8;

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const handleClick = (id: number) => {
    if (onClick) onClick(id);
    else navigate(`/activity/${id}`);
  };

  const isShowingAll = visibleCount >= events.length;
  const hasEvents = events.length > 0;

  const handleToggle = () => {
    if (isShowingAll) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount((prev) => Math.min(prev + INCREMENT, events.length));
    }
  };

  const getStatusBadge = (status_id: number) => {
    const base = 'inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-medium uppercase tracking-wide ';
    const color =
      status_id === 4
        ? 'bg-red-600 text-white'
        : status_id === 2 || status_id === 5
        ? 'bg-orange-500 text-white'
        : status_id === 1
        ? 'bg-[#3b0a3b] text-white'
        : 'bg-green-600 text-white';

    const label = {
      1: 'Brouillon',
      2: 'Soumis',
      3: 'Publié',
      4: 'Caché',
      5: 'À revoir',
    }[status_id] ?? 'Inconnu';

    return <span className={base + color}>{label}</span>;
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="relative w-full max-w-screen-xl">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-6 w-full">
          {hasEvents ? (
            events.slice(0, visibleCount).map((event) => (
              <div
                key={event.id}
                onClick={() => handleClick(event.id)}
                className="relative bg-[#2e0033] rounded-xl overflow-hidden border border-[#c30d9b] hover:border-[#e52d52] transition-all duration-300 cursor-pointer text-sm"
              >
                {/* 🗑️ Delete Button */}
                {onDeleteClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent card click
                      onDeleteClick(event.id);
                    }}
                    className="absolute top-2 right-2 bg-[#C30D9B] hover:bg-red-600 text-white rounded-full p-1 z-10"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-36 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-[1.05rem] font-bold text-white mb-1">{event.title}</h2>

                  {/* Badge */}
                  <div className="mb-2">
                    {getStatusBadge(event.status_id)}
                  </div>

                  <p
                    className={`text-sm mb-2 leading-snug line-clamp-2 ${
                      !event.description ? 'text-red-300' : 'text-white/80'
                    }`}
                  >
                    {!event.description
                      ? '🚫 Description manquante'
                      : truncateText
                      ? truncateText(event.description, 90)
                      : event.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-white/70 gap-1 text-xs mt-2">
                    <Users className="h-4 w-4" />
                    <span>{event.participants} participants</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white/70 col-span-full text-center">Aucun événement à afficher.</p>
          )}
        </div>

        {hasEvents && !isShowingAll && (
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#230022] to-transparent z-10" />
        )}
      </div>

      {hasEvents && events.length > INITIAL_COUNT && (
        <button
          onClick={handleToggle}
          className="z-20 mt-6 mb-6 px-6 py-2 rounded-full bg-[#C30D9B] hover:bg-[#e52d52] text-white font-semibold text-sm transition-all"
        >
          {isShowingAll ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
};

export default EventGrid;