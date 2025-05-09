// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { useEffect, useState } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import styles from './app.module.css';
import { Media } from '@kanora/shared-types';
import { ApiService } from '@kanora/data-access';
import { Button, MediaCard } from '@kanora/ui';

const HomePage = () => {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getAllMedia();
        if (response.success && response.data) {
          setMediaItems(response.data);
        } else {
          setError(response.error || 'Failed to load media');
        }
      } catch (err) {
        setError('An error occurred while fetching media');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  const handleMediaClick = (media: Media) => {
    console.log('Media clicked:', media.title);
    // In a real app, navigate to media details page
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Media Library</h1>
      
      {loading && <div className={styles.loading}>Loading media...</div>}
      
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}
      
      {!loading && !error && mediaItems.length === 0 && (
        <div className={styles.emptyState}>
          <p>No media items found</p>
        </div>
      )}
      
      <div className={styles.mediaGrid}>
        {mediaItems.map((media) => (
          <MediaCard 
            key={media.id} 
            media={media}
            onClick={handleMediaClick}
          />
        ))}
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className={styles.container}>
    <h1 className={styles.heading}>About Kanora</h1>
    <p>Kanora is a locally hosted media server application built with Nx, React, and Expo.</p>
    <p>It allows you to stream your own media files to various devices on your local network.</p>
    <Button variant="outline" onClick={() => window.history.back()}>
      Go Back
    </Button>
  </div>
);

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>Kanora</div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Home</Link>
          <Link to="/about" className={styles.navLink}>About</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Kanora Media Server</p>
      </footer>
    </div>
  );
}

export default App;
