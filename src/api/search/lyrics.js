const axios = require('axios');
const cheerio = require('cheerio');

async function getLyrics(song) {
  try {
    // Method 1: Lyrics.ovh API (Free)
    const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song)}`);
    
    if (response.data.lyrics) {
      return {
        success: true,
        data: {
          title: song,
          lyrics: response.data.lyrics,
          source: 'Lyrics.ovh'
        }
      };
    }
  } catch (error) {
    console.error('Lyrics.ovh failed:', error.message);
  }

  try {
    // Method 2: Genius API scraping
    const searchUrl = `https://genius.com/api/search/multi?q=${encodeURIComponent(song)}`;
    const searchRes = await axios.get(searchUrl);
    
    const songPath = searchRes.data.response.sections
      .find(section => section.type === 'song')
      ?.hits[0]?.result?.path;

    if (songPath) {
      const lyricsUrl = `https://genius.com${songPath}`;
      const lyricsPage = await axios.get(lyricsUrl);
      const $ = cheerio.load(lyricsPage.data);
      
      let lyrics = '';
      $('[data-lyrics-container="true"]').each((i, elem) => {
        lyrics += $(elem).text() + '\n';
      });

      if (lyrics) {
        return {
          success: true,
          data: {
            title: searchRes.data.response.sections[0].hits[0].result.full_title,
            artist: searchRes.data.response.sections[0].hits[0].result.primary_artist.name,
            lyrics: lyrics.trim(),
            url: lyricsUrl,
            source: 'Genius'
          }
        };
      }
    }
  } catch (error) {
    console.error('Genius failed:', error.message);
  }

  return {
    success: false,
    error: 'Lyrics not found'
  };
}

module.exports = async (req, res) => {
  const { song } = req.query;

  if (!song) {
    return res.status(400).json({
      success: false,
      message: 'Song parameter is required',
      example: '/search/lyrics?song=Shape of You'
    });
  }

  const result = await getLyrics(song);
  res.json(result);
};
