const axios = require('axios');

async function generateImage(prompt) {
  try {
    // Using Pollinations AI (Free)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    
    return {
      success: true,
      data: {
        prompt: prompt,
        imageUrl: imageUrl,
        alternative: `https://api.deepai.org/api/text2img`
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: 'Prompt parameter is required',
      example: '/ai/imagine?prompt=a beautiful sunset over mountains'
    });
  }

  const result = await generateImage(prompt);
  res.json(result);
};
