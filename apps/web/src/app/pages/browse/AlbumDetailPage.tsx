import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { AlbumDetails, Track } from '@kanora/shared-types';

const AlbumDetailPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Function to format duration from seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        {albumDetails.coverArtUrl ? (
          <img
            src={albumDetails.coverArtUrl}
            alt={albumDetails.title}
            className="w-32 h-32 object-cover rounded-lg shadow-md mr-6"
          />
        ) : (
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-lg shadow-md mr-6">
            <span className="text-gray-500 text-2xl">?</span>{' '}
            {/* Placeholder for missing art */}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{albumDetails.title}</h1>
          <Link
            to={`/browse/artist/${albumDetails.artistId}`}
            className="text-xl text-gray-700 hover:underline"
          >
            {albumDetails.artistName}
          </Link>
          {albumDetails.releaseDate && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(albumDetails.releaseDate).getFullYear()}
            </p>
          )}
          {albumDetails.genre && (
            <p className="text-sm text-gray-500">{albumDetails.genre}</p>
          )}
          <p className="text-sm text-gray-500">
            {albumDetails.trackCount} tracks,{' '}
            {albumDetails.duration
              ? formatDuration(albumDetails.duration)
              : '-'}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Tracks</h2>
      <ul className="divide-y divide-gray-200">
        {albumDetails.tracks.map((track: Track, index: number) => (
          <li
            key={track.id}
            className="py-3 flex items-center justify-between hover:bg-gray-50 rounded-md px-2"
          >
            <div className="flex items-center">
              <span className="text-sm text-gray-500 w-8 text-right mr-3">
                {track.trackNumber || index + 1}.
              </span>
              <div>
                <p className="font-medium text-gray-800">{track.title}</p>
                <p className="text-sm text-gray-600">{track.artistName}</p>{' '}
                {/* Should be same as album artist */}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {formatDuration(track.duration)}
            </span>
            {/* TODO: Add play button/action */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlbumDetailPage;
