import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import disaster from '../assets/disaster.jpg';

const NotFoundPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white flex items-center justify-center p-6">
      {/* Blobs d'ambiance */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 bg-[#c30d9b]/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-20 w-96 h-96 bg-[#e52d52]/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-3xl">
        <div className="rounded-3xl bg-[#2e0033]/70 border border-white/10 p-10 text-center shadow-[0_10px_50px_rgba(195,13,155,.25)]">
          {/* Pastille icône */}
          <div className="mx-auto -mt-20 mb-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#c30d9b] to-[#e52d52] p-[3px] shadow-[0_0_30px_rgba(229,45,82,.5)]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#2e0033]">
              <AlertTriangle className="h-12 w-12 text-yellow-300" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mt-2">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mt-1">Page introuvable</h2>

          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Cette page a disparu... peut-être dans un <span className="italic">petit accident</span>.
          </p>

          {/* Image humoristique */}
          <div className="mt-6">
            <img
              src={disaster}
              alt="Disaster Girl"
              className="mx-auto rounded-xl shadow-lg max-w-xs hover:scale-[1.02] transition-transform"
            />
            <p className="mt-2 text-sm text-white/60">Oups... c’est pas moi 🤫</p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C30D9B] hover:bg-[#e52d52] px-6 py-3 font-semibold transition-all hover:scale-[1.03] shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
