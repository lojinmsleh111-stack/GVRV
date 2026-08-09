// index.js
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
require('dotenv').config();

const { 
  getSellerAppPanel, 
  getMiddlemanAppPanel, 
  handleButton: handleAppButton, 
  handleAdminAction 
} = require('./applications/appHandler');

const { 
  getTicketPanel, 
  handleTicketCreate, 
  handleTicketClose 
} = require('./tickets/ticketHandler');

// آيدي رتبة الإدارة المصرح لها بإدارة التقديمات واللوحات
const ADMIN_ROLE_ID = '1534937247315398797';

// --- 1. إعداد خادم Express للحفاظ على عمل البوت على Render ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 البوت يعمل بنجاح ومربوط بـ Render!');
});

app.listen(PORT, () => {
  console.log(`🌐 خادم Express يعمل على المنفذ: ${PORT}`);
});
// -------------------------------------------------------------

// --- 2. إعداد وتشكيل عميل Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.once('ready', () => {
  console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

// --- 3. أوامر التسطيب (محصورة لرتبة الإدارة فقط) ---
client.on('messageCreate', async (message) => {
  // تجاهل البوتات وإصدار الأوامر خارج السيرفرات أو بدون رتبة الإدارة
  if (message.author.bot || !message.member || !message.member.roles.cache.has(ADMIN_ROLE_ID)) return;

  if (message.content === '!setup-seller') {
    await message.delete().catch(() => {});
    await message.channel.send(getSellerAppPanel());
  }

  if (message.content === '!setup-mm') {
    await message.delete().catch(() => {});
    await message.channel.send(getMiddlemanAppPanel());
  }

  if (message.content === '!setup-tickets') {
    await message.delete().catch(() => {});
    await message.channel.send(getTicketPanel());
  }
});

// --- 4. معالجة التفاعلات والأزرار ---
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      // تفاعلات أزرار التقديمات
      if (interaction.customId.startsWith('app_')) {
        await handleAppButton(interaction);
      } 
      // تفاعلات أزرار قبول ورفض الإدارة
      else if (interaction.customId.startsWith('admin_')) {
        await handleAdminAction(interaction);
      } 
      // تفاعلات التكتات
      else if (interaction.customId === 'create_ticket') {
        await handleTicketCreate(interaction);
      } else if (interaction.customId === 'close_ticket') {
        await handleTicketClose(interaction);
      }
    }
  } catch (error) {
    console.error('❌ حدث خطأ أثناء التفاعل:', error);
  }
});

// --- 5. تسجيل الدخول بالتوكين ---
client.login(process.env.DISCORD_TOKEN);
