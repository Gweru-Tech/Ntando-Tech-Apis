const axios = require('axios');

class YouTubeSearchAPI {
  constructor(apiKey = sd_3bba8e23f2744eeb531e01df42f0799f) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.supadata.ai/v1';
  }

  /**
   * Set Supadata API key
   * @param {string} key - Supadata API key
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Extract video ID from URL or return as is
   * @param {string} input - Video URL or ID
   * @returns {string} Video ID
   */
  extractVideoId(input) {
    if (!input) return null;
    
    // If it's already just an ID
    if (input.length === 11 && !input.includes('/') && !input.includes('?')) {
      return input;
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }

    return input;
  }

  /**
   * Search for YouTube videos
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Object>} Search results
   */
  async searchVideos(query, maxResults = 10) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key is required. Please set it using setApiKey() method.'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/youtube/search`,
        {
          query: query,
          max_results: maxResults
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (!response.data || !response.data.results) {
        return {
          success: false,
          error: 'No results found'
        };
      }

      return {
        success: true,
        results: response.data.results.map(item => ({
          videoId: item.id || item.videoId,
          title: item.title,
          description: item.description || '',
          channelTitle: item.channel?.name || item.channelTitle || '',
          channelId: item.channel?.id || item.channelId || '',
          publishedAt: item.publishedAt || item.published || '',
          duration: item.duration || '',
          viewCount: item.viewCount || item.views || 0,
          thumbnail: {
            default: item.thumbnail || item.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id}/default.jpg`,
            medium: item.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
            high: item.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            maxres: item.thumbnails?.maxres?.url || `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`
          },
          url: `https://www.youtube.com/watch?v=${item.id || item.videoId}`,
          embedUrl: `https://www.youtube.com/embed/${item.id || item.videoId}`
        })),
        totalResults: response.data.results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Search failed'
      };
    }
  }

  /**
   * Get video details by ID or URL
   * @param {string} videoInput - YouTube video ID or URL
   * @returns {Promise<Object>} Video details
   */
  async getVideoDetails(videoInput) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key is required. Please set it using setApiKey() method.'
      };
    }

    const videoId = this.extractVideoId(videoInput);

    if (!videoId) {
      return {
        success: false,
        error: 'Invalid video ID or URL'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/youtube/video`,
        {
          id: videoId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const video = response.data;

      return {
        success: true,
        video: {
          videoId: video.id || videoId,
          title: video.title,
          description: video.description || '',
          channelTitle: video.channel?.name || video.author || '',
          channelId: video.channel?.id || video.channelId || '',
          publishedAt: video.publishedAt || video.published || '',
          duration: video.duration || '',
          viewCount: video.viewCount || video.views || 0,
          likeCount: video.likeCount || video.likes || 0,
          commentCount: video.commentCount || video.comments || 0,
          thumbnail: {
            default: video.thumbnail || video.thumbnails?.default?.url || `https://i.ytimg.com/vi/${videoId}/default.jpg`,
            medium: video.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            high: video.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            maxres: video.thumbnails?.maxres?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
          },
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          tags: video.tags || [],
          category: video.category || ''
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get video details'
      };
    }
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
   * Get channel information
   * @param {string} channelId - YouTube channel ID or URL
   * @returns {Promise<Object>} Channel details
   */
  async getChannelInfo(channelId) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key is required. Please set it using setApiKey() method.'
      };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/youtube/channel`,
        {
          id: channelId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const channel = response.data;

      return {
        success: true,
        channel: {
          channelId: channel.id || channelId,
          title: channel.name || channel.title,
          description: channel.description || '',
          subscriberCount: channel.subscriberCount || channel.subscribers || 0,
          videoCount: channel.videoCount || channel.videos || 0,
          viewCount: channel.viewCount || channel.views || 0,
          thumbnail: channel.thumbnail || channel.avatar || '',
          url: `https://www.youtube.com/channel/${channel.id || channelId}`,
          customUrl: channel.customUrl || '',
          country: channel.country || ''
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get channel info'
      };
    }
  }

  /**
   * Get video transcript/captions
   * @param {string} videoInput - YouTube video ID or URL
   * @returns {Promise<Object>} Video transcript
   */
  async getTranscript(videoInput) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key is required. Please set it using setApiKey() method.'
      };
    }

    const videoId = this.extractVideoId(videoInput);

    try {
      const response = await axios.post(
        `${this.baseURL}/youtube/transcript`,
        {
          id: videoId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return {
        success: true,
        transcript: response.data.transcript || response.data,
        videoId: videoId
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get transcript'
      };
    }
  }

  /**
   * Get video comments
   * @param {string} videoInput - YouTube video ID or URL
   * @param {number} maxResults - Maximum number of comments
   * @returns {Promise<Object>} Video comments
   */
  async getComments(videoInput, maxResults = 20) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key is required. Please set it using setApiKey() method.'
      };
    }

    const videoId = this.extractVideoId(videoInput);

    try {
      const response = await axios.post(
        `${this.baseURL}/youtube/comments`,
        {
          id: videoId,
          max_results: maxResults
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return {
        success: true,
        comments: response.data.comments || response.data,
        videoId: videoId
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get comments'
      };
    }
  }
}

module.exports = YouTubeSearchAPI;
