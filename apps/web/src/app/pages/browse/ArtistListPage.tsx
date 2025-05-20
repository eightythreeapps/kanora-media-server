import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { Artist, PaginatedResponse } from '@kanora/shared-types';

const ArtistListPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Add pagination state and controls

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getAllArtists();
        if (response.success && response.data) {
          setArtists(response.data.items);
        } else {
          setError(response.error || 'Failed to load artists');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      }
      setLoading(false);
    };

    fetchArtists();
  }, []);

  if (loading) return <p>Loading artists...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Artists</h1>
      {artists.length === 0 && <p>No artists found.</p>}
      <ul>
        {artists.map((artist) => (
          <li key={artist.id} className="mb-2">
            <Link
              to={`/browse/artist/${artist.id}`}
              className="text-blue-500 hover:underline"
            >
              {artist.name}
            </Link>
            {artist.albumCount && (
              <span className="text-sm text-gray-500 ml-2">
                ({artist.albumCount} albums)
              </span>
            )}
          </li>
        ))}
      </ul>
      {/* TODO: Add pagination controls */}
    </div>
  );
};

export default ArtistListPage;
