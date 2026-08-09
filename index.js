// index.js
const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const express = require('express');
require('dotenv').config();

const { 
  getSellerAppPanel, 
  getMiddlemanAppPanel, 
  getAdminAppPanel,
  handleButton: handleAppButton, 
  handleAdminAction 
} = require('./applications/appHandler');

const { 
  ticketSlashCommand,
  callSlashCommand,
  getTicketPanel, 
  handleTicketCreate, 
  handleCallCommand,
  handleTicketSlashCommands,
  handleTicketButtonActions
} = require('./tickets/ticketHandler');

const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || '1534937247315398797';

// 1. Express Server لإبقاء البوت حياً على Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🤖 البوت يعمل بنجاح ومربوط بـ Render!'));
app.listen(PORT, () => console.log(`🌐 Express running on port: ${PORT}`));

// 2. إعداد كائن البوت مع الصلاحيات والـ Partials اللازمة للـ DM
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

// 3. تسجيل أوامر الشلاش
client.once('ready', async () => {
  console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('⏳ جاري تسجيل أوامر الشلاش (Slash Commands)...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [ticketSlashCommand.toJSON(), callSlashCommand.toJSON()] }
    );
    console.log('✅ تم تسجيل جميع أوامر الشلاش بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في تسجيل أوامر الشلاش:', error);
  }
});

// 4. أوامر التسطيب (محصورة بالإدارة)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.member || !message.member.roles.cache.has(ADMIN_ROLE_ID)) return;

  if (message.content === '!setup-seller') {
    await message.delete().catch(() => {});
    await message.channel.send(getSellerAppPanel());
  }

  if (message.content === '!setup-mm') {
    await message.delete().catch(() => {});
    await message.channel.send(getMiddlemanAppPanel());
  }

  if (message.content === '!setup-admin') {
    await message.delete().catch(() => {});
    await message.channel.send(getAdminAppPanel());
  }

  if (message.content === '!setup-tickets') {
    await message.delete().catch(() => {});
    await message.channel.send(getTicketPanel());
  }
});

// 5. معالجة التفاعلات (أزرار + شلاش + قوائم منسدلة)
client.on('interactionCreate', async (interaction) => {
  try {
    // أوامر الشلاش
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'تكت') {
        await handleTicketSlashCommands(interaction);
      } else if (interaction.commandName === 'نادي') {
        await handleCallCommand(interaction);
      }
    }

    // التفاعل مع الأزرار
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('app_')) {
        await handleAppButton(interaction);
      } else if (interaction.customId.startsWith('admin_')) {
        await handleAdminAction(interaction);
      } else if (interaction.customId === 'create_ticket') {
        await handleTicketCreate(interaction);
      } else if (interaction.customId === 'close_ticket' || interaction.customId === 'claim_ticket') {
        await handleTicketButtonActions(interaction);
      }
    }

    // التفاعل مع القوائم المنسدلة (الخاصة بالأسئلة)
    if (interaction.isStringSelectMenu()) {
      // تتم معالجة القوائم المنسدلة داخل awaitMessageComponent في appHandler.js
      return;
    }

  } catch (error) {
    console.error('❌ حدث خطأ أثناء التفاعل:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);
