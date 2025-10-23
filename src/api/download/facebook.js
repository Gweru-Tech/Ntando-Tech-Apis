const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "Ntando Mods",
        message: "Please provide a Facebook video URL"
      });
    }

    const response = await axios.get(`https://api.neoxr.eu/api/fb?url=${encodeURIComponent(url)}&apikey=ladybug`);
    
    res.json({
      status: true,
      creator: "Ntando Mods",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      creator: "Ntando Mods",
      message: "Error downloading Facebook video",
      error: error.message
    });
  }
};
