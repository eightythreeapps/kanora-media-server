# Building a Media Streaming API for Kanora: An Implementation Journey

## Introduction

In this blog post, I'll walk through the process of implementing a media streaming API for the Kanora Media Server project. As a self-hosted music streaming solution, one of the core functionalities needed was the ability to efficiently stream audio files to web and mobile clients. This post details how we approached building a robust streaming solution that supports range requests, transcoding, and more.

## The Requirements

Before diving into implementation details, let's review what we needed from our streaming API:

1. **Efficient streaming** - Support for HTTP range requests to allow seeking within tracks
2. **Format flexibility** - On-the-fly transcoding between different audio formats
3. **Quality options** - Ability to adjust bitrate for bandwidth optimization
4. **Metadata access** - Endpoints for retrieving album art and track information
5. **Authentication** - Secure streaming with proper user authentication
6. **Performance optimization** - Proper caching headers and efficient delivery

## Architecture Overview

We organized our streaming functionality into four main components:

1. **Controllers** - Handle HTTP requests and responses
2. **Services** - Contain business logic for streaming and transcoding
3. **Routes** - Define API endpoints and authentication
4. **Utilities** - Helper functions for MIME type handling and other common tasks

Here's the directory structure we created:

```
apps/api/src/streaming
├── controllers
│   └── streaming.controller.ts
├── routes
│   └── streaming.routes.ts
├── services
│   └── streaming.service.ts
└── index.ts
```

## Implementation Details

### Streaming Service

The heart of our implementation is the `StreamingService` class, which handles the heavy lifting of file streaming and transcoding. Let's look at the key features:

#### Range Request Support

One of the most important features for any media streaming API is support for range requests. This allows clients to seek to any position in an audio file without downloading the entire file. Here's how we implemented it:

```typescript
async streamFile(req: Request, res: Response, track: any, isDownload = false): Promise<void> {
  const filePath = track.path;
  const fileSize = fs.statSync(filePath).size;

  // Get file extension and content type
  const ext = path.extname(filePath).toLowerCase().substring(1);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Parse range header
  const range = req.headers.range;

  if (range && !isDownload) {
    // Handle range request for seeking
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;

    // Set partial content headers (HTTP 206)
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    });

    // Stream only the requested chunk
    const fileStream = fs.createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } else {
    // Stream the entire file
    // ...
  }
}
```

This implementation allows clients to request specific byte ranges of a file, which is crucial for features like seeking in an audio player.

#### Transcoding with FFmpeg

Another powerful feature we implemented is on-the-fly transcoding using FFmpeg. This allows clients to request audio in different formats or bitrates, regardless of how the file is stored on the server:

```typescript
async streamTranscodedFile(
  req: Request,
  res: Response,
  track: any,
  format = 'mp3',
  bitrate = 320
): Promise<void> {
  // Validate format and bitrate
  // ...

  // Create ffmpeg command
  const command = ffmpeg(filePath);

  // Configure based on format
  switch (format) {
    case 'mp3':
      command.format('mp3').audioCodec('libmp3lame').audioBitrate(bitrate);
      break;
    case 'ogg':
      command.format('ogg').audioCodec('libvorbis').audioBitrate(bitrate);
      break;
    // Other formats...
  }

  // Stream to response
  command
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      // Handle error
    })
    .pipe(res, { end: true });

  // Clean up on client disconnect
  req.on('close', () => {
    command.kill();
  });
}
```

We chose to use the `fluent-ffmpeg` library to provide a clean interface for working with FFmpeg. This approach gives us a lot of flexibility for format conversion and quality adjustment.

### API Controllers

Our controllers serve as the bridge between the HTTP requests and our streaming service. We implemented several endpoints:

1. **Stream Audio** - Direct streaming of audio files
2. **Transcode Audio** - Stream with format conversion
3. **Download Audio** - Download the complete file
4. **Get Album Art** - Retrieve album artwork

Each controller follows a similar pattern:

1. Validate the request parameters
2. Look up the track in the database
3. Check if the file exists
4. Call the appropriate service method

Here's a simplified example of our stream audio controller:

```typescript
export const streamAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the track in the database
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, id),
    });

    if (!track) {
      res.status(404).json({
        success: false,
        message: `Track with ID ${id} not found`,
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(track.path)) {
      res.status(404).json({
        success: false,
        message: 'Audio file not found on the server',
      });
      return;
    }

    // Stream the file
    await streamingService.streamFile(req, res, track);
  } catch (error) {
    // Error handling
    // ...
  }
};
```

### API Routes

We defined routes for each of our streaming functionalities and secured them with authentication middleware:

```typescript
import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import { streamAudio, streamTranscodedAudio, downloadAudio, getAlbumArt } from '../controllers/streaming.controller';

const router = Router();

// Stream audio routes
router.get('/tracks/:id/stream', authenticate, streamAudio);
router.get('/tracks/:id/transcode', authenticate, streamTranscodedAudio);
router.get('/tracks/:id/download', authenticate, downloadAudio);
router.get('/tracks/:id/art', authenticate, getAlbumArt);

export default router;
```

All routes are protected by the `authenticate` middleware, ensuring that only authenticated users can access our streaming API.

## Challenges and Solutions

### Challenge 1: Type Issues with FFmpeg

One of the first challenges we encountered was TypeScript errors with the `fluent-ffmpeg` library. The import statement was causing errors because the library's type definitions were structured differently than expected.

**Solution:** We changed the import from:

```typescript
import * as ffmpeg from 'fluent-ffmpeg';
```

to:

```typescript
import ffmpeg from 'fluent-ffmpeg';
```

This change fixed the TypeScript errors and allowed us to use the library properly.

### Challenge 2: Handling Large Files

Streaming large audio files efficiently was another challenge. We needed to ensure that the server didn't load the entire file into memory, especially when only part of the file was requested.

**Solution:** We used Node.js streams to read and pipe file data directly to the response. This approach ensures minimal memory usage:

```typescript
const fileStream = fs.createReadStream(filePath, { start, end });
fileStream.pipe(res);
```

### Challenge 3: Clean Termination of Transcoding

When a client disconnects during a transcoding operation, we needed to ensure that the FFmpeg process was properly terminated to avoid resource leaks.

**Solution:** We added an event listener for the 'close' event on the request object:

```typescript
req.on('close', () => {
  command.kill();
});
```

This ensures that the FFmpeg process is terminated when the client disconnects.

## Performance Considerations

We implemented several optimizations to ensure efficient streaming:

1. **Caching Headers** - We set appropriate `Cache-Control` headers to allow clients to cache audio data:

   ```typescript
   'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
   ```

2. **Partial Content** - By supporting range requests, we ensure that clients only download the parts of the file they need, which is crucial for seeking in long audio files.

3. **Bitrate Control** - Our transcoding API allows clients to request lower bitrates for bandwidth-constrained environments.

## Testing the API

We manually tested all endpoints to ensure they functioned correctly:

1. **Streaming**: We verified that audio files could be streamed with seeking functionality.
2. **Transcoding**: We tested converting between different formats (MP3, OGG, AAC) at various bitrates.
3. **Album Art**: We confirmed that album artwork could be retrieved correctly.
4. **Downloads**: We verified that files could be downloaded as complete files.

## Future Improvements

While our current implementation meets the core requirements, there are several improvements we could make in the future:

1. **HLS/DASH Streaming** - Implement adaptive bitrate streaming protocols for better mobile support.
2. **Waveform Generation** - Create endpoints for generating and retrieving audio waveforms for visualization.
3. **Stream Analytics** - Add tracking of streaming statistics for analytics purposes.
4. **Playlist Streaming** - Support for streaming entire playlists with gapless playback.
5. **Client Libraries** - Develop client-side libraries for web and mobile to simplify integration.

## Conclusion

Building a robust media streaming API for Kanora was a challenging but rewarding experience. By leveraging the power of Node.js streams, FFmpeg, and HTTP range requests, we've created a flexible system that can efficiently deliver audio content to clients in various formats and bitrates.

The architecture we've chosen allows for easy extension and maintenance, and the separation of concerns between controllers, services, and routes helps keep the codebase clean and organized.

This implementation demonstrates how modern web technologies can be used to build a self-hosted music streaming solution that rivals commercial services in functionality while giving users full control over their media library.
