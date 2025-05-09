import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Media, MediaType } from '@kanora/shared-types';
import axios from 'axios';

// Use this API URL for testing - in production, this should be your local IP address
const API_URL = 'http://localhost:3333/api';

export const App = () => {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/media`);
      if (response.data.success && response.data.data) {
        setMediaItems(response.data.data);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to load media');
      }
    } catch (err) {
      setError('Error connecting to server. Make sure the API is running.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedia();
  };

  const getMediaTypeIcon = (type: MediaType): string => {
    switch (type) {
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

  const renderMediaItem = (item: Media) => {
    return (
      <TouchableOpacity key={item.id} style={styles.mediaItem}>
        <View style={styles.thumbnailContainer}>
          {item.thumbnailPath ? (
            <Image
              source={{ uri: item.thumbnailPath }}
              style={styles.thumbnail}
              resizeMode="cover"
              defaultSource={require('../assets/media-placeholder.png')}
            />
          ) : (
            <View style={styles.fallbackThumbnail}>
              <Text style={styles.fallbackThumbnailText}>
                {getMediaTypeIcon(item.type)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.mediaMetadata}>
            <Text style={styles.mediaType}>{item.type}</Text>
            {item.duration && (
              <Text style={styles.mediaDuration}>
                {formatDuration(item.duration)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kanora</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3f51b5" />
            <Text style={styles.loadingText}>Loading media...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMedia}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Media Library</Text>
              {mediaItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No media found</Text>
                </View>
              ) : (
                <View style={styles.mediaList}>
                  {mediaItems.map(renderMediaItem)}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3f51b5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  mediaList: {
    flexDirection: 'column',
  },
  mediaItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: 100,
    height: 100,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fallbackThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackThumbnailText: {
    fontSize: 30,
  },
  mediaInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  mediaMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  mediaDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#3f51b5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default App;
