const axios = require('axios');

async function searchAnime(query) {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
    
    const results = response.data.data.map(anime => ({
      id: anime.mal_id,
      title: anime.title,
      englishTitle: anime.title_english,
      episodes: anime.episodes,
      score: anime.score,
      status: anime.status,
      synopsis: anime.synopsis,
      image: anime.images.jpg.large_image_url,
      url: anime.url,
      year: anime.year,
      rating: anime.rating
    }));

    return {
      success: true,
      data: {
        count: results.length,
        results: results
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
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter is required',
      example: '/search/anime?q=Naruto'
    });
  }

  const result = await searchAnime(q);
  res.json(result);
};
