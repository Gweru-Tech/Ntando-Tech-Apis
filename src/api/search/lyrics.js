const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { song } = req.query;
    
    if (!song) {
      return res.status(400).json({
        status: false,
        creator: "Ntando Mods",
        message: "Please provide a song name"
      });
    }

    const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song)}`);
    
    res.json({
      status: true,
      creator: "Ntando Mods",
      data: {
        song: song,
        lyrics: response.data.lyrics
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      creator: "Ntando Mods",
      message: "Error fetching lyrics",
      error: error.message
    });
  }
};
