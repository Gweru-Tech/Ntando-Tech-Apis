const axios = require('axios');

class YouTubeSearchAPI {
  constructor() {
    this.invidiousInstances = [
      'https://vid.puffyan.us',
      'https://invidious.snopyta.org',
      'https://yewtu.be',
      'https://invidious.kavin.rocks',
      'https://inv.riverside.rocks'
    ];
    this.currentInstance = 0;
  }

  /**
   * Get next working Invidious instance
   */
  getNextInstance() {
    const instance = this.invidiousInstances[this.currentInstance];
    this.currentInstance = (this.currentInstance + 1) % this.invidiousInstances.length;
    return instance;
  }

  /**
   * Search for YouTube videos
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Object>} Search results
   */
  async searchVideos(query, maxResults = 10) {
    let lastError;
    
    // Try each instance
    for (let i = 0; i < this.invidiousInstances.length; i++) {
      try {
        const instance = this.getNextInstance();
        const response = await axios.get(`${instance}/api/v1/search`, {
          params: {
            q: query,
            type: 'video',
            sort_by: 'relevance'
          },
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        if (!response.data || response.data.length === 0) {
          continue;
        }

        const results = response.data.slice(0, maxResults);

        return {
          success: true,
          results: results.map(item => ({
            videoId: item.videoId,
            title: item.title,
            description: item.description || item.descriptionHtml || '',
            channelTitle: item.author,
            channelId: item.authorId,
            publishedAt: item.publishedText || '',
            duration: this.formatDuration(item.lengthSeconds),
            viewCount: item.viewCount || 0,
            thumbnail: {
              default: `https://i.ytimg.com/vi/${item.videoId}/default.jpg`,
              medium: `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
              high: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
              maxres: `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`
            },
            url: `https://www.youtube.com/watch?v=${item.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.videoId}`
          })),
          totalResults: results.length,
          source: instance
        };
      } catch (error) {
        lastError = error;
        console.log(`Instance ${this.invidiousInstances[i]} failed, trying next...`);
        continue;
      }
    }

    return {
      success: false,
      error: `All instances failed. Last error: ${lastError?.message || 'Unknown error'}`
    };
  }

  /**
   * Get video details by ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details
   */
  async getVideoDetails(videoId) {
    let lastError;

    for (let i = 0; i < this.invidiousInstances.length; i++) {
      try {
        const instance = this.getNextInstance();
        const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        const video = response.data;

        return {
          success: true,
          video: {
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            channelTitle: video.author,
            channelId: video.authorId,
            publishedAt: new Date(video.published * 1000).toISOString(),
            duration: this.formatDuration(video.lengthSeconds),
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount,
            thumbnail: {
              default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
              medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
              high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
            },
            url: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            source: instance
          }
        };
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    return {
      success: false,
      error: `Failed to get video details: ${lastError?.message || 'Unknown error'}`
    };
  }

  /**
   * Search for music videos
   * @param {string} songName - Song name
   * @param {string} artistName - Artist name
   * @returns {Promise<Object>} Music search results
   */
  async searchMusic(songName, artistName = '') {
    const query = artistName 
      ? `${songName} ${artistName} official audio` 
      : `${songName} official audio`;
    return await this.searchVideos(query, 10);
  }

  /**
   * Get trending videos
   * @param {string} type - Type of trending (music, gaming, movies, news)
   * @returns {Promise<Object>} Trending videos
   */
  async getTrendingVideos(type = 'default') {
    let lastError;

    for (let i = 0; i < this.invidiousInstances.length; i++) {
      try {
        const instance = this.getNextInstance();
        const response = await axios.get(`${instance}/api/v1/trending`, {
          params: type !== 'default' ? { type: type } : {},
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        return {
          success: true,
          results: response.data.slice(0, 20).map(item => ({
            videoId: item.videoId,
            title: item.title,
            description: item.description || '',
            channelTitle: item.author,
            channelId: item.authorId,
            viewCount: item.viewCount,
            publishedAt: item.publishedText,
            thumbnail: {
              default: `https://i.ytimg.com/vi/${item.videoId}/default.jpg`,
              medium: `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
              high: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
            },
            url: `https://www.youtube.com/watch?v=${item.videoId}`
          })),
          source: instance
        };
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    return {
      success: false,
      error: `Failed to get trending videos: ${lastError?.message || 'Unknown error'}`
    };
  }

  /**
   * Format duration from seconds to readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get channel videos
   * @param {string} channelId - YouTube channel ID
   * @returns {Promise<Object>} Channel videos
   */
  async getChannelVideos(channelId) {
    let lastError;

    for (let i = 0; i < this.invidiousInstances.length; i++) {
      try {
        const instance = this.getNextInstance();
        const response = await axios.get(`${instance}/api/v1/channels/${channelId}/videos`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        return {
          success: true,
          videos: response.data.map(item => ({
            videoId: item.videoId,
            title: item.title,
            description: item.description || '',
            publishedAt: item.publishedText,
            viewCount: item.viewCount,
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${item.videoId}`
          })),
          source: instance
        };
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    return {
      success: false,
      error: `Failed to get channel videos: ${lastError?.message || 'Unknown error'}`
    };
  }
}

module.exports = YouTubeSearchAPI;
