import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import legalContent from '../assets/politiqueConfidentialite.md?raw';
import { formatContent } from '../lib/formatMarkdown';
import { FileText } from 'lucide-react';

const PolitiqueConfidentialitePage = () => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    setContent(legalContent);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-4xl">
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-r from-[#c30d9b] via-[#e52d52] to-[#c30d9b] shadow-2xl">
          <div className="rounded-3xl bg-[#2e0033]/90 backdrop-blur-xl p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
               <div className="mx-auto mb-4 sm:mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/10 bg-white/5">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Politique de Confidentialité
              </h1>
            </div>

            {/* Contenu (long) — zone scrollable responsive */}
            <div className="max-h-[65vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 custom-scroll">
              {content ? (
                <div
                  className="max-w-none text-white
                  [&>*]:text-white
                  [&_p]:text-white/90
                  [&_h2]:text-white [&_h3]:text-white
                  [&_strong]:text-white
                  [&_a]:text-pink-300 hover:[&_a]:underline
                  [&_li]:text-white/90
                  [&_code]:text-pink-200"
                  dangerouslySetInnerHTML={{ __html: formatContent(content) }}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                  <p className="text-white/70">Chargement de la politique de confidentialité...</p>
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-white/60">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#C30D9B] hover:bg-[#e52d52] text-white font-semibold transition-transform transform hover:scale-105"
              >
                Retour à l’accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolitiqueConfidentialitePage;
