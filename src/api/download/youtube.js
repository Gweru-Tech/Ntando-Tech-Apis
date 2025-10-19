const ytdl = require('ytdl-core');

async function youtubeDownloader(url) {
  try {
    if (!ytdl.validateURL(url)) {
      return {
        success: false,
        error: 'Invalid YouTube URL'
      };
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

    return {
      success: true,
      data: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[0].url,
        author: info.videoDetails.author.name,
        formats: formats.map(f => ({
          quality: f.qualityLabel,
          url: f.url,
          mimeType: f.mimeType,
          hasAudio: f.hasAudio,
          hasVideo: f.hasVideo
        }))
      }
    };
  } catch (error) {
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
  res.json(result);
};
