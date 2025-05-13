// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styles from './app.module.css';
import { Media } from '@kanora/shared-types';
import { ApiService } from '@kanora/data-access';
import { Button, MediaCard } from '@kanora/ui';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { Dashboard } from './components/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProfilePage } from './components/user/ProfilePage';
import { UserList } from './components/user/UserList';
import { UserForm } from './components/user/UserForm';

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
          <Button variant="primary" onClick={() => window.location.reload()}>
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
          <MediaCard key={media.id} media={media} onClick={handleMediaClick} />
        ))}
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className={styles.container}>
    <h1 className={styles.heading}>About Kanora</h1>
    <p>
      Kanora is a locally hosted media server application built with Nx, React,
      and Expo.
    </p>
    <p>
      It allows you to stream your own media files to various devices on your
      local network.
    </p>
    <Button variant="outline" onClick={() => window.history.back()}>
      Go Back
    </Button>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginForm />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterForm />
            </AuthLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthLayout>
              <ForgotPasswordForm />
            </AuthLayout>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <AuthLayout>
              <ResetPasswordForm />
            </AuthLayout>
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin User Management routes */}
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/users/:id" element={<UserForm />} />
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
