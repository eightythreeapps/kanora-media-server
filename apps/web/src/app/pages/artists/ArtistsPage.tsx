import React, { useEffect, useState } from 'react';
import { ApiService } from '@kanora/data-access';
import { Artist } from '@kanora/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const placeholderImg = 'https://placehold.co/160x160?text=Artist';

const gridClass =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6';

const cardImgClass = 'w-full h-40 object-cover rounded-t-lg bg-muted';

const cardNameClass = 'mt-2 text-center font-medium text-base truncate';

const ArtistsPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getAllArtists(1, 100);
        if (response.success && response.data) {
          setArtists(response.data.items);
        } else {
          setError(response.error || 'Failed to load artists');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        // eslint-disable-next-line no-console
        console.error(err);
      }
      setLoading(false);
    };
    fetchArtists();
  }, []);

  if (loading) return <p>Loading artists...</p>;
  if (error) return <p className="text-destructive">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Artists</h1>
      {artists.length === 0 ? (
        <p>No artists found.</p>
      ) : (
        <div className={gridClass}>
          {artists.map((artist) => (
            <Card
              key={artist.id}
              className="flex flex-col items-center p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/artists/${artist.id}`)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${artist.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  navigate(`/artists/${artist.id}`);
              }}
            >
              <img
                src={artist.coverArtUrl || placeholderImg}
                alt={artist.name}
                className={cardImgClass}
                width={160}
                height={160}
                loading="lazy"
              />
              <CardContent className="flex-1 flex flex-col justify-end p-2 w-full">
                <div className={cardNameClass} title={artist.name}>
                  {artist.name}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistsPage;
