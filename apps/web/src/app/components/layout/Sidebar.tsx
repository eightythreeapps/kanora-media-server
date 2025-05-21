import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

// Define a type for navigation items
interface NavItem {
  path: string;
  name: string;
  icon?: JSX.Element; // Optional icon
  adminOnly?: boolean; // For admin-specific links
  show?: boolean; // Conditionally show item
}

// Example icons (replace with actual icons later)
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
  </svg>
);
const MusicIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-.804-.98l-3-1z"></path>
  </svg>
);
const LibraryIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5z"></path>
  </svg>
);
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const AdminIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const PlayingIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { currentTrack } = useAudioPlayer();
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/dashboard', name: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/browse', name: 'Browse Music', icon: <MusicIcon /> },
    { path: '/library', name: 'Manage Library', icon: <LibraryIcon /> },
    {
      path: '/player/now-playing',
      name: 'Now Playing',
      icon: <PlayingIcon />,
      show: !!currentTrack, // Only show if there's a track playing
    },
    { path: '/settings', name: 'Settings', icon: <SettingsIcon /> },
    {
      path: '/admin/users',
      name: 'User Management',
      icon: <AdminIcon />,
      adminOnly: true,
    },
  ];

  return (
    <aside className="relative hidden w-64 h-screen shadow-xl bg-slate-800 sm:block">
      <div className="p-6">
        <Link
          to="/dashboard"
          className="text-3xl font-semibold text-white uppercase hover:text-gray-300"
        >
          Kanora
        </Link>
        {/* Optional: Add a button for mobile menu if needed later */}
      </div>
      <nav className="pt-3 text-base font-semibold text-white">
        {navItems.map((item) => {
          // Skip items that should be hidden
          if (
            (item.adminOnly && user?.role !== 'admin') ||
            item.show === false
          ) {
            return null;
          }

          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' &&
              location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center py-3 pl-6 text-white hover:bg-slate-700 ${isActive ? 'bg-slate-700 opacity-100' : 'opacity-75 hover:opacity-100'}`}
            >
              {item.icon && <span className="mr-3">{item.icon}</span>}
              {item.name}
            </Link>
          );
        })}
      </nav>
      {/* Optional: User profile section at the bottom */}
    </aside>
  );
};
