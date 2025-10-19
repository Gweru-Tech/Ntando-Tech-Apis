const axios = require('axios');

async function chatGPT(text) {
  try {
    // Using free GPT API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: text }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'your-api-key'}`
      }
    });

    return {
      success: true,
      data: {
        response: response.data.choices[0].message.content
      }
    };
  } catch (error) {
    // Fallback to free alternative
    try {
      const fallback = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(text)}&owner=Ladybug&botname=Ladybug`);
      return {
        success: true,
        data: {
          response: fallback.data.response
        }
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError.message
      };
    }
  }
}

module.exports = async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text parameter is required',
      example: '/ai/chatgpt?text=Hello, how are you?'
    });
  }

  const result = await chatGPT(text);
  res.json(result);
};
