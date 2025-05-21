import React from 'react';
import { Track } from '@kanora/shared-types';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { formatDuration } from '../../utils/formatters';
import { PlayButton } from './PlayButton';

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
  showArtist?: boolean;
  className?: string;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  showAlbum = false,
  showArtist = true,
  className = '',
}) => {
  const { currentTrack, isPlaying, playTrack, playAlbum } = useAudioPlayer();

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      // If the same track is clicked, do nothing (controlled by PlayButton component)
      return;
    }

    // Play this track and add the rest to queue
    playAlbum(tracks, index);
  };

  if (!tracks.length) {
    return <div className="text-gray-500 py-4">No tracks available</div>;
  }

  return (
    <ul className={`divide-y divide-gray-200 ${className}`}>
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;

        return (
          <li
            key={track.id}
            className="py-3 flex items-center justify-between hover:bg-gray-50 rounded-md px-2"
          >
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-10 flex-shrink-0 mr-3 flex justify-center">
                {isCurrentTrack ? (
                  <PlayButton
                    isPlaying={isPlaying}
                    onClick={() => handlePlayTrack(track, index)}
                    size="small"
                  />
                ) : (
                  <button
                    onClick={() => handlePlayTrack(track, index)}
                    className="text-gray-400 hover:text-primary-600 w-8 h-8 flex items-center justify-center"
                  >
                    <span className="text-gray-500">
                      {track.trackNumber || index + 1}.
                    </span>
                  </button>
                )}
              </div>

              <div className="truncate flex-1 min-w-0">
                <p
                  className={`font-medium ${isCurrentTrack ? 'text-primary-600' : 'text-gray-800'} truncate`}
                >
                  {track.title}
                </p>

                {(showArtist || showAlbum) && (
                  <div className="text-sm text-gray-600 truncate">
                    {showArtist && track.artistName}
                    {showArtist && showAlbum && ' • '}
                    {showAlbum && track.albumTitle}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center ml-4">
              <span className="text-sm text-gray-500 mr-2">
                {formatDuration(track.duration)}
              </span>

              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add to queue functionality could be added here
                }}
              >
                {/* Menu icon (three dots) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
