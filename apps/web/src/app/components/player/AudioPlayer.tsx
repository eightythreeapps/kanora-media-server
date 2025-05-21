import React, { useCallback, useEffect, useState } from 'react';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { PlayButton } from './PlayButton';
import { formatDuration } from '../../utils/formatters';

export const AudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    queue,
    togglePlayPause,
    seek,
    setVolume,
    nextTrack,
    previousTrack,
  } = useAudioPlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isDragging, setIsDragging] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  // Update seek slider when currentTime changes (if not dragging)
  useEffect(() => {
    if (!isDragging && duration > 0) {
      setSeekValue((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isDragging]);

  // Handle seek start
  const handleSeekStart = () => {
    setIsDragging(true);
  };

  // Handle seek change
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setSeekValue(newValue);
  };

  // Handle seek end (commit the change)
  const handleSeekEnd = useCallback(() => {
    if (duration > 0) {
      seek((seekValue / 100) * duration);
    }
    setIsDragging(false);
  }, [seekValue, duration, seek]);

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  if (!currentTrack) {
    return null; // Don't render the player if no track is loaded
  }

  // Get appropriate volume icon based on level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.33) return '🔈';
    if (volume < 0.66) return '🔉';
    return '🔊';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md">
      <div className="max-w-6xl mx-auto">
        {/* Track progress slider */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max="100"
            value={seekValue}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex items-center justify-between">
          {/* Track info */}
          <div className="flex items-center space-x-3 w-1/3">
            {currentTrack.albumId && (
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/tracks/${currentTrack.id}/art`}
                alt="Album Art"
                className="h-12 w-12 rounded shadow"
                onError={(e) => {
                  // Fallback for missing album art
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/50?text=♪';
                }}
              />
            )}
            <div className="truncate">
              <div className="font-medium truncate">{currentTrack.title}</div>
              <div className="text-sm text-gray-600 truncate">
                {currentTrack.artistName}
              </div>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={previousTrack}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              ⏮️
            </button>
            <PlayButton
              isPlaying={isPlaying}
              onClick={togglePlayPause}
              size="large"
            />
            <button
              onClick={nextTrack}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              disabled={queue.length === 0}
            >
              ⏭️
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2 w-1/3 justify-end">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {getVolumeIcon()}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Queue info (optional) */}
        {queue.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Next: {queue[0].title} • {queue.length} in queue
          </div>
        )}
      </div>
    </div>
  );
};
