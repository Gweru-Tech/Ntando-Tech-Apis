const axios = require('axios');

class YouTubeSearchAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.alternativeAPI = 'https://yt-api.p.rapidapi.com'; // RapidAPI alternative
    this.rapidAPIKey = null;
  }

  /**
   * Set RapidAPI key for alternative access
   * @param {string} key - RapidAPI key
   */
  setRapidAPIKey(key) {
    this.rapidAPIKey = key;
  }

  /**
   * Search for YouTube videos using official API
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @param {string} order - Order of results
   * @returns {Promise<Object>} Search results
   */
  async searchVideos(query, maxResults = 10, order = 'relevance') {
    if (!this.apiKey && !this.rapidAPIKey) {
      return await this.searchVideosNoAPI(query, maxResults);
    }

    try {
      if (this.apiKey) {
        return await this.searchWithGoogleAPI(query, maxResults, order);
      } else if (this.rapidAPIKey) {
        return await this.searchWithRapidAPI(query, maxResults);
      }
    } catch (error) {
      console.error('Primary search failed, trying alternative:', error.message);
      return await this.searchVideosNoAPI(query, maxResults);
    }
  }

  /**
   * Search using Google YouTube API
   */
  async searchWithGoogleAPI(query, maxResults, order) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults,
          order: order,
          key: this.apiKey
        },
        timeout: 10000
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
            default: item.snippet.thumbnails.default?.url,
            medium: item.snippet.thumbnails.medium?.url,
            high: item.snippet.thumbnails.high?.url
          },
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        })),
        totalResults: response.data.pageInfo?.totalResults || 0
      };
    } catch (error) {
      throw new Error(`Google API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Search using RapidAPI
   */
  async searchWithRapidAPI(query, maxResults) {
    try {
      const response = await axios.get(`${this.alternativeAPI}/search`, {
        params: {
          query: query,
          max_results: maxResults
        },
        headers: {
          'X-RapidAPI-Key': this.rapidAPIKey,
          'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
        },
        timeout: 10000
      });

      return {
        success: true,
        results: response.data.data.map(item => ({
          videoId: item.videoId,
          title: item.title,
          description: item.description || '',
          channelTitle: item.channelTitle,
          channelId: item.channelId,
          publishedAt: item.publishedTimeText,
          thumbnail: {
            default: item.thumbnail?.[0]?.url,
            medium: item.thumbnail?.[1]?.url,
            high: item.thumbnail?.[2]?.url || item.thumbnail?.[0]?.url
          },
          url: `https://www.youtube.com/watch?v=${item.videoId}`
        })),
        totalResults: response.data.data.length
      };
    } catch (error) {
      throw new Error(`RapidAPI Error: ${error.message}`);
    }
  }

  /**
   * Search without API (scraping alternative - use with caution)
   */
  async searchVideosNoAPI(query, maxResults) {
    try {
      // Using invidious public API as fallback
      const response = await axios.get(`https://invidious.snopyta.org/api/v1/search`, {
        params: {
          q: query,
          type: 'video'
        },
        timeout: 10000
      });

      const results = response.data.slice(0, maxResults);

      return {
        success: true,
        results: results.map(item => ({
          videoId: item.videoId,
          title: item.title,
          description: item.description || '',
          channelTitle: item.author,
          channelId: item.authorId,
          publishedAt: new Date(item.published * 1000).toISOString(),
          thumbnail: {
            default: item.videoThumbnails?.[0]?.url,
            medium: item.videoThumbnails?.[2]?.url,
            high: item.videoThumbnails?.[4]?.url
          },
          url: `https://www.youtube.com/watch?v=${item.videoId}`
        })),
        totalResults: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: `All search methods failed: ${error.message}`
      };
    }
  }

  /**
   * Get video details by ID
   */
  async getVideoDetails(videoId) {
    if (!this.apiKey) {
      return await this.getVideoDetailsNoAPI(videoId);
    }

    try {
      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        },
        timeout: 10000
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
          thumbnail: video.snippet.thumbnails.high?.url,
          url: `https://www.youtube.com/watch?v=${video.id}`
        }
      };
    } catch (error) {
      return await this.getVideoDetailsNoAPI(videoId);
    }
  }

  /**
   * Get video details without API
   */
  async getVideoDetailsNoAPI(videoId) {
    try {
      const response = await axios.get(`https://invidious.snopyta.org/api/v1/videos/${videoId}`, {
        timeout: 10000
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
          duration: `PT${video.lengthSeconds}S`,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          thumbnail: video.videoThumbnails?.[4]?.url,
          url: `https://www.youtube.com/watch?v=${video.videoId}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for music videos
   */
  async searchMusic(songName, artistName = '') {
    const query = artistName ? `${songName} ${artistName} official audio` : `${songName} official audio`;
    return await this.searchVideos(query, 5, 'relevance');
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(regionCode = 'US', maxResults = 10) {
    try {
      const response = await axios.get(`https://invidious.snopyta.org/api/v1/trending`, {
        params: {
          region: regionCode
        },
        timeout: 10000
      });

      const results = response.data.slice(0, maxResults);

      return {
        success: true,
        results: results.map(item => ({
          videoId: item.videoId,
          title: item.title,
          description: item.description || '',
          channelTitle: item.author,
          viewCount: item.viewCount,
          thumbnail: item.videoThumbnails?.[4]?.url,
          url: `https://www.youtube.com/watch?v=${item.videoId}`
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

module.exports = YouTubeSearchAPI;
