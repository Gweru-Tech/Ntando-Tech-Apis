const axios = require("axios");

async function youtubeSearch(query) {
  try {
    // Fetch the raw YouTube search HTML
    const response = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    const html = response.data;

    // Match the ytInitialData object (new YouTube format)
    const regex = /(?:var|window\[")ytInitialData(?:"])?\s*=\s*(\{.*?\});/s;
    const match = html.match(regex);

    if (!match) throw new Error("ytInitialData not found in YouTube HTML");

    // Try to parse JSON safely
    let jsonString = match[1];
    // Truncate to the last complete closing brace in case of trailing junk
    jsonString = jsonString.substring(0, jsonString.lastIndexOf("}") + 1);
    const json = JSON.parse(jsonString);

    // Navigate to results
    let contents =
      json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
      json.contents?.sectionListRenderer?.contents ||
      [];

    if (!contents.length) throw new Error("Could not find video list in ytInitialData");

    // Find itemSectionRenderer which contains actual videos
    const section = contents.find(c => c.itemSectionRenderer);
    const items = section?.itemSectionRenderer?.contents || [];

    // Extract video data
    const results = items
      .filter(i => i.videoRenderer)
      .slice(0, 10)
      .map(i => {
        const v = i.videoRenderer;
        return {
          title: v.title?.runs?.[0]?.text || "Untitled",
          videoId: v.videoId,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
          thumbnail: v.thumbnail?.thumbnails?.pop()?.url || null,
          duration: v.lengthText?.simpleText || "Live",
          views: v.viewCountText?.simpleText || "0 views",
          channel: v.ownerText?.runs?.[0]?.text || "Unknown",
          publishedTime: v.publishedTimeText?.simpleText || "Unknown",
        };
      });

    return {
      success: true,
      query,
      results,
    };
  } catch (err) {
    console.error("YouTube search error:", err.message);
    return {
      success: false,
      query,
      results: [],
      error: err.message,
    };
  }
}

// API endpoint (for Express or Vercel)
module.exports = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Missing query parameter ?q=",
      example: "/search/youtube?q=nodejs tutorial",
    });
  }

  const result = await youtubeSearch(q);
  res.json(result);
};
