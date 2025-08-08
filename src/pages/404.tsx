import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
      color: 'white' // Since your site has a dark theme
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page non trouvée</h2>
      <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
        La page que vous cherchez n'existe pas sur Culture Radar.
      </p>
      <Link 
        to="/" 
        style={{ 
          padding: '0.75rem 1.5rem',
          backgroundColor: '#8B5CF6', // Purple to match your theme
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          transition: 'background-color 0.2s'
        }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFoundPage;