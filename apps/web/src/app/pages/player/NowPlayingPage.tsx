import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { formatDuration } from '../../utils/formatters';
import { PlayButton } from '../../components/player/PlayButton';
import { TrackList } from '../../components/player/TrackList';

const NowPlayingPage: React.FC = () => {
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
    clearQueue,
  } = useAudioPlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [seekValue, setSeekValue] = useState(
    duration > 0 ? (currentTime / duration) * 100 : 0,
  );

  // If no track is playing, show a message
  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Nothing Playing
          </h2>
          <p className="text-gray-500 mb-6">
            Select a track from your library to start listening
          </p>
          <Link
            to="/browse/artists"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  // Handle seek change
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setSeekValue(newValue);
    if (duration > 0) {
      seek((newValue / 100) * duration);
    }
  };

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

  // Get appropriate volume icon based on level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.33) return '🔈';
    if (volume < 0.66) return '🔉';
    return '🔊';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Now Playing</h1>
      </div>

      <div className="md:flex">
        {/* Album art and track info */}
        <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
          <div className="text-center">
            <div className="mb-6 relative mx-auto">
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/tracks/${currentTrack.id}/art`}
                alt={`${currentTrack.title} album art`}
                className="w-full max-w-lg mx-auto shadow-xl rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/500?text=♪';
                }}
              />
            </div>

            <h2 className="text-2xl font-bold mb-1">{currentTrack.title}</h2>
            <p className="text-xl text-gray-700 mb-1">
              {currentTrack.artistName}
            </p>
            {currentTrack.albumTitle && (
              <p className="text-gray-500">
                From the album{' '}
                <Link
                  to={`/browse/album/${currentTrack.albumId}`}
                  className="text-primary-600 hover:underline"
                >
                  {currentTrack.albumTitle}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Player controls and queue */}
        <div className="md:w-1/2">
          {/* Progress bar */}
          <div className="mb-8">
            <input
              type="range"
              min="0"
              max="100"
              value={seekValue}
              onChange={handleSeekChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <button
              onClick={previousTrack}
              className="text-gray-600 hover:text-gray-800 focus:outline-none text-2xl"
            >
              ⏮️
            </button>
            <PlayButton
              isPlaying={isPlaying}
              onClick={togglePlayPause}
              size="large"
              className="mx-4"
            />
            <button
              onClick={nextTrack}
              className="text-gray-600 hover:text-gray-800 focus:outline-none text-2xl"
              disabled={queue.length === 0}
            >
              ⏭️
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2 mb-10 justify-center">
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
              className="w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Queue section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className="flex items-center text-gray-700 hover:text-primary-600"
              >
                <span className="mr-2">
                  {showQueue ? 'Hide Queue' : 'Show Queue'} ({queue.length})
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transform ${
                    showQueue ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {showQueue && (
              <div className="mt-4">
                {queue.length > 0 ? (
                  <TrackList tracks={queue} />
                ) : (
                  <p className="text-gray-500 py-4 text-center">
                    Queue is empty
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;
