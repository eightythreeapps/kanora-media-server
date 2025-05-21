import React from 'react';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { PlayButton } from './PlayButton';

interface MiniPlayerProps {
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      onClick={onExpand}
      className="flex items-center justify-between p-2 bg-white border-t border-gray-200 cursor-pointer hover:bg-gray-50"
    >
      <div className="flex items-center overflow-hidden flex-grow">
        {currentTrack.albumId && (
          <img
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/tracks/${currentTrack.id}/art`}
            alt="Album Art"
            className="h-8 w-8 rounded shadow mr-2 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/50?text=♪';
            }}
          />
        )}
        <div className="truncate">
          <div className="font-medium text-sm truncate">
            {currentTrack.title}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {currentTrack.artistName}
          </div>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
        <PlayButton
          isPlaying={isPlaying}
          onClick={togglePlayPause}
          size="small"
        />
      </div>
    </div>
  );
};
