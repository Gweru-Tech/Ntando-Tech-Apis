const axios = require('axios');

async function instagramDownloader(url) {
  try {
    const response = await axios.get(`https://api.downloadgram.com/media?url=${encodeURIComponent(url)}`);
    
    if (response.data && response.data.download_url) {
      return {
        success: true,
        data: {
          url: response.data.download_url,
          thumbnail: response.data.thumbnail,
          title: response.data.title || 'Instagram Media'
        }
      };
    }

    // Fallback API
    const fallback = await axios.post('https://v3.saveig.app/api/ajaxSearch', 
      new URLSearchParams({ q: url, t: 'media', lang: 'en' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return {
      success: true,
      data: fallback.data
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
      example: '/download/instagram?url=https://www.instagram.com/p/...'
    });
  }

  const result = await instagramDownloader(url);
  res.json(result);
};
