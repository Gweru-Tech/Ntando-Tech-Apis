const axios = require('axios');
const cheerio = require('cheerio');

async function googleSearch(query) {
  try {
    const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.g').each((i, element) => {
      const title = $(element).find('h3').text();
      const link = $(element).find('a').attr('href');
      const description = $(element).find('.VwiC3b').text();

      if (title && link) {
        results.push({
          title,
          link,
          description
        });
      }
    });

    return {
      success: true,
      query: query,
      results: results.slice(0, 10)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter (q) is required',
      example: '/search/google?q=nodejs tutorial'
    });
  }

  const result = await googleSearch(q);
  res.json(result);
};
