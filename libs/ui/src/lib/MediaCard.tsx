import { useState } from 'react';
import { Card } from './Card';
import styles from './MediaCard.module.css';
import { Media, MediaType } from '@kanora/shared-types';

export interface MediaCardProps {
  media: Media;
  onClick?: (media: Media) => void;
  className?: string;
}

export function MediaCard({ media, onClick, className = '' }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(media);
    }
  };

  const mediaTypeIcon = () => {
    switch (media.type) {
      case MediaType.MOVIE:
        return '🎬';
      case MediaType.TV_SHOW:
        return '📺';
      case MediaType.MUSIC:
        return '🎵';
      case MediaType.PHOTO:
        return '📷';
      default:
        return '📄';
    }
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card
      className={`${styles.mediaCard} ${className}`}
      hoverable
      onClick={handleClick}
    >
      <div className={styles.thumbnailContainer}>
        {!imageError && media.thumbnailPath ? (
          <img
            src={media.thumbnailPath}
            alt={media.title}
            className={styles.thumbnail}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.fallbackThumbnail}>
            <span className={styles.mediaIcon}>{mediaTypeIcon()}</span>
          </div>
        )}
      </div>
      <div className={styles.mediaInfo}>
        <h3 className={styles.mediaTitle}>{media.title}</h3>
        <div className={styles.mediaMetadata}>
          <span className={styles.mediaType}>{media.type}</span>
          {media.duration && (
            <span className={styles.mediaDuration}>
              {formatDuration(media.duration)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
