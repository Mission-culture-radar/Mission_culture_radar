import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const WarningPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#230022] to-[#561447] flex items-center justify-center text-white px-6 py-16 text-center overflow-hidden">

      {/* Effets d’ambiance en arrière-plan */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#c30d9b]/30 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#e52d52]/20 rounded-full blur-3xl animate-float z-0" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -top-20 right-1/3 w-64 h-64 bg-purple-700/20 rounded-full blur-3xl animate-pulse-fast z-0"></div>

      {/* Conteneur avec bordure animée */}
      <div className="relative z-10 p-[3px] rounded-2xl bg-gradient-to-br from-[#C30D9B] via-[#e52d52] to-[#C30D9B] animate-border-spin shadow-2xl max-w-2xl w-full">
        <div className="bg-[#2e0033]/80 backdrop-blur-md rounded-[1rem] p-10 text-white text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-400/20 border-2 border-yellow-500 text-yellow-300 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Attention</h1>
            <p className="text-white/80 text-lg">
              Ce site est un <strong>projet étudiant fictif</strong> développé à des fins pédagogiques.
            </p>
          </div>

          <p className="text-white/70 text-base leading-relaxed mb-6">
            <strong>Aucune fonctionnalité de paiement n’est réelle.</strong> Bien que la plupart des événements affichés existent réellement, les informations présentées ici sont fournies à titre illustratif et ne doivent pas être considérées comme officielles.
          </p>

          <p className="text-white/70 text-sm italic mb-8">
            Merci de votre compréhension ✨
          </p>

          <button
            onClick={() => navigate('/')}
            className="bg-[#C30D9B] hover:bg-[#e52d52] text-white font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 10s infinite;
        }
        .animate-pulse-fast {
          animation: pulse 6s infinite;
        }
        .animate-fade-in {
          animation: fadeIn 1.2s ease-in-out forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes borderSpin {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-border-spin {
          background-size: 200% 200%;
          animation: borderSpin 6s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default WarningPage;
