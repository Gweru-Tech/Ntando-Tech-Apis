const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

// Backup method using external API
async function downloadWithBackup(url) {
  try {
    const response = await axios.post('https://api.cobalt.tools/api/json', {
      url: url,
      vCodec: 'h264',
      vQuality: '720',
      aFormat: 'mp3',
      isAudioOnly: false
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      method: 'cobalt',
      data: response.data
    };
  } catch (error) {
    throw new Error('Backup method failed: ' + error.message);
  }
}

// Primary method using ytdl-core
async function youtubeDownloader(url) {
  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      return {
        success: false,
        error: 'Invalid YouTube URL'
      };
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    
    // Filter formats
    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .sort((a, b) => b.bitrate - a.bitrate)
      .slice(0, 5);

    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => b.audioBitrate - a.audioBitrate)
      .slice(0, 3);

    const videoOnlyFormats = info.formats
      .filter(f => f.hasVideo && !f.hasAudio)
      .sort((a, b) => b.bitrate - a.bitrate)
      .slice(0, 3);

    return {
      success: true,
      creator: "Ntando Mods - Ladybug🐞",
      method: 'ytdl-core',
      data: {
        videoId: info.videoDetails.videoId,
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        durationFormatted: formatDuration(info.videoDetails.lengthSeconds),
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        author: {
          name: info.videoDetails.author.name,
          channel_url: info.videoDetails.author.channel_url,
          verified: info.videoDetails.author.verified
        },
        views: parseInt(info.videoDetails.viewCount).toLocaleString(),
        uploadDate: info.videoDetails.uploadDate,
        description: info.videoDetails.description.substring(0, 200) + '...',
        likes: info.videoDetails.likes,
        formats: {
          videoAndAudio: videoFormats.map(f => ({
            quality: f.qualityLabel || 'unknown',
            url: f.url,
            mimeType: f.mimeType,
            container: f.container,
            size: formatBytes(f.contentLength),
            fps: f.fps,
            bitrate: f.bitrate
          })),
          audioOnly: audioFormats.map(f => ({
            quality: `${f.audioBitrate}kbps`,
            url: f.url,
            mimeType: f.mimeType,
            size: formatBytes(f.contentLength),
            audioBitrate: f.audioBitrate
          })),
          videoOnly: videoOnlyFormats.map(f => ({
            quality: f.qualityLabel || 'unknown',
            url: f.url,
            mimeType: f.mimeType,
            size: formatBytes(f.contentLength),
            fps: f.fps
          }))
        },
        downloadLinks: {
          video720p: videoFormats.find(f => f.qualityLabel === '720p')?.url || null,
          video480p: videoFormats.find(f => f.qualityLabel === '480p')?.url || null,
          video360p: videoFormats.find(f => f.qualityLabel === '360p')?.url || null,
          audioHigh: audioFormats[0]?.url || null,
          audioMedium: audioFormats[1]?.url || null
        }
      }
    };
  } catch (error) {
    console.error('Primary method failed:', error.message);
    
    // Try backup method
    try {
      return await downloadWithBackup(url);
    } catch (backupError) {
      return {
        success: false,
        error: 'Both download methods failed',
        details: {
          primary: error.message,
          backup: backupError.message
        }
      };
    }
  }
}

// Helper functions
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL parameter is required',
      example: '/download/youtube?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      creator: "Ntando Mods - Ladybug🐞",
      documentation: {
        endpoint: '/download/youtube',
        method: 'GET',
        parameters: {
          url: 'YouTube video URL (required)'
        }
      }
    });
  }

  try {
    const result = await youtubeDownloader(url);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};
