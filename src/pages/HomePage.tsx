import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Play } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';

const HomePage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem('token');
  setIsLoggedIn(!!token);

  const supabase = createAuthedSupabaseClient(token || ''); // même vide, client reste valide

  const hardcodedIds = [394, 395, 400];

  const fetchEvents = async () => {
    const { data: events } = await supabase
      .from("activities")
      .select("id, title, description, event_datetime, address")
      .in("id", hardcodedIds)
      .eq("status_id", 3);

    const enriched = await Promise.all(
      (events || []).map(async (event) => {
        const { data: blobs } = await supabase
          .from("activity_blobs")
          .select("blob_link")
          .eq("activity_id", event.id)
          .limit(1);

        return {
          ...event,
          image: blobs?.[0]?.blob_link || "/placeholder.jpg",
          date: new Date(event.event_datetime).toLocaleDateString(),
          location: event.address ? "Adresse géolocalisée" : "Lieu non précisé",
          participants: Math.floor(Math.random() * 1000) + 100,
        };
      })
    );

    setFeaturedEvents(enriched);
  };

  fetchEvents();
}, []);

  const truncateText = (text: string, maxLength: number) =>
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white">

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <img
                src="/logo_final_fond_noir.png"
                alt="Logo CultureRadar"
                className="h-24 mb-6 mx-auto lg:mx-0"
              />
              <p className="text-xl md:text-2xl text-white mb-4 font-light">Révélateur d'événements,</p>
              <p className="text-xl md:text-2xl text-white mb-8 font-light">amplificateur de proximité</p>

              <Link
                to={isLoggedIn ? "/premium" : "/login?signup=true"}
                className="inline-flex items-center px-8 py-4 bg-[#c30d9b] text-white font-semibold rounded-full hover:bg-[#e52d52] transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoggedIn ? "Abonnez-vous !" : "Rejoignez-nous !"}
              </Link>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
                  alt="Concert violet"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xl md:text-2xl text-white mb-4 font-light">
              Vous souhaitez explorer tous les événements près de chez vous ?
            </p>
            <Link
              to="/map"
              className="inline-block bg-[#c30d9b] hover:bg-[#e52d52] text-white font-semibold px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
              Voir la carte interactive
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-[#2e0033] rounded-2xl overflow-hidden border border-[#c30d9b] hover:border-[#e52d52] transition-all duration-300 cursor-pointer"
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                  <p className="text-white/80 text-sm mb-4">{truncateText(event.description, 100)}</p>
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
                      className="bg-[#c30d9b] text-white text-xs px-4 py-2 rounded-full hover:bg-[#e52d52] transition"
                    >
                      Je sors !
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Vidéo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Merci à tous d'avoir été aussi nombreux
          </h2>
          <p className="text-xl text-white/80 mb-8">
            au concert exceptionnel de Coldplay ✨
          </p>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/Fpn1imb9qZg?si=jvd12DKfm74P36TB"
              title="Concert de Coldplay"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#230022]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Événements' },
              { number: '200K+', label: 'Participants' },
              { number: '500+', label: 'Organisateurs' },
              { number: '50+', label: 'Villes' },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-3xl md:text-4xl font-bold text-[#c30d9b] group-hover:text-[#e52d52] mb-2">
                  {stat.number}
                </div>
                <div className="text-white/80 group-hover:text-white">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
