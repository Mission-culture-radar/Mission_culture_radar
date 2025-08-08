import { useEffect, useState } from 'react';
import legalContent from '../assets/legal.md?raw';
import { formatContent } from '../lib/formatMarkdown';


const MentionsLegalesPage = () => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    setContent(legalContent);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Mentions Légales
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mt-4"></div>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-purple-500/20">
          {content ? (
            <div 
              className="max-w-none text-white [&>*]:text-white [&_p]:text-white [&_li]:text-gray-300 [&_span]:text-white [&_div]:text-white"
              style={{ color: 'white' }}
              dangerouslySetInnerHTML={{ 
                __html: formatContent(content) 
              }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Chargement du contenu légal...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Ces mentions légales sont applicables à l'ensemble du site Culture Radar
          </p>
        </div>

      </div>
    </div>
  );
};

export default MentionsLegalesPage;