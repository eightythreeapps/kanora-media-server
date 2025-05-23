import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { ArtistDetails, Album } from '@kanora/shared-types';
import { Card, CardContent, CardTitle } from '../../../components/ui/card';

const placeholderImg = 'https://placehold.co/160x160?text=Album';

const albumCardClass =
  'w-40 min-w-[10rem] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow';

const albumImgClass = 'w-full h-40 object-cover rounded-t-lg bg-muted';

const albumNameClass = 'mt-2 text-center font-medium text-base truncate';

const ArtistDetailPage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) return;
    const fetchArtist = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getArtistDetails(artistId);
        if (response.success && response.data) {
          setArtist(response.data);
        } else {
          setError(response.error || 'Failed to load artist details');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        // eslint-disable-next-line no-console
        console.error(err);
      }
      setLoading(false);
    };
    fetchArtist();
  }, [artistId]);

  if (loading) return <p>Loading artist details...</p>;
  if (error) return <p className="text-destructive">Error: {error}</p>;
  if (!artist) return <p>Artist not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">{artist.name}</h1>
      <section className="mb-6">
        <p className="text-muted-foreground text-base">
          {artist.bio ? artist.bio : 'No bio available yet.'}
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Albums</h2>
        {artist.albums && artist.albums.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto w-full pb-2">
            {artist.albums.map((album: Album) => (
              <Link key={album.id} to={`/browse/album/${album.id}`}>
                <Card className={albumCardClass}>
                  <img
                    src={album.coverArtUrl || placeholderImg}
                    alt={album.title}
                    className={albumImgClass}
                    width={160}
                    height={160}
                    loading="lazy"
                  />
                  <CardContent className="flex-1 flex flex-col justify-end p-2 w-full">
                    <div className={albumNameClass} title={album.title}>
                      {album.title}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto w-full pb-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className={albumCardClass}>
                <img
                  src={placeholderImg}
                  alt={`Placeholder Album ${i + 1}`}
                  className={albumImgClass}
                  width={160}
                  height={160}
                  loading="lazy"
                />
                <CardContent className="flex-1 flex flex-col justify-end p-2 w-full">
                  <div className={albumNameClass} title={`Album ${i + 1}`}>
                    Album {i + 1}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Music Videos</h2>
        <div className="text-muted-foreground italic">
          Music videos coming soon.
        </div>
      </section>
    </div>
  );
};

export default ArtistDetailPage;
