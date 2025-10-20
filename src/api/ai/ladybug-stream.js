const axios = require('axios');

module.exports = async (req, res) => {
  const { text, message } = req.query;
  const userMessage = text || message;

  if (!userMessage) {
    return res.status(400).json({
      success: false,
      message: 'Text parameter is required'
    });
  }

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await axios.post(
      'https://api.airforce/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are Ladybug AI by Ntando Mods.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        stream: true
      },
      {
        responseType: 'stream'
      }
    );

    response.data.on('data', (chunk) => {
      res.write(`data: ${chunk}\n\n`);
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
