const axios = require('axios');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');

// Cookie and agent setup for ytdl-core
const agent = ytdl.createAgent([
  {
    "domain": ".youtube.com",
    "expirationDate": 1759595328,
    "hostOnly": false,
    "httpOnly": false,
    "name": "__Secure-1PAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "your_cookie_value"
  }
]);

async function getYouTubePremium(url) {
  // Method 1: Try @distube/ytdl-core with agent
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const info = await ytdl.getInfo(url, { agent });
    
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    const highestVideo = videoFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    const highestAudio = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

    return {
      success: true,
      data: {
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        channel: info.videoDetails.author.channel_url,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        views: info.videoDetails.viewCount,
        description: info.videoDetails.description,
        uploadDate: info.videoDetails.uploadDate,
        formats: {
          video: highestVideo ? {
            quality: highestVideo.qualityLabel,
            url: highestVideo.url,
            size: highestVideo.contentLength,
            format: highestVideo.container,
            fps: highestVideo.fps
          } : null,
          audio: highestAudio ? {
            quality: `${highestAudio.audioBitrate}kbps`,
            url: highestAudio.url,
            size: highestAudio.contentLength,
            format: highestAudio.container
          } : null
        },
        premium: true,
        source: 'ytdl-core'
      }
    };
  } catch (error) {
    console.log('ytdl-core failed:', error.message);
    
    // Method 2: Try Cobalt API
    try {
      const cobaltResponse = await axios.post('https://api.cobalt.tools/api/json', {
        url: url,
        vQuality: '1080',
        filenamePattern: 'basic',
        isAudioOnly: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (cobaltResponse.data.status === 'success' || cobaltResponse.data.url) {
        return {
          success: true,
          data: {
            url: cobaltResponse.data.url,
            source: 'Cobalt API'
          }
        };
      }
    } catch (cobaltError) {
      console.log('Cobalt API failed:', cobaltError.message);
    }

    // Method 3: Try Y2Mate API
    try {
      const videoId = extractVideoId(url);
      const y2mateResponse = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', 
        `k_query=${encodeURIComponent(url)}&k_page=home&hl=en&q_auto=0`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      if (y2mateResponse.data.status === 'ok') {
        return {
          success: true,
          data: {
            title: y2mateResponse.data.title,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            links: y2mateResponse.data.links,
            source: 'Y2Mate'
          }
        };
      }
    } catch (y2mateError) {
      console.log('Y2Mate failed:', y2mateError.message);
    }

    // Method 4: Try yt-search for metadata + direct download link
    try {
      const videoId = extractVideoId(url);
      const searchResult = await yts({ videoId });
      
      if (searchResult) {
        return {
          success: true,
          data: {
            title: searchResult.title,
            author: searchResult.author.name,
            duration: searchResult.duration.seconds,
            thumbnail: searchResult.thumbnail,
            views: searchResult.views,
            description: searchResult.description,
            url: searchResult.url,
            downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
            source: 'yt-search',
            note: 'Use a download service with this URL'
          }
        };
      }
    } catch (ytsError) {
      console.log('yt-search failed:', ytsError.message);
    }

    // Method 5: Try alternative API
    try {
      const videoId = extractVideoId(url);
      const altResponse = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
      
      return {
        success: true,
        data: {
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          source: 'Alternative Method',
          note: 'Video information retrieved. Use external downloader.'
        }
      };
    } catch (altError) {
      console.log('Alternative method failed:', altError.message);
    }

    // All methods failed
    return {
      success: false,
      error: 'All download methods failed. YouTube may have blocked the request.',
      details: error.message,
      suggestion: 'Try using the official YouTube app or Premium subscription'
    };
  }
}

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 'error',
      creator: 'Ntando Mods',
      success: false,
      message: 'URL parameter is required',
      example: '/download/youtube-premium?url=https://youtube.com/watch?v=...'
    });
  }

  try {
    const result = await getYouTubePremium(url);
    
    res.json({
      status: result.success ? 'success' : 'error',
      creator: 'Ntando Mods',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      creator: 'Ntando Mods',
      success: false,
      error: error.message
    });
  }
};
