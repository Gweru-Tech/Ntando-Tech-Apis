// youtube-search-api.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

// YouTube Search API
router.get('/api/search/youtube', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required',
                example: '/api/search/youtube?query=your search term&limit=10'
            });
        }

        // Method 1: Using YouTube's internal API
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        
        // Extract ytInitialData from the page
        const scriptTags = $('script').toArray();
        let ytInitialData = null;

        for (const script of scriptTags) {
            const content = $(script).html();
            if (content && content.includes('var ytInitialData = ')) {
                const match = content.match(/var ytInitialData = ({.+?});/);
                if (match) {
                    ytInitialData = JSON.parse(match[1]);
                    break;
                }
            }
        }

        if (!ytInitialData) {
            throw new Error('Could not extract video data');
        }

        // Parse video data
        const contents = ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
        
        const videos = [];
        
        for (const item of contents) {
            if (item.videoRenderer && videos.length < parseInt(limit)) {
                const video = item.videoRenderer;
                
                videos.push({
                    videoId: video.videoId,
                    title: video.title.runs[0].text,
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    thumbnail: video.thumbnail.thumbnails[video.thumbnail.thumbnails.length - 1].url,
                    duration: video.lengthText?.simpleText || 'Live',
                    views: video.viewCountText?.simpleText || '0 views',
                    publishedTime: video.publishedTimeText?.simpleText || 'Unknown',
                    channel: {
                        name: video.ownerText?.runs[0]?.text || 'Unknown',
                        url: video.ownerText?.runs[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url 
                            ? `https://www.youtube.com${video.ownerText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}` 
                            : null,
                        verified: video.ownerBadges?.some(badge => 
                            badge.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED'
                        ) || false
                    },
                    description: video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || ''
                });
            }
        }

        res.json({
            success: true,
            query: query,
            results: videos.length,
            data: videos,
            developer: 'Ntando Mods',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('YouTube Search Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search YouTube',
            error: error.message,
            developer: 'Ntando Mods'
        });
    }
});

// Alternative YouTube Search using different method
router.get('/api/search/youtube-v2', async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required'
            });
        }

        // Using YouTube's suggest API for quick results
        const apiUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
        
        const response = await axios.get(apiUrl);
        const suggestions = response.data[1].slice(0, parseInt(limit));

        // Get video details for each suggestion
        const videos = await Promise.all(
            suggestions.map(async (suggestion) => {
                try {
                    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion)}`;
                    const searchResponse = await axios.get(searchUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    const html = searchResponse.data;
                    const match = html.match(/var ytInitialData = ({.+?});/);
                    
                    if (match) {
                        const data = JSON.parse(match[1]);
                        const videoRenderer = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].videoRenderer;
                        
                        if (videoRenderer) {
                            return {
                                videoId: videoRenderer.videoId,
                                title: videoRenderer.title.runs[0].text,
                                url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
                                thumbnail: videoRenderer.thumbnail.thumbnails[0].url
                            };
                        }
                    }
                } catch (err) {
                    return null;
                }
            })
        );

        res.json({
            success: true,
            query: query,
            results: videos.filter(v => v !== null).length,
            data: videos.filter(v => v !== null),
            developer: 'Ntando Mods'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to search YouTube',
            error: error.message
        });
    }
});

module.exports = router;
