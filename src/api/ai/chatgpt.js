const axios = require('axios');

// Multiple AI backends for reliability
const AI_BACKENDS = {
  // Backend 1: GPT4Free
  gpt4free: async (message, conversationHistory) => {
    const response = await axios.post('https://api.airforce/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Ladybug AI, a helpful and friendly AI assistant created by Ntando Mods. You are knowledgeable, creative, and always ready to help users with their questions.'
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    return response.data.choices[0].message.content;
  },

  // Backend 2: Blackbox AI
  blackbox: async (message) => {
    const response = await axios.post('https://www.blackbox.ai/api/chat', {
      messages: [{
        role: 'user',
        content: message
      }],
      previewToken: null,
      userId: null,
      codeModelMode: true,
      agentMode: {},
      trendingAgentMode: {},
      isMicMode: false,
      isChromeExt: false,
      githubToken: null
    });
    return response.data.response;
  },

  // Backend 3: Hugging Face
  huggingface: async (message) => {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
      {
        inputs: `You are Ladybug AI, a helpful assistant. User: ${message}\nAssistant:`,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': 'Bearer hf_xxxxxxxxxx' // Optional: Add your HF token
        }
      }
    );
    return response.data[0].generated_text;
  },

  // Backend 4: DeepInfra (Alternative)
  deepinfra: async (message) => {
    const response = await axios.post(
      'https://api.deepinfra.com/v1/openai/chat/completions',
      {
        model: 'meta-llama/Meta-Llama-3-70B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'You are Ladybug AI, a helpful assistant created by Ntando Mods.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      }
    );
    return response.data.choices[0].message.content;
  }
};

// Conversation storage (in-memory, use Redis for production)
const conversations = new Map();

async function ladybugAI(message, userId = 'default', useHistory = true) {
  try {
    // Get or create conversation history
    let conversationHistory = [];
    if (useHistory && conversations.has(userId)) {
      conversationHistory = conversations.get(userId);
    }

    // Try backends in order
    let response;
    let backend = 'unknown';

    try {
      response = await AI_BACKENDS.gpt4free(message, conversationHistory);
      backend = 'gpt4free';
    } catch (error) {
      console.log('GPT4Free failed, trying Blackbox...');
      try {
        response = await AI_BACKENDS.blackbox(message);
        backend = 'blackbox';
      } catch (error2) {
        console.log('Blackbox failed, trying DeepInfra...');
        try {
          response = await AI_BACKENDS.deepinfra(message);
          backend = 'deepinfra';
        } catch (error3) {
          console.log('DeepInfra failed, trying Hugging Face...');
          response = await AI_BACKENDS.huggingface(message);
          backend = 'huggingface';
        }
      }
    }

    // Update conversation history
    if (useHistory) {
      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      );
      
      // Keep only last 10 messages
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
      
      conversations.set(userId, conversationHistory);
    }

    return {
      success: true,
      creator: "Ntando Mods - Ladybug🐞",
      backend: backend,
      data: {
        response: response,
        message: message,
        timestamp: new Date().toISOString(),
        conversationId: userId,
        messageCount: conversationHistory.length / 2
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'All AI backends failed',
      message: error.message
    };
  }
}

module.exports = async (req, res) => {
  const { text, message, userId, clearHistory } = req.query;
  const userMessage = text || message;

  if (!userMessage) {
    return res.status(400).json({
      success: false,
      message: 'Text or message parameter is required',
      example: '/ai/ladybug?text=Hello, how are you?',
      creator: "Ntando Mods - Ladybug🐞",
      documentation: {
        endpoint: '/ai/ladybug',
        method: 'GET',
        parameters: {
          text: 'Your message to Ladybug AI (required)',
          message: 'Alternative parameter for your message (required)',
          userId: 'Unique user ID for conversation history (optional, default: "default")',
          clearHistory: 'Set to "true" to clear conversation history (optional)'
        },
        examples: [
          '/ai/ladybug?text=What is JavaScript?',
          '/ai/ladybug?message=Tell me a joke&userId=user123',
          '/ai/ladybug?text=Hello&clearHistory=true'
        ],
        features: [
          'Multi-backend AI support for high reliability',
          'Conversation history tracking',
          'Automatic fallback between AI providers',
          'Free to use - no API key required'
        ]
      }
    });
  }

  // Clear conversation history if requested
  if (clearHistory === 'true' && userId) {
    conversations.delete(userId);
  }

  try {
    const result = await ladybugAI(userMessage, userId || 'default', true);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      creator: "Ntando Mods - Ladybug🐞"
    });
  }
};
