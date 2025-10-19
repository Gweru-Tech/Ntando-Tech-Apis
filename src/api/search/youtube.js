const axios = require('axios');

async function youtubeSearch(query) {
  try {
    const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    
    const data = response.data;
    const regex = /var ytInitialData = ({.*?});/s;
    const match = data.match(regex);
    
    if (!match) {
      throw new Error('Could not parse YouTube data');
    }

    const json = JSON.parse(match[1]);
    const videos = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

    const results = videos
      .filter(item => item.videoRenderer)
      .slice(0, 10)
      .map(item => {
        const video = item.videoRenderer;
        return {
          title: video.title.runs[0].text,
          videoId: video.videoId,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          thumbnail: video.thumbnail.thumbnails[0].url,
          duration: video.lengthText?.simpleText || 'Live',
          views: video.viewCountText?.simpleText || '0 views',
          channel: video.ownerText.runs[0].text,
          publishedTime: video.publishedTimeText?.simpleText || 'Unknown'
        };
      });

    return {
      success: true,
      query: query,
      results: results
    };
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
      message: 'Query parameter (q) is required',
      example: '/search/youtube?q=nodejs tutorial'
    });
  }

  const result = await youtubeSearch(q);
  res.json(result);
};
