const axios = require('axios');
const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "Ntando Mods",
        message: "Please provide a YouTube URL"
      });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        status: false,
        creator: "Ntando Mods",
        message: "Invalid YouTube URL"
      });
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    
    res.json({
      status: true,
      creator: "Ntando Mods",
      data: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[0].url,
        formats: formats.map(f => ({
          quality: f.qualityLabel,
          url: f.url,
          container: f.container
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      creator: "Ntando Mods",
      message: "Error downloading YouTube video",
      error: error.message
    });
  }
};
