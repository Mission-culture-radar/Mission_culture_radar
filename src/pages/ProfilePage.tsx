import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const userName = "Luca";
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sections = [
    {
      title: "Gérer votre compte",
      content: ["Modifier mes informations", "Changer mon mot de passe", "Supprimer mon compte"]
    },
    {
      title: "Mes sorties enregistrées",
      content: ["Voir les événements à venir", "Historique des participations"]
    },
    {
      title: "Préférences et abonnements",
      content: ["Newsletter", "Alertes CultureRadar"]
    },
    {
      title: "Sécurité",
      content: ["Authentification", "Confidentialité"]
    },
  ];

  const toggleIndex = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <img
          src="/logo_final_fond_noir.png"
          alt="CultureRadar Logo"
          className="h-20 mx-auto mb-6"
        />

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Bonjour, {userName}
        </h1>

        <div className="mb-8 mt-4">
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher une option..."
              className="w-full pl-10 pr-4 py-3 bg-[#3a1f40] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C30D9B]"
            />
          </div>
        </div>
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-[#2d1b2f] rounded-xl overflow-hidden border border-white/10"
            >
              <button
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg hover:bg-[#3a1f40] transition"
                onClick={() => toggleIndex(index)}
              >
                {section.title}
                {activeIndex === index ? <ChevronUp /> : <ChevronDown />}
              </button>
              {activeIndex === index && (
                <ul className="px-6 pb-4 space-y-2 text-white/80 text-sm list-disc list-inside">
                  {section.content.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
