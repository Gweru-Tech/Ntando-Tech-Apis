const axios = require('axios');

async function searchMovie(query) {
  try {
    // Using OMDB API (free with API key)
    const apiKey = process.env.OMDB_API_KEY || 'trilogy'; // Get free key from omdbapi.com
    const response = await axios.get(`http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`);
    
    if (response.data.Response === 'True') {
      const movies = await Promise.all(
        response.data.Search.slice(0, 5).map(async (movie) => {
          const details = await axios.get(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
          return {
            title: details.data.Title,
            year: details.data.Year,
            rated: details.data.Rated,
            runtime: details.data.Runtime,
            genre: details.data.Genre,
            director: details.data.Director,
            actors: details.data.Actors,
            plot: details.data.Plot,
            poster: details.data.Poster,
            imdbRating: details.data.imdbRating,
            imdbID: details.data.imdbID
          };
        })
      );

      return {
        success: true,
        data: {
          count: movies.length,
          results: movies
        }
      };
    }

    throw new Error('Movie not found');
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
      example: '/search/movie?q=Inception'
    });
  }

  const result = await searchMovie(q);
  res.json(result);
};
