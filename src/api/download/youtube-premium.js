const axios = require('axios');
const ytdl = require('ytdl-core');

async function getYouTubePremium(url) {
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const info = await ytdl.getInfo(url);
    
    // Get highest quality formats
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    const highestVideo = videoFormats.sort((a, b) => b.bitrate - a.bitrate)[0];
    const highestAudio = audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];

    return {
      success: true,
      data: {
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        views: info.videoDetails.viewCount,
        description: info.videoDetails.description,
        formats: {
          video: {
            quality: highestVideo.qualityLabel,
            url: highestVideo.url,
            size: highestVideo.contentLength,
            format: highestVideo.container
          },
          audio: {
            quality: `${highestAudio.audioBitrate}kbps`,
            url: highestAudio.url,
            size: highestAudio.contentLength,
            format: highestAudio.container
          }
        },
        premium: true
      }
    };
  } catch (error) {
    // Fallback to alternative API
    try {
      const response = await axios.get(`https://api.cobalt.tools/api/json`, {
        method: 'POST',
        data: {
          url: url,
          vQuality: '1080'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        source: 'Cobalt'
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL parameter is required',
      example: '/download/youtube-premium?url=https://youtube.com/watch?v=...'
    });
  }

  const result = await getYouTubePremium(url);
  res.json(result);
};
