import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, X, Heart, MessageSquare } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import { jwtDecode } from 'jwt-decode';

// ✅ Use shared reverse geocoding util
import { reverseGeocode } from '../lib/geolocationUtils';

type JwtPayload = {
  user_id: number;
};

type ActivityRow = {
  id: number;
  title: string;
  description: string | null;
  event_datetime: string;
  address: { coordinates?: [number, number] } | null; // [lng, lat]
};

const Sorties: React.FC = () => {
  const [savedEvents, setSavedEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ new loading flag

  useEffect(() => {
    const fetchUserActivities = async () => {
      setLoading(true); // start loading
      const token = localStorage.getItem('token');
      if (!token) {
        setSavedEvents([]);
        setLoading(false);
        return;
      }

      const decoded = jwtDecode<JwtPayload>(token);
      const userId = decoded.user_id;
      const supabase = createAuthedSupabaseClient(token);

      const { data: userLinks, error: linkError } = await supabase
        .from('user_activities')
        .select('activity_id')
        .eq('user_participates', true)
        .eq('user_id', userId);

      if (linkError) {
        console.error('Erreur récupération user_activities :', linkError);
        setSavedEvents([]);
        setLoading(false);
        return;
      }

      const activityIds = (userLinks || []).map((link) => link.activity_id);
      if (activityIds.length === 0) {
        setSavedEvents([]);
        setLoading(false);
        return;
      }

      const { data: rawActivities, error: activityError } = await supabase
        .from('activities')
        .select('id, title, description, event_datetime, address')
        .in('id', activityIds)
        .eq('status_id', 3);

      if (activityError) {
        console.error('Erreur récupération activités :', activityError);
        setSavedEvents([]);
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(
        ((rawActivities as ActivityRow[]) || []).map(async (activity) => {
          const { data: blobs } = await supabase
            .from('activity_blobs')
            .select('blob_link')
            .eq('activity_id', activity.id)
            .limit(1);

          // 🔁 Proper geocoding using shared util (with localStorage cache inside)
          let location = 'Lieu non précisé';
          const coords = activity.address?.coordinates;
          if (Array.isArray(coords) && coords.length === 2) {
            const [lng, lat] = coords; // stored as [lng, lat]
            try {
              location = await reverseGeocode(lat, lng);
            } catch {
              location = 'Lieu non précisé';
            }
          }

          return {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            image: blobs?.[0]?.blob_link || '/placeholder.jpg',
            date: new Date(activity.event_datetime).toLocaleDateString(),
            location,
            // TODO: replace with real count from user_activities if/when you want it
            participants: Math.floor(Math.random() * 500) + 1,
          };
        })
      );

      setSavedEvents(enriched);
      setLoading(false); // finished loading
    };

    fetchUserActivities();
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const removeEvent = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const { user_id } = jwtDecode<JwtPayload>(token);
    const supabase = createAuthedSupabaseClient(token);

    // ✅ Safer delete (scoped to this user)
    const { error } = await supabase
      .from('user_activities')
      .delete()
      .eq('activity_id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Erreur suppression user_activities :', error.message);
      alert('❌ Échec de la suppression.');
      return;
    }

    setSavedEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-12">Mes sorties préférées</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <p className="text-white/70 col-span-full text-center">Chargement des sorties...</p>
        ) : savedEvents.length > 0 ? (
          savedEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                setSelectedEvent(event);
                setShowComments(false);
              }}
              className="bg-[#2e0033] rounded-2xl overflow-hidden border border-[#c30d9b] hover:border-[#e52d52] transition-all duration-300 cursor-pointer"
            >
              <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
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
          onTouchStart={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#2e0033] rounded-2xl p-6 w-[calc(100%-2rem)] max-w-lg sm:max-w-3xl max-h-[85vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
              className="w-full h-[250px] object-cover rounded-xl mb-4"
            />
            <h2 className="text-2xl font-bold text-[#c30d9b] mb-2">{selectedEvent.title}</h2>
            <div className="overflow-y-scroll max-h-[250px] pr-3 scrollbar-thin scrollbar-thumb-[#e52d52] scrollbar-track-[#230022] mb-4">
              <p className="text-base text-white/90 leading-relaxed">{selectedEvent.description}</p>
              <p className="text-white/80 text-lg mt-4">
                <strong>Date :</strong> {selectedEvent.date}
              </p>
              <p className="text-white/80 text-lg">
                <strong>Lieu :</strong> {selectedEvent.location}
              </p>
            </div>

            <div className="border-t border-[#e52d52] pt-4 mt-4 flex justify-between items-center">
              <LikeButton activityId={selectedEvent.id} />
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

                        {/* Bouton Fermer — mobile only */}
            <button
              className="sm:hidden mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl"
              onClick={() => setSelectedEvent(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LikeButton = ({ activityId }: { activityId: number }) => {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLike = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { user_id } = jwtDecode<JwtPayload>(token);
      const supabase = createAuthedSupabaseClient(token);

      const { data, error } = await supabase
        .from('user_activities')
        .select('activity_is_liked')
        .eq('user_id', user_id)
        .eq('activity_id', activityId)
        .maybeSingle();

      if (!error && data?.activity_is_liked) {
        setLiked(true);
      }

      setLoading(false);
    };

    fetchLike();
  }, [activityId]);

  const toggleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const { user_id } = jwtDecode<JwtPayload>(token);
    const supabase = createAuthedSupabaseClient(token);

    const { data, error } = await supabase
      .from('user_activities')
      .upsert(
        [
          {
            user_id,
            activity_id: activityId,
            activity_is_liked: !liked,
          },
        ],
        { onConflict: 'user_id, activity_id' }
      )
      .select();

    if (error) {
      console.error('Erreur upsert like :', error);
    }

    if (data?.length) {
      await supabase
        .from('user_activities')
        .update({ last_interacted: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('activity_id', activityId);
    }

    setLiked(!liked);
  };

  return (
    <button
      disabled={loading}
      onClick={toggleLike}
      className={`flex items-center gap-2 transition ${
        liked ? 'text-red-500' : 'text-[#e52d52] hover:text-white'
      }`}
    >
      <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
      {liked ? "J'aime déjà" : "J'aime"}
    </button>
  );
};

export default Sorties;