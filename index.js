// index.js
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const express = require('express');
require('dotenv').config();

// استدعاء موديولات التقديمات والتكتات
const { 
  getStaffAppPanel, 
  getSellerAppPanel, 
  getMiddlemanAppPanel, 
  handleButton: handleAppButton, 
  handleModalSubmit, 
  handleAdminAction 
} = require('./applications/appHandler');

const { 
  getTicketPanel, 
  handleTicketCreate, 
  handleTicketClose 
} = require('./tickets/ticketHandler');

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

// إنشاء الكلاينت مع الصلاحيات المطلوبة
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

// عند تشغيل البوت بنجاح
client.once('ready', () => {
  console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
  console.log('🤖 جاهز لاستقبال التقديمات والتكتات...');
});

// --- أوامر تسطيب اللوحات في الرومات (للإدارة فقط) ---
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.member.permissions.has('Administrator')) return;

  // 1. تسطيب تقديم الإدارة في روم #تقديم-الإدارة
  if (message.content === '!setup-staff') {
    await message.delete().catch(() => {});
    await message.channel.send(getStaffAppPanel());
  }

  // 2. تسطيب تقديم البائع في روم #تقديم-بائع
  if (message.content === '!setup-seller') {
    await message.delete().catch(() => {});
    await message.channel.send(getSellerAppPanel());
  }

  // 3. تسطيب تقديم الوسيط في روم #تقديم-وسيط
  if (message.content === '!setup-mm') {
    await message.delete().catch(() => {});
    await message.channel.send(getMiddlemanAppPanel());
  }

  // 4. تسطيب نظام التكتات في روم #الدعم-الفني
  if (message.content === '!setup-tickets') {
    await message.delete().catch(() => {});
    await message.channel.send(getTicketPanel());
  }
});

// --- معالج التفاعلات (Interactions Handler) ---
client.on('interactionCreate', async (interaction) => {
  try {
    // 1. معالجة الأزرار (Buttons)
    if (interaction.isButton()) {
      // أزرار فتح استمارات التقديم الثلاثة
      if (interaction.customId.startsWith('app_')) {
        await handleAppButton(interaction);
      } 
      // أزرار قبول / رفض التقديم الخاصة بالإدارة في روم اللوق
      else if (interaction.customId.startsWith('admin_')) {
        await handleAdminAction(interaction);
      } 
      // زر فتح تكت جديد
      else if (interaction.customId === 'create_ticket') {
        await handleTicketCreate(interaction);
      } 
      // زر إغلاق التكت
      else if (interaction.customId === 'close_ticket') {
        await handleTicketClose(interaction);
      }
    }

    // 2. معالجة الاستمارات (Modals) عند إرسال الإجابات
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_')) {
        await handleModalSubmit(interaction);
      }
    }

  } catch (error) {
    console.error('❌ حدث خطأ أثناء معالجة التفاعل:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: 'حدث خطأ غير متوقع أثناء تنفيذ الطلب.', 
        ephemeral: true 
      });
    }
  }
});

// تسجيل الدخول للبوت
client.login(process.env.DISCORD_TOKEN);

