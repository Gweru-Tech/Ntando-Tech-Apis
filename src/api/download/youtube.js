const ytdl = require('@distube/ytdl-core');

async function youtubeDownloader(url) {
  try {
    if (!ytdl.validateURL(url)) {
      return {
        success: false,
        error: 'Invalid YouTube URL'
      };
    }

    const info = await ytdl.getInfo(url);
    
    // Get video and audio formats
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    const videoOnlyFormats = ytdl.filterFormats(info.formats, 'videoonly');

    return {
      success: true,
      creator: "Ntando Mods",
      data: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        author: info.videoDetails.author.name,
        views: info.videoDetails.viewCount,
        uploadDate: info.videoDetails.uploadDate,
        description: info.videoDetails.description,
        formats: {
          videoAndAudio: videoFormats.slice(0, 5).map(f => ({
            quality: f.qualityLabel,
            url: f.url,
            mimeType: f.mimeType,
            container: f.container,
            size: f.contentLength
          })),
          audioOnly: audioFormats.slice(0, 3).map(f => ({
            quality: f.audioBitrate + 'kbps',
            url: f.url,
            mimeType: f.mimeType,
            size: f.contentLength
          })),
          videoOnly: videoOnlyFormats.slice(0, 3).map(f => ({
            quality: f.qualityLabel,
            url: f.url,
            mimeType: f.mimeType,
            size: f.contentLength
          }))
        }
      }
    };
  } catch (error) {
    console.error('YouTube Error:', error);
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
      example: '/download/youtube?url=https://www.youtube.com/watch?v=...',
      creator: "Ntando Mods"
    });
  }

  const result = await youtubeDownloader(url);
  res.status(result.success ? 200 : 500).json(result);
};
