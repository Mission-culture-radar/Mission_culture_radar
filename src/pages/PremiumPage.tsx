import React from 'react';
import { Check } from 'lucide-react';

const PremiumPage: React.FC = () => {
  const advantages = [
    'Accès à des concerts exclusifs',
    'Visites guidées privées de musées',
    'Contenu culturel sans publicité',
    'Téléchargements pour consultation hors ligne',
    'Événements collaboratifs en temps réel',
    'Support prioritaire pour les membres',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] to-[#561447] pt-8 pb-16 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-left mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Le Pouvoir de la Culture,<br />
            Infini, Présent dans votre main.
          </h1>
          <p className="text-xl mb-2">
            Essayez pendant 1 mois pour 0€.
          </p>
          <p className="text-lg mb-2">
            Seulement x€ par mois ensuite.
          </p>
          <p className="text-lg mb-8">
            Annulable à tout moment.
          </p>

          <button className="bg-[#C30D9B] text-white font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg">
            Passez à CulturePlus !
          </button>
        </div>

        {/* Content Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Accédez à un univers culturel illimité
          </h2>

          {/* Reason #1 */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
                alt="Concert avec effets violets"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent rounded-lg"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Assistez à des concerts exclusifs</h3>
              <p className="leading-relaxed">
                Grâce à CulturePlus, bénéficiez d'invitations prioritaires à des concerts locaux, des showcases privés et des festivals partenaires.
              </p>
              <p className="text-white/80 italic mt-2">
                Exemple : une place offerte pour le concert électro de l'été au Théâtre Antique.
              </p>
            </div>
          </div>

          {/* Reason #2 */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-bold mb-4">Découvrez les coulisses des musées</h3>
              <p className="leading-relaxed">
                Accédez à des visites guidées privées, des nocturnes exclusives et des interviews de conservateurs grâce à votre abonnement CulturePlus.
              </p>
              <p className="text-white/80 italic mt-2">
                Exemple : visite de la collection inédite du musée des Beaux-Arts avec le conservateur.
              </p>
            </div>
            <div className="order-1 md:order-2 relative">
              <img
                src="https://images.pexels.com/photos/1424954/pexels-photo-1424954.jpeg"
                alt="Musée ambiance violette"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-[#230022] rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div></div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">CultureRadar</h3>
              <p className="text-gray-400">sans abonnement</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#C30D9B] mb-2">CulturePlus</h3>
              <p className="text-gray-300">avec abonnement</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-white font-semibold mb-4">Vos avantages</div>
            {advantages.map((advantage, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/10 last:border-b-0">
                <div className="text-white text-sm">{advantage}</div>
                <div className="text-center">
                  <span className="text-gray-500 text-2xl">—</span>
                </div>
                <div className="text-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button className="bg-[#C30D9B] text-white font-semibold px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg text-lg">
            Essayer Gratuitement pour 0€
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;