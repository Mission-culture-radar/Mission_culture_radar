import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import CreateEventPage from './pages/CreateEventPage';
import PremiumPage from './pages/PremiumPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import Sorties from './pages/Sorties';
import BecomeCreatorPage from './pages/become-creator';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/create-event" element={<CreateEventPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
           <Route path="/sorties" element={<Sorties/>} />
           <Route path="/become-creator" element={<BecomeCreatorPage/>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;