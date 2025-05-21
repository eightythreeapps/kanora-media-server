import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { AlbumDetails, Track } from '@kanora/shared-types';
import { TrackList } from '../../components/player/TrackList';
import { PlayButton } from '../../components/player/PlayButton';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { formatDuration } from '../../utils/formatters';

const AlbumDetailPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { playAlbum, currentTrack, isPlaying, togglePlayPause } =
    useAudioPlayer();

  useEffect(() => {
    if (!albumId) return;

    const fetchAlbumDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getAlbumDetails(albumId);
        if (response.success && response.data) {
          setAlbumDetails(response.data);
        } else {
          setError(response.error || 'Failed to load album details');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      }
      setLoading(false);
    };

    fetchAlbumDetails();
  }, [albumId]);

  if (loading) return <p>Loading album details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!albumDetails) return <p>Album not found.</p>;

  // Check if this album is currently playing
  const isAlbumPlaying = isPlaying && currentTrack?.albumId === albumId;

  // Handle play album button click
  const handlePlayAlbum = () => {
    if (isAlbumPlaying) {
      togglePlayPause();
    } else {
      playAlbum(albumDetails.tracks, 0); // Start from the first track
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start mb-6">
        <div className="md:mr-6 mb-4 md:mb-0">
          {albumDetails.coverArtUrl ? (
            <img
              src={albumDetails.coverArtUrl}
              alt={albumDetails.title}
              className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg shadow-md"
            />
          ) : (
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
              <span className="text-gray-500 text-2xl">?</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h1 className="text-3xl font-bold mr-4">{albumDetails.title}</h1>
            <PlayButton
              isPlaying={isAlbumPlaying}
              onClick={handlePlayAlbum}
              size="medium"
            />
          </div>

          <Link
            to={`/browse/artist/${albumDetails.artistId}`}
            className="text-xl text-gray-700 hover:underline"
          >
            {albumDetails.artistName}
          </Link>

          <div className="mt-2 text-sm text-gray-600">
            {albumDetails.releaseDate && (
              <p className="mt-1">
                Released: {new Date(albumDetails.releaseDate).getFullYear()}
              </p>
            )}
            {albumDetails.genre && <p>Genre: {albumDetails.genre}</p>}
            <p>
              {albumDetails.trackCount} tracks,{' '}
              {albumDetails.duration
                ? formatDuration(albumDetails.duration)
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Tracks</h2>
      <TrackList
        tracks={albumDetails.tracks}
        showAlbum={false}
        showArtist={false}
      />
    </div>
  );
};

export default AlbumDetailPage;
