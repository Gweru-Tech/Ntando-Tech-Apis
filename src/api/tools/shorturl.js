const axios = require('axios');

async function shortenURL(url) {
  try {
    // Using TinyURL API
    const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    
    return {
      success: true,
      data: {
        originalUrl: url,
        shortUrl: response.data
      }
    };
  } catch (error) {
    // Fallback to is.gd API
    try {
      const fallback = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      return {
        success: true,
        data: {
          originalUrl: url,
          shortUrl: fallback.data.shorturl
        }
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError.message
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
      example: '/tools/shorturl?url=https://www.example.com/very/long/url'
    });
  }

  const result = await shortenURL(url);
  res.json(result);
};
