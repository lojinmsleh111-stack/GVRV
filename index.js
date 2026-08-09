// index.js
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const express = require('express');
require('dotenv').config();

// --- إعداد خادم Express لبقاء البوت يعمل على Render ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 البوت يعمل بنجاح ومربوط بـ Render!');
});

app.listen(PORT, () => {
  console.log(`🌐 خادم Express يعمل على المنفذ: ${PORT}`);
});
// --------------------------------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();

client.once('ready', () => {
  console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
  console.log('🤖 جاهز لاستقبال التقديمات والتكتات...');
});

client.login(process.env.DISCORD_TOKEN);
