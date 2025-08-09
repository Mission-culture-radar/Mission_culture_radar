import React, { useState } from 'react';

const BecomeCreatorPage: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("✅ Votre demande a bien été prise en compte !");
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] to-[#561447] py-16 px-4 text-white flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#2e0033] border border-white/10 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#C30D9B] mb-2">Devenir Créateur</h1>
          <p className="text-white/80 text-sm md:text-base">
            Vous n’avez pas encore les droits pour créer un événement. Merci d'expliquer pourquoi vous souhaitez devenir créateur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            className="w-full h-40 p-4 bg-[#3a1f40] text-white border border-white/10 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C30D9B] resize-none"
            placeholder="Votre message de motivation..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-[#C30D9B] hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            Envoyer la demande
          </button>
        </form>
      </div>
    </div>
  );
};

export default BecomeCreatorPage;
