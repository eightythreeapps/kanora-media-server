import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { Track } from '@kanora/shared-types';

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  queue: Track[];
  playTrack: (track: Track) => void;
  playAlbum: (tracks: Track[], startIndex: number) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      'useAudioPlayer must be used within an AudioPlayerProvider',
    );
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.8); // Default volume 80%

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleTrackEnded);
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleTrackEnded);
      audioRef.current = null;
    };
  }, []);

  // Update audio source when currentTrack changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const streamUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/tracks/${currentTrack.id}/stream`;
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('Error playing track:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('Error playing track:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // Player control functions
  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const playAlbum = (tracks: Track[], startIndex: number) => {
    if (tracks.length === 0) return;

    // Play the selected track
    const trackToPlay = tracks[startIndex];
    setCurrentTrack(trackToPlay);

    // Add the rest of the album to the queue
    const remainingTracks = [
      ...tracks.slice(startIndex + 1),
      ...tracks.slice(0, startIndex),
    ];
    setQueue(remainingTracks);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (value: number) => {
    const newVolume = Math.max(0, Math.min(1, value));
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const nextTrack = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);
      setCurrentTrack(nextTrack);
      setQueue(newQueue);
      setIsPlaying(true);
    } else {
      // No more tracks in queue, stop playback
      setIsPlaying(false);
    }
  };

  const previousTrack = () => {
    // For simplicity, just restart the current track
    // In a more advanced player, we would keep track of play history
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const value = {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    queue,
    playTrack,
    playAlbum,
    togglePlayPause,
    seek,
    setVolume,
    nextTrack,
    previousTrack,
    addToQueue,
    clearQueue,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};
