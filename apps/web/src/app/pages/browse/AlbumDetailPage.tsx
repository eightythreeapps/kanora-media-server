import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { AlbumDetails, Track } from '@kanora/shared-types';
import { Button, Card } from '@kanora/ui';
import { Play, Shuffle, ArrowLeft, Clock } from 'lucide-react';

// Track Row Component
interface TrackRowProps {
  track: Track;
  trackNumber: number;
  onTrackClick: (track: Track) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  trackNumber,
  onTrackClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleClick = () => {
    console.log('Playing track:', {
      id: track.id,
      title: track.title,
      artist: track.artistName,
      album: track.albumTitle,
      duration: track.duration,
      trackNumber: track.trackNumber || trackNumber,
    });
    onTrackClick(track);
  };

  return (
    <tr
      className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="py-3 px-4 text-sm text-gray-500 w-12">
        {isHovered ? (
          <Play className="w-4 h-4 text-gray-900 dark:text-gray-100" />
        ) : (
          <span>{track.trackNumber || trackNumber}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {track.title}
        </div>
        <div className="text-sm text-gray-500">{track.artistName}</div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 w-20 text-right">
        <Clock className="w-4 h-4 inline mr-1" />
        {formatDuration(track.duration)}
      </td>
    </tr>
  );
};

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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleTrackClick = (track: Track) => {
    // Additional handling if needed
  };

  const handlePlayAlbum = () => {
    if (albumDetails && albumDetails.tracks.length > 0) {
      const firstTrack = albumDetails.tracks[0];
      console.log('Playing album:', {
        albumId: albumDetails.id,
        albumTitle: albumDetails.title,
        artist: albumDetails.artistName,
        totalTracks: albumDetails.tracks.length,
        startingTrack: {
          id: firstTrack.id,
          title: firstTrack.title,
          trackNumber: firstTrack.trackNumber || 1,
        },
      });
    }
  };

  const handleShuffleAlbum = () => {
    if (albumDetails && albumDetails.tracks.length > 0) {
      const randomTrack =
        albumDetails.tracks[
          Math.floor(Math.random() * albumDetails.tracks.length)
        ];
      console.log('Shuffling album:', {
        albumId: albumDetails.id,
        albumTitle: albumDetails.title,
        totalTracks: albumDetails.tracks.length,
        randomStartTrack: {
          id: randomTrack.id,
          title: randomTrack.title,
          trackNumber: randomTrack.trackNumber,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-500">Loading album details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Error loading album</div>
          <div className="text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!albumDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-500">Album not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to={`/browse/artist/${albumDetails.artistId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {albumDetails.artistName}
        </Link>
      </div>

      {/* Album Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Album Artwork */}
        <div className="flex-shrink-0">
          {albumDetails.coverArtUrl ? (
            <img
              src={albumDetails.coverArtUrl}
              alt={albumDetails.title}
              className="w-80 h-80 object-cover rounded-2xl shadow-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-80 h-80 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-2xl shadow-lg">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-2">🎵</div>
                <div className="text-sm">No artwork available</div>
              </div>
            </div>
          )}
        </div>

        {/* Album Information */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">Album</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {albumDetails.title}
            </h1>
            <Link
              to={`/browse/artist/${albumDetails.artistId}`}
              className="text-xl text-gray-900 dark:text-gray-100 hover:underline font-medium"
            >
              {albumDetails.artistName}
            </Link>
          </div>

          {/* Album Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
            {albumDetails.releaseDate && (
              <span>{new Date(albumDetails.releaseDate).getFullYear()}</span>
            )}
            {albumDetails.genre && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                {albumDetails.genre}
              </span>
            )}
            <span>
              {albumDetails.trackCount || albumDetails.tracks.length} tracks
            </span>
            {albumDetails.duration && (
              <span>{formatDuration(albumDetails.duration)}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handlePlayAlbum}
              variant="primary"
              size="large"
              className="flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Play Album
            </Button>
            <Button
              onClick={handleShuffleAlbum}
              variant="outline"
              size="large"
              className="flex items-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>

      {/* Track Listing */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Tracks
          </h2>

          {albumDetails.tracks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tracks found for this album
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-12">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Title
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 w-20">
                      <Clock className="w-4 h-4 inline" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {albumDetails.tracks.map((track: Track, index: number) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      trackNumber={track.trackNumber || index + 1}
                      onTrackClick={handleTrackClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AlbumDetailPage;
