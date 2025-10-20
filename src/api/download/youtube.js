const ytdl = require('@distube/ytdl-core');
const { getCookies } = require('./cookies'); // Optional cookie helper

const agent = ytdl.createAgent(require("fs").readFileSync("cookies.json")); // If using cookies

async function youtubeDownloader(url) {
  try {
    if (!ytdl.validateURL(url)) {
      return {
        success: false,
        error: 'Invalid YouTube URL'
      };
    }

    const info = await ytdl.getInfo(url, {
      agent // Use cookies for better reliability
    });
    
    const formats = info.formats.filter(f => f.hasVideo && f.hasAudio);

    return {
      success: true,
      data: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        author: info.videoDetails.author.name,
        formats: formats.map(f => ({
          quality: f.qualityLabel || 'audio only',
          itag: f.itag,
          mimeType: f.mimeType,
          hasAudio: f.hasAudio,
          hasVideo: f.hasVideo,
          contentLength: f.contentLength
        }))
      }
    };
  } catch (error) {
    console.error('YouTube Download Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL parameter is required',
      example: '/download/youtube?url=https://www.youtube.com/watch?v=...'
    });
  }

  const result = await youtubeDownloader(url);
  
  res.status(result.success ? 200 : 500).json(result);
};
