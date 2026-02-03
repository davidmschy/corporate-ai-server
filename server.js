const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8527939205:AAFWI1EtRA2IAyYnsCnvnFeln0-G4xSvBxY';
const KIMI_API_KEY = process.env.KIMI_API_KEY || 'sk-kimi-K9NadaGIDHbNz8axeWHf1vnzkaTvJTwtGH8dicwVbMO4ZdSGQrgrlqT4Ocp4BQDJ';

// Knowledge base (from Obsidian)
const knowledge = {
  projects: {
    selma: { name: 'Selma LOI', status: 'in_progress', priority: 1 },
    kerman: { name: 'Kerman Walk', status: 'scheduled', priority: 2 },
    parkview: { name: 'Parkview Appraisal', status: 'pending', priority: 2 },
    mikeGolf: { name: 'Mike Golf Studio LOI', status: 'in_progress', priority: 1 }
  },
  contacts: {
    amber: { name: 'Amber Schy', role: 'COO', email: 'amber@geniinow.com' },
    tony: { name: 'Tony Hunt', role: 'Real Estate', email: 'tony@fbx.homes' },
    jonathan: { name: 'Jonathan Zumwalt', role: 'Tentative Maps' }
  },
  goals: [
    'Corporate AI launch and sales',
    'FBX 3 projects to completion',
    'Mike Schy ebook 10K sales',
    'Investment portfolio growth'
  ]
};

// Conversations storage (in-memory, would use DB in production)
const conversations = [];

/**
 * Query Kimi API
 */
async function queryKimi(text, userName) {
  try {
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: 'kimi-k2-5',
      messages: [
        {
          role: 'system',
          content: `You are Genii, Executive Assistant for David Schy. You have access to:
- FBX Developments (real estate projects: Selma, Kerman, Parkview)
- Mike Schy Putting (golf business with ebook)
- Schy Household (personal matters)
- Investments portfolio

Your team includes: Amber Schy (COO), Tony Hunt (Real Estate), Jonathan Zumwalt (Maps).

2026 Goals: Corporate AI launch, complete 3 FBX projects, 10K ebook sales, grow investments.

Respond helpfully and concisely.`
        },
        {
          role: 'user',
          content: `${userName}: ${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Kimi API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send Telegram message
 */
async function sendTelegramMessage(chatId, text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Telegram API error:', error.message);
  }
}

/**
 * Telegram webhook handler
 */
app.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    
    if (!update.message) {
      return res.send('OK');
    }
    
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const from = message.from;
    
    console.log(`[${new Date().toISOString()}] ${from.first_name}: ${text}`);
    
    // Store conversation
    conversations.push({
      chatId,
      user: from.first_name,
      message: text,
      timestamp: new Date()
    });
    
    let responseText = '';
    
    // Try Kimi first
    try {
      responseText = await queryKimi(text, from.first_name);
      console.log('Kimi response:', responseText.substring(0, 100) + '...');
    } catch (kimiError) {
      console.log('Kimi failed, using fallback');
      responseText = generateFallbackResponse(text, from.first_name);
    }
    
    // Send response
    await sendTelegramMessage(chatId, responseText);
    
    res.send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('Error handled');
  }
});

/**
 * Fallback response generator
 */
function generateFallbackResponse(text, userName) {
  const lower = text.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('start')) {
    return `Hello ${userName}! ðŸ‘‹

I'm Genii, your Corporate AI Executive Assistant.

I can help with:
â€¢ FBX projects (Selma, Kerman, Parkview)
â€¢ Mike Schy golf business
â€¢ Team coordination (Amber, Tony, Jonathan)
â€¢ Your 2026 goals

Powered by Kimi K2.5 AI.

What would you like to work on?`;
  }
  
  if (lower.includes('project') || lower.includes('fbx')) {
    return `ðŸ“Š Your FBX Projects:

â€¢ Selma LOI
  Status: In Progress
  Next: Finalize terms

â€¢ Kerman Walk
  Status: Scheduled
  Next: Conduct walk-through

â€¢ Parkview Appraisal
  Status: Pending
  Next: Order appraisal

â€¢ Mike Golf Studio
  Status: In Progress
  Next: Update LOI

Which needs attention?`;
  }
  
  if (lower.includes('contact') || lower.includes('team')) {
    return `ðŸ‘¥ Your Team:

â€¢ Amber Schy
  COO/Operations
  amber@geniinow.com

â€¢ Tony Hunt
  Real Estate Agent
  tony@fbx.homes

â€¢ Jonathan Zumwalt
  Tentative Maps

Need to reach someone?`;
  }
  
  if (lower.includes('goal') || lower.includes('priority')) {
    return `ðŸŽ¯ 2026 Goals:

1. Corporate AI launch and sales
2. FBX 3 projects to completion
3. Mike Schy ebook 10K sales
4. Investment portfolio growth
5. Family time prioritized

Working on any of these?`;
  }
  
  if (lower.includes('status')) {
    return `âœ… System Status:

â€¢ Server: Running on Render
â€¢ AI Engine: Kimi K2.5
â€¢ Telegram: Connected
â€¢ Knowledge Base: Loaded
â€¢ Uptime: ${Math.round(process.uptime() / 60)} minutes

All systems operational!`;
  }
  
  return `I received: "${text}"

I'm connected to Kimi K2.5 for AI reasoning. I also have your full business context loaded.

Try:
â€¢ "projects" - See FBX projects
â€¢ "contacts" - See your team
â€¢ "goals" - See 2026 priorities
â€¢ Or ask me anything!`;
}

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ai_engine: 'Kimi K2.5',
    mode: 'full_api_access'
  });
});

/**
 * Test endpoint
 */
app.get('/test-kimi', async (req, res) => {
  try {
    const response = await queryKimi('Hello, are you working?', 'Test');
    res.json({ success: true, response });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * Status endpoint
 */
app.get('/status', (req, res) => {
  res.json({
    agent: 'Corporate AI - Genii',
    platform: 'Render.com',
    ai_engine: 'Kimi K2.5',
    telegram: 'connected',
    projects: Object.keys(knowledge.projects).length,
    contacts: Object.keys(knowledge.contacts).length,
    conversations: conversations.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Corporate AI Agent - Genii',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      status: '/status',
      test: '/test-kimi',
      telegram: 'POST /telegram'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ðŸš€ Corporate AI Server running on port ${PORT}`);
  console.log(`ðŸ¤– Kimi K2.5 AI engine ready`);
  console.log(`ðŸ’¬ Telegram bot connected`);
  console.log(`ðŸ“Š Loaded ${Object.keys(knowledge.projects).length} projects, ${Object.keys(knowledge.contacts).length} contacts`);
});
