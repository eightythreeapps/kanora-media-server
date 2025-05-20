import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { ArtistDetails, Album } from '@kanora/shared-types';

const ArtistDetailPage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [artistDetails, setArtistDetails] = useState<ArtistDetails | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) return;

    const fetchArtistDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getArtistDetails(artistId);
        if (response.success && response.data) {
          setArtistDetails(response.data);
        } else {
          setError(response.error || 'Failed to load artist details');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      }
      setLoading(false);
    };

    fetchArtistDetails();
  }, [artistId]);

  if (loading) return <p>Loading artist details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!artistDetails) return <p>Artist not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">{artistDetails.name}</h1>
      {artistDetails.bio && (
        <p className="text-gray-600 mb-4">{artistDetails.bio}</p>
      )}

      <h2 className="text-xl font-semibold mb-3 mt-6">Albums</h2>
      {artistDetails.albums.length === 0 ? (
        <p>No albums found for this artist.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artistDetails.albums.map((album: Album) => (
            <div
              key={album.id}
              className="border p-2 rounded shadow hover:shadow-lg transition-shadow"
            >
              <Link to={`/browse/album/${album.id}`}>
                {album.coverArtUrl ? (
                  <img
                    src={album.coverArtUrl}
                    alt={album.title}
                    className="w-full h-auto object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded mb-2">
                    <span className="text-gray-500 text-sm">No Cover</span>
                  </div>
                )}
                <p
                  className="font-semibold text-sm truncate"
                  title={album.title}
                >
                  {album.title}
                </p>
                {album.releaseDate && (
                  <p className="text-xs text-gray-500">
                    {new Date(album.releaseDate).getFullYear()}
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistDetailPage;
