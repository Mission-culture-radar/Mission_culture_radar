import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import CreatorPage from './pages/CreatorPage';
import CreateEventPage from './pages/CreateEventPage';
import PremiumPage from './pages/PremiumPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import Sorties from './pages/Sorties';
import BecomeCreatorPage from './pages/become-creator';
import WarningPage from './pages/warning';
import ActivityDetailPage from './pages/ActivityDetailPage';
import ActivityEditPage from './pages/ActivityEditPage';
import NotFoundPage from './pages/404';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import CguCgvPage from './pages/CguCgvPage.tsx';
import PolitiqueConfidentialitePage from './pages/PolitiqueConfidentialitePage';

function App() {

  // 📌 Ajout du script GTM ici
  useEffect(() => {
    const script = document.createElement("script");
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id=GTM-WVPVN3B6'+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-WVPVN3B6');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement("noscript");
    noscript.innerHTML = `
      <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WVPVN3B6"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
    `;
    document.body.insertBefore(noscript, document.body.firstChild);
  }, []);
  // 📌 Fin ajout script GTM

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/creator" element={<CreatorPage />} />
          <Route path="/create-event" element={<CreateEventPage />} />
          <Route path="/activity/:id" element={<ActivityDetailPage />} />
          <Route path="/activity/:id/edit" element={<ActivityEditPage />} /> 
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sorties" element={<Sorties/>} />
          <Route path="/become-creator" element={<BecomeCreatorPage/>} />
          <Route path="/warning" element={<WarningPage/>} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/cgu-cgv" element={<CguCgvPage/>} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage/>} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
