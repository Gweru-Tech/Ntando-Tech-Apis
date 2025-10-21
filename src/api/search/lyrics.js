const axios = require('axios');

class LyricsAPI {
  constructor() {
    this.sources = {
      lrclib: 'https://lrclib.net/api',
      lyricsOvh: 'https://api.lyrics.ovh/v1',
      geniusAPI: 'https://api.genius.com',
      azLyrics: 'https://api.lyrics.ovh/suggest'
    };
    this.geniusToken = null;
  }

  /**
   * Set Genius API token
   * @param {string} token - Genius API access token
   */
  setGeniusToken(token) {
    this.geniusToken = token;
  }

  /**
   * Search for song lyrics using multiple sources
   * @param {string} songName - Song name
   * @param {string} artistName - Artist name (optional but recommended)
   * @returns {Promise<Object>} Lyrics and song info
   */
  async searchLyrics(songName, artistName = '') {
    // Try lrclib first (most reliable and free)
    try {
      const result = await this.searchLrclib(songName, artistName);
      if (result.success) return result;
    } catch (error) {
      console.log('Lrclib failed, trying next source...');
    }

    // Try lyrics.ovh (requires artist name)
    if (artistName) {
      try {
        const result = await this.searchLyricsOvh(songName, artistName);
        if (result.success) return result;
      } catch (error) {
        console.log('Lyrics.ovh failed, trying next source...');
      }
    }

    // Try Genius if token is available
    if (this.geniusToken) {
      try {
        const result = await this.searchGenius(songName, artistName);
        if (result.success) return result;
      } catch (error) {
        console.log('Genius failed');
      }
    }

    return {
      success: false,
      error: 'Lyrics not found in any source. Please provide both song name and artist name for better results.'
    };
  }

  /**
   * Search using lrclib.net API (Free, no key required, most reliable)
   * @param {string} songName - Song name
   * @param {string} artistName - Artist name
   * @returns {Promise<Object>} Lyrics result
   */
  async searchLrclib(songName, artistName) {
    try {
      const params = {
        track_name: songName
      };

      if (artistName) {
        params.artist_name = artistName;
      }

      const response = await axios.get(`${this.sources.lrclib}/search`, {
        params: params,
        timeout: 10000,
        headers: {
          'User-Agent': 'LyricsAPI/1.0'
        }
      });

      if (!response.data || response.data.length === 0) {
        return { success: false, error: 'No lyrics found' };
      }

      const song = response.data[0];

      return {
        success: true,
        source: 'lrclib.net',
        song: {
          title: song.trackName || song.name || songName,
          artist: song.artistName || song.artist || artistName,
          album: song.albumName || song.album || 'Unknown',
          duration: song.duration || 0,
          lyrics: song.plainLyrics || song.syncedLyrics || 'Lyrics not available',
          syncedLyrics: song.syncedLyrics || null,
          instrumental: song.instrumental || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Search using lyrics.ovh API (Free, requires artist name)
   * @param {string} songName - Song name
   * @param {string} artistName - Artist name
   * @returns {Promise<Object>} Lyrics result
   */
  async searchLyricsOvh(songName, artistName) {
    if (!artistName) {
      return { success: false, error: 'Artist name required for this source' };
    }

    try {
      const response = await axios.get(
        `${this.sources.lyricsOvh}/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'LyricsAPI/1.0'
          }
        }
      );

      if (!response.data || !response.data.lyrics) {
        return { success: false, error: 'No lyrics found' };
      }

      return {
        success: true,
        source: 'lyrics.ovh',
        song: {
          title: songName,
          artist: artistName,
          lyrics: response.data.lyrics.trim()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Search using Genius API (requires API token)
   * @param {string} songName - Song name
   * @param {string} artistName - Artist name
   * @returns {Promise<Object>} Lyrics result
   */
  async searchGenius(songName, artistName) {
    if (!this.geniusToken) {
      return { success: false, error: 'Genius API token not set' };
    }

    try {
      const query = artistName ? `${songName} ${artistName}` : songName;

      const searchResponse = await axios.get(`${this.sources.geniusAPI}/search`, {
        params: { q: query },
        headers: {
          'Authorization': `Bearer ${this.geniusToken}`
        },
        timeout: 10000
      });

      if (!searchResponse.data.response.hits || searchResponse.data.response.hits.length === 0) {
        return { success: false, error: 'No lyrics found' };
      }

      const song = searchResponse.data.response.hits[0].result;

      return {
        success: true,
        source: 'genius.com',
        song: {
          id: song.id,
          title: song.title,
          artist: song.primary_artist.name,
          album: song.album?.name || 'Unknown',
          releaseDate: song.release_date_for_display,
          thumbnail: song.song_art_image_url,
          url: song.url,
          lyrics: 'Visit URL for full lyrics (Genius requires web scraping for full lyrics)',
          apiNote: 'Full lyrics require additional scraping. Use the URL provided.'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get lyrics by exact match
   * @param {string} songName - Exact song name
   * @param {string} artistName - Exact artist name
   * @param {string} albumName - Album name (optional)
   * @returns {Promise<Object>} Lyrics result
   */
  async getLyricsByExactMatch(songName, artistName, albumName = '') {
    try {
      const params = {
        track_name: songName,
        artist_name: artistName
      };

      if (albumName) {
        params.album_name = albumName;
      }

      const response = await axios.get(`${this.sources.lrclib}/get`, {
        params: params,
        timeout: 10000,
        headers: {
          'User-Agent': 'LyricsAPI/1.0'
        }
      });

      return {
        success: true,
        source: 'lrclib.net',
        song: {
          title: response.data.trackName,
          artist: response.data.artistName,
          album: response.data.albumName || 'Unknown',
          duration: response.data.duration,
          lyrics: response.data.plainLyrics || 'Lyrics not available',
          syncedLyrics: response.data.syncedLyrics || null,
          instrumental: response.data.instrumental || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Search and get multiple results
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Object>} Multiple lyrics results
   */
  async searchMultiple(query, limit = 5) {
    try {
      const response = await axios.get(`${this.sources.lrclib}/search`, {
        params: {
          q: query
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'LyricsAPI/1.0'
        }
      });

      if (!response.data || response.data.length === 0) {
        return { success: false, error: 'No results found' };
      }

      const results = response.data.slice(0, limit);

      return {
        success: true,
        source: 'lrclib.net',
        results: results.map(song => ({
          title: song.trackName,
          artist: song.artistName,
          album: song.albumName || 'Unknown',
          duration: song.duration,
          hasLyrics: !!song.plainLyrics,
          instrumental: song.instrumental || false
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = LyricsAPI;
