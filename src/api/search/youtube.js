// youtube-search-api.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// YouTube Search API - Working Version
router.get('/api/search/youtube', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required',
                example: '/api/search/youtube?query=your search term&limit=10',
                developer: 'Ntando Mods'
            });
        }

        // Using YouTube's internal API endpoint
        const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Public YouTube API key
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${limit}&type=video&key=${apiKey}`;

        const response = await axios.get(searchUrl);
        
        if (!response.data.items || response.data.items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No videos found',
                query: query,
                developer: 'Ntando Mods'
            });
        }

        // Get video statistics
        const videoIds = response.data.items.map(item => item.id.videoId).join(',');
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
        const statsResponse = await axios.get(statsUrl);

        const videos = response.data.items.map((item, index) => {
            const stats = statsResponse.data.items[index];
            
            return {
                videoId: item.id.videoId,
                title: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnail: {
                    default: item.snippet.thumbnails.default.url,
                    medium: item.snippet.thumbnails.medium.url,
                    high: item.snippet.thumbnails.high.url,
                    maxres: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high.url
                },
                duration: stats?.contentDetails?.duration || 'Unknown',
                views: stats?.statistics?.viewCount || '0',
                likes: stats?.statistics?.likeCount || '0',
                publishedAt: item.snippet.publishedAt,
                publishedTime: formatPublishedTime(item.snippet.publishedAt),
                channel: {
                    name: item.snippet.channelTitle,
                    channelId: item.snippet.channelId,
                    url: `https://www.youtube.com/channel/${item.snippet.channelId}`
                },
                description: item.snippet.description
            };
        });

        res.json({
            success: true,
            query: query,
            results: videos.length,
            data: videos,
            developer: 'Ntando Mods',
            api: 'YouTube Search API v1',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('YouTube Search Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to search YouTube',
            error: error.response?.data?.error?.message || error.message,
            developer: 'Ntando Mods'
        });
    }
});

// Alternative YouTube Search without API Key (Web Scraping)
router.get('/api/search/youtube-scrape', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required',
                developer: 'Ntando Mods'
            });
        }

        // Using yt-search npm package alternative
        const searchUrl = `https://youtube.com/results?search_query=${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const data = response.data;
        
        // Extract ytInitialData
        const ytInitialDataMatch = data.match(/var ytInitialData = ({.*?});/s);
        
        if (!ytInitialDataMatch) {
            throw new Error('Could not extract video data from YouTube');
        }

        const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
        
        const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
        
        const videos = [];
        
        for (const section of contents) {
            const items = section?.itemSectionRenderer?.contents || [];
            
            for (const item of items) {
                if (item.videoRenderer && videos.length < parseInt(limit)) {
                    const video = item.videoRenderer;
                    
                    videos.push({
                        videoId: video.videoId,
                        title: video.title?.runs?.[0]?.text || 'Unknown',
                        url: `https://www.youtube.com/watch?v=${video.videoId}`,
                        thumbnail: video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || '',
                        duration: video.lengthText?.simpleText || 'Live',
                        views: video.viewCountText?.simpleText || '0 views',
                        publishedTime: video.publishedTimeText?.simpleText || 'Unknown',
                        channel: {
                            name: video.ownerText?.runs?.[0]?.text || 'Unknown',
                            channelId: video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.navigationEndpoint?.browseEndpoint?.browseId || '',
                            url: `https://www.youtube.com${video.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || ''}`,
                            verified: video.ownerBadges?.some(badge => 
                                badge.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED'
                            ) || false,
                            thumbnail: video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || ''
                        },
                        description: video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || ''
                    });
                }
            }
        }

        if (videos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No videos found',
                query: query,
                developer: 'Ntando Mods'
            });
        }

        res.json({
            success: true,
            query: query,
            results: videos.length,
            data: videos,
            developer: 'Ntando Mods',
            api: 'YouTube Search API v2 (Scrape)',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('YouTube Scrape Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to search YouTube',
            error: error.message,
            developer: 'Ntando Mods'
        });
    }
});

// Helper function to format published time
function formatPublishedTime(publishedAt) {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffMs / 2592000000);
    const diffYears = Math.floor(diffMs / 31536000000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

module.exports = router;
