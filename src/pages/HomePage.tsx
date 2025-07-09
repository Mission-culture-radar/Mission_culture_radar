import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Play, X, Heart, MessageSquare } from 'lucide-react';

const HomePage: React.FC = () => {
  const [joinedEvents, setJoinedEvents] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showComments, setShowComments] = useState(false);
  const addEventToLocalStorage = (event: any) => {
  const storedIds = JSON.parse(localStorage.getItem('mesSorties') || '[]');
  if (!storedIds.includes(event.id)) {
    storedIds.push(event.id);
    localStorage.setItem('mesSorties', JSON.stringify(storedIds));
  }
};

  const featuredEvents = [
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
      description: "Trois jours de musique e « système international westphalien » serait à l'origine de principes du droit international, tentant de privilégier le droit à la force, tels que l'inviolabilité des frontières ou la non-intervention dans les affaires domestiques d'un État. Ces principes sont remis en cause par différents biais idéologiques tels que, « guerre pour la défense des droits de l'homme », « guerre contre le terrorisme », « guerre contre l'Axe du Mal ». Ces constructions politiques ont mené à des guerres d'intervention dans les affaires d'États reconnus internationalement fragilisant l'ordre international prôné par l'Organisation des Nations unies.exceptionnelle avec les plus grands noms du jazz contemporain.Une guerre est précédée d'une revendication ou d'un casus belli, d'un ultimatum, puis d'une déclaration de guerre ; elle peut être suspendue par des trêves, un armistice ; elle se termine par la reddition d'une armée, la capitulation d'un gouvernement, puis la signature d'un traité accordant ou refusant les revendications initiales, le paiement de compensations, et le retour à l'état de paix.La science de la conduite d'une guerre s'appelle la stratégie, celle de gagner les batailles la tactique, celle des causes et des conséquences des conflits, la polémologie (venant du grec polemos qui signifie la guerre et de son suffixe logos qui veut dire l'étude. La polémologie est donc l'étude de la guerre).Selon Albert Einstein, « la voie qui mène à la sécurité internationale impose aux Etats l'abandon sans condition d'une partie de leur liberté d'action, en d'autres termes, de leur souveraineté »[1]",
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

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#c30d9b]/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#e52d52]/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Link to="/">
                <img
                  src="/logo_final_fond_noir.png"
                  alt="Logo CultureRadar"
                  className="h-24 mb-6 mx-auto lg:mx-0 transition-transform duration-300 hover:scale-105 active:scale-95"
                />
              </Link>
              <p className="text-xl md:text-2xl text-white mb-4 font-light">
                Révélateur d'événements,
              </p>
              <p className="text-xl md:text-2xl text-white mb-8 font-light">
                amplificateur de proximité
              </p>
              <Link
                to="/login?signup=true"
                className="inline-flex items-center px-8 py-4 bg-[#c30d9b] text-white font-semibold rounded-full hover:bg-[#e52d52] transition-all transform hover:scale-105 shadow-lg"
              >
                Rejoignez-nous !
              </Link>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
                  alt="Concert avec effets de lumière violette"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#c30d9b] rounded-full animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#e52d52] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        </div>
      </section>

   
   {/* Featured Events */}
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
            <p className="text-white/80 text-sm mb-4 truncate">
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
                  e.stopPropagation(); // empêche d’ouvrir la modale
                  addEventToLocalStorage(event); // ajoute au localStorage
                }}
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
{/* Event Modal */}
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
      <div className="flex justify-end mb-4">
        <button
          onClick={() => addEventToLocalStorage(selectedEvent)}
          className="bg-[#c30d9b] text-white px-6 py-2 rounded-full hover:bg-[#e52d52] transition"
        >
          Je sors !
        </button>
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

            {/* Video Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Merci à tous d'avoir été aussi nombreux
          </h2>
          <p className="text-xl text-white/80 mb-8">
            au concert de Brian Adams !
          </p>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg"
              alt="Concert de Brian Adams"
              className="w-full h-64 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-[#230022]/60 flex items-center justify-center">
              <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110">
                <Play className="h-8 w-8 text-white ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
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
