import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import ReactGA from 'react-ga4';
const GA_ID = 'G-BL32PKV7LK';

interface LayoutProps {
  children: React.ReactNode;
}

type JwtPayload = {
  user_id: number;
  role_id: number;
  [key: string]: any;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    ReactGA.initialize(GA_ID);
  }, []);

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location.pathname]);

  const fetchUserData = useCallback(async (userId: number, token: string) => {
    try {
      const res = await fetch(`https://ssfmhopnysidfqxdhgaa.supabase.co/rest/v1/users?id=eq.${userId}`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Erreur HTTP :", res.status, errText);
        throw new Error('Erreur lors de la récupération des données utilisateur');
      }

      const users = await res.json();
      const user = users[0];

      if (user) {
        setRoleId(user.role_id ?? null);
        setProfilePicUrl(user.pfp_link ?? null);
      } else {
        console.warn("⚠️ Aucun utilisateur trouvé");
        setRoleId(null);
        setProfilePicUrl(null);
      }
    } catch (e) {
      console.error('❌ Exception JS dans fetchUserData :', e);
      setRoleId(null);
      setProfilePicUrl(null);
    } finally {
      setIsRoleLoaded(true);
    }
  }, []);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const userId = decoded.user_id;
          if (userId) {
            fetchUserData(userId, token);
          } else {
            setRoleId(null);
            setProfilePicUrl(null);
            setIsRoleLoaded(true);
          }
        } catch (e) {
          console.error('Erreur décodage JWT', e);
          setRoleId(null);
          setProfilePicUrl(null);
          setIsRoleLoaded(true);
        }
      } else {
        setIsLoggedIn(false);
        setRoleId(null);
        setProfilePicUrl(null);
        setIsRoleLoaded(true);
      }
    };

    checkLogin();
    window.addEventListener('authChanged', checkLogin);
    return () => {
      window.removeEventListener('authChanged', checkLogin);
    };
  }, [location.pathname, fetchUserData]);

  if (!isRoleLoaded) return null;

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Carte', href: '/map' },
    ...(isLoggedIn
      ? roleId === 1
        ? [{ name: 'Demander à être créateur', href: '/become-creator' }]
        : [{ name: 'Espace créateur', href: '/creator' }]
      : []),
    { name: 'Mes sorties', href: '/sorties' },
    { name: 'Premium', href: '/premium' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <nav className="sticky top-0 z-50 w-full bg-[#230022] backdrop-blur-md border-b border-[#561447]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="transform transition-transform duration-200 active:scale-90">
                <img
                  src="/logo_final_fond_noir.png"
                  alt="Logo CultureRadar"
                  className="h-10 sm:h-12 lg:h-14 transition-transform duration-300 hover:scale-105"
                />
              </Link>
            </div>

            {/* Nav Links + PFP */}
            <div className="hidden md:flex items-center space-x-12 mx-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-base font-medium transition-colors ${isActive(item.href)
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : 'text-gray-300 hover:text-primary-300'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              <Link
                to={isLoggedIn ? '/profile' : '/login'}
                className="group relative flex items-center justify-center h-10 w-10 rounded-full overflow-hidden bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 transform transition-all hover:scale-110 border border-white/20 shadow-md"
              >
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt="Mon compte"
                    onError={() => setProfilePicUrl(null)}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-300 hover:text-white"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-dark-900/95 backdrop-blur-md border-t border-dark-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${isActive(item.href)
                    ? 'text-primary-400 bg-dark-800/50'
                    : 'text-gray-300 hover:text-primary-300 hover:bg-dark-800/30'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="px-3 py-2">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Link
                to={isLoggedIn ? '/profile' : '/login'}
                className="block mx-3 my-2 text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                {isLoggedIn ? 'Mon compte' : 'Se connecter'}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow relative z-10">{children}</main>

      <footer className="bg-[#230022] border-t-[1px] border-[#561447] mt-auto text-xs py-2">
        <div className="text-center text-white/70">
          <p>
            &copy; 2025 Culture Radar. Projet Étudiant. |
            <Link to="/mentions-legales" className="text-purple-400 hover:underline"> Mentions légales</Link> |
            <Link to="/cgu-cgv" className="text-purple-400 hover:underline"> CGU/CGV</Link> |
            <Link to="/politique-confidentialite" className="text-purple-400 hover:underline"> Politique de confidentialité</Link>
          </p>


        </div>
      </footer>
    </div>
  );
};

export default Layout;