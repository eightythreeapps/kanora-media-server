import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AudioPlayer } from '../player/AudioPlayer';
import { MiniPlayer } from '../player/MiniPlayer';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

export const MainLayout: React.FC = () => {
  const { currentTrack } = useAudioPlayer();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleExpandPlayer = () => {
    navigate('/player/now-playing');
  };

  // Calculate bottom padding to prevent content from being hidden behind the player
  const bottomPadding = currentTrack ? (expanded ? '168px' : '64px') : '0px';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100"
        style={{ paddingBottom: bottomPadding }}
      >
        <div className="container px-6 py-8 mx-auto">
          <Outlet /> {/* Page content will be rendered here */}
        </div>

        {/* Audio player at bottom of screen */}
        {currentTrack && (
          <>
            {expanded ? (
              <AudioPlayer />
            ) : (
              <MiniPlayer onExpand={handleExpandPlayer} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
