const axios = require('axios');

async function facebookDownloader(url) {
  try {
    const response = await axios.post('https://www.getfvid.com/downloader', 
      new URLSearchParams({ url: url }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const html = response.data;
    const sdMatch = html.match(/sd:\s*'([^']+)'/);
    const hdMatch = html.match(/hd:\s*'([^']+)'/);

    return {
      success: true,
      data: {
        sd: sdMatch ? sdMatch[1] : null,
        hd: hdMatch ? hdMatch[1] : null,
        title: 'Facebook Video'
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
      example: '/download/facebook?url=https://www.facebook.com/...'
    });
  }

  const result = await facebookDownloader(url);
  res.json(result);
};
