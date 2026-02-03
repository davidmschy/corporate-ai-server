const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8527939205:AAFWI1EtRA2IAyYnsCnvnFeln0-G4xSvBxY';
const PORT = process.env.PORT || 3000;

// Simple Corporate AI with knowledge
const knowledge = {
  projects: {
    selma: { name: 'Selma LOI', status: 'in_progress', priority: 1 },
    kerman: { name: 'Kerman Walk', status: 'scheduled', priority: 2 },
    parkview: { name: 'Parkview Appraisal', status: 'pending', priority: 2 },
    mikeGolf: { name: 'Mike Golf Studio LOI', status: 'in_progress', priority: 1 }
  },
  contacts: {
    amber: { name: 'Amber Schy', role: 'COO', email: 'amber@geniinow.com' },
    tony: { name: 'Tony Hunt', role: 'Real Estate', email: 'tony@fbx.homes' }
  },
  goals: [
    'Corporate AI launch and sales',
    'FBX 3 projects to completion', 
    'Mike Schy ebook 10K sales',
    'Investment portfolio growth'
  ]
};

async function processMessage(text, userName) {
  const lower = text.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi')) {
    return `Hello ${userName}! ðŸ‘‹\n\nI'm your Corporate AI Executive Assistant with full server capabilities.\n\nI know about:\nâ€¢ Your FBX projects\nâ€¢ Your team\nâ€¢ Your 2026 goals\n\nWhat would you like to work on?`;
  }
  
  if (lower.includes('project')) {
    let res = 'ðŸ“Š Projects:\n\n';
    for (const [k, p] of Object.entries(knowledge.projects)) {
      res += `â€¢ ${p.name}\n  Status: ${p.status}\n\n`;
    }
    return res;
  }
  
  if (lower.includes('contact') || lower.includes('team')) {
    let res = 'ðŸ‘¥ Team:\n\n';
    for (const [k, c] of Object.entries(knowledge.contacts)) {
      res += `â€¢ ${c.name}\n  ${c.role}\n  ${c.email}\n\n`;
    }
    return res;
  }
  
  if (lower.includes('goal')) {
    let res = 'ðŸŽ¯ Goals:\n\n';
    knowledge.goals.forEach((g, i) => res += `${i+1}. ${g}\n`);
    return res;
  }
  
  return `I received: "${text}"\n\nI can help with:\nâ€¢ Projects\nâ€¢ Contacts\nâ€¢ Goals\n\nWhat do you need?`;
}

// Telegram webhook
app.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    if (!update.message) return res.send('OK');
    
    const msg = update.message;
    const response = await processMessage(msg.text || '', msg.from.first_name);
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: msg.chat.id,
      text: response
    });
    
    res.send('OK');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error');
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.listen(PORT, () => {
  console.log(`ðŸš€ Corporate AI Server on port ${PORT}`);
});
