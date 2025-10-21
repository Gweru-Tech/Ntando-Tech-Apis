const axios = require('axios');

class YouTubeSearchAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Search for YouTube videos
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @param {string} order - Order of results (relevance, date, rating, viewCount, title)
   * @returns {Promise<Object>} Search results
   */
  async searchVideos(query, maxResults = 10, order = 'relevance') {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults,
          order: order,
          key: this.apiKey
        }
      });

      return {
        success: true,
        results: response.data.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          thumbnail: {
            default: item.snippet.thumbnails.default.url,
            medium: item.snippet.thumbnails.medium.url,
            high: item.snippet.thumbnails.high.url
          },
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        })),
        totalResults: response.data.pageInfo.totalResults
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get video details by ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details
   */
  async getVideoDetails(videoId) {
    try {
      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });

      if (response.data.items.length === 0) {
        return {
          success: false,
          error: 'Video not found'
        };
      }

      const video = response.data.items[0];
      return {
        success: true,
        video: {
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount,
          likeCount: video.statistics.likeCount,
          commentCount: video.statistics.commentCount,
          thumbnail: video.snippet.thumbnails.high.url,
          url: `https://www.youtube.com/watch?v=${video.id}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Search for music videos
   * @param {string} songName - Song name
   * @param {string} artistName - Artist name (optional)
   * @returns {Promise<Object>} Music search results
   */
  async searchMusic(songName, artistName = '') {
    const query = artistName ? `${songName} ${artistName} official audio` : `${songName} official audio`;
    return await this.searchVideos(query, 5, 'relevance');
  }

  /**
   * Get trending videos
   * @param {string} regionCode - Region code (e.g., 'US', 'GB')
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Object>} Trending videos
   */
  async getTrendingVideos(regionCode = 'US', maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode: regionCode,
          maxResults: maxResults,
          key: this.apiKey
        }
      });

      return {
        success: true,
        results: response.data.items.map(item => ({
          videoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          viewCount: item.statistics.viewCount,
          likeCount: item.statistics.likeCount,
          thumbnail: item.snippet.thumbnails.high.url,
          url: `https://www.youtube.com/watch?v=${item.id}`
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get channel information
   * @param {string} channelId - YouTube channel ID
   * @returns {Promise<Object>} Channel details
   */
  async getChannelInfo(channelId) {
    try {
      const response = await axios.get(`${this.baseURL}/channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: channelId,
          key: this.apiKey
        }
      });

      if (response.data.items.length === 0) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      const channel = response.data.items[0];
      return {
        success: true,
        channel: {
          channelId: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount,
          thumbnail: channel.snippet.thumbnails.high.url,
          url: `https://www.youtube.com/channel/${channel.id}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

module.exports = YouTubeSearchAPI;
