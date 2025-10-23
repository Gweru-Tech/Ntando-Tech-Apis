const axios = require('axios');
const ytsr = require('ytsr');

module.exports = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        status: false,
        creator: "Ntando Mods",
        message: "Please provide a search query"
      });
    }

    const searchResults = await ytsr(q, { limit: 10 });
    
    const videos = searchResults.items
      .filter(item => item.type === 'video')
      .map(video => ({
        title: video.title,
        url: video.url,
        thumbnail: video.bestThumbnail.url,
        duration: video.duration,
        views: video.views,
        author: video.author.name
      }));

    res.json({
      status: true,
      creator: "Ntando Mods",
      data: {
        query: q,
        results: videos
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      creator: "Ntando Mods",
      message: "Error searching YouTube",
      error: error.message
    });
  }
};
