// index.js
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  REST, 
  Routes, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');
const { evaluateApplication } = require('../services/groqService');
const express = require('express');
require('dotenv').config();

const { 
  getSellerAppPanel, 
  getMiddlemanAppPanel, 
  getAdminAppPanel,
  handleButton: handleAppButton
} = require('./applications/appHandler');

const { 
  ticketSlashCommand,
  callSlashCommand,
  getTicketPanel, 
  handleTicketCreate, 
  handleCallCommand,
  handleTicketSlashCommands,
  handleTicketButtonActions
} = require('./tickets/tickethandler');

// الآيديات الأساسية ورابط الصورة
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || '1534937247315398797';
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID || '1534960086022226020';
const PANEL_IMAGE = 'https://cdn.discordapp.com/attachments/1423345110732640316/1536494515878240426/af8d2477ec06380f4fa6c48e188384ec-1-ezgif.com-webp-to-png-converter_1.webp?ex=6a7b9b87&is=6a7a4a07&hm=641cb345c5dd4e9a961781a446d677bcb7f8e0d7fd46c32d3eed4cb464030998&';

// 1. Express Server لإبقاء البوت حياً على Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🤖 البوت يعمل بنجاح ومربوط بـ Render!'));
app.listen(PORT, () => console.log(`🌐 Express running on port: ${PORT}`));

// 2. إعداد كائن البوت
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

// 4. دالة لوحة التفعيل بالصورة العريضة
function getVerifyPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_user')
      .setLabel('فعل نفسك')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );

  const embed = new EmbedBuilder()
    .setTitle('👾 التفعيل - حراج جرينفيل')
    .setDescription('مرحبا اضغط على الزر أدناه للحصول على رتبة عضو مفعل و رؤية باقي رومات السيرفر')
    .setColor('#2F3136')
    .setImage(PANEL_IMAGE)
    .setFooter({ text: 'حراج جرينفيل • نظام التفعيل التلقائي' });

  return { embeds: [embed], components: [row] };
}

// 5. أوامر التسطيب (محصورة بالإدارة)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.member || !message.member.roles.cache.has(ADMIN_ROLE_ID)) return;

  if (message.content === '!setup-verify') {
    await message.delete().catch(() => {});
    await message.channel.send(getVerifyPanel());
  }

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

// 6. معالجة التفاعلات
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'تكت') {
        await handleTicketSlashCommands(interaction);
      } else if (interaction.commandName === 'نادي') {
        await handleCallCommand(interaction);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'verify_user') {
        const member = interaction.member;

        if (member.roles.cache.has(VERIFIED_ROLE_ID)) {
          const alreadyVerifiedEmbed = new EmbedBuilder()
            .setTitle('⚠️ أنت مفعل بالفعل!')
            .setDescription('تم تفعيل حسابك سابقاً، يمكنك تصفح باقي الرومات مباشرة.')
            .setColor('#FEE75C');

          return await interaction.reply({ embeds: [alreadyVerifiedEmbed], ephemeral: true });
        }

        try {
          await member.roles.add(VERIFIED_ROLE_ID);

          const successEmbed = new EmbedBuilder()
            .setTitle('👾 تم التفعيل بنجاح!')
            .setDescription('تم إعطاؤك رتبة عضو مفعل بنجاح، يمكنك الان رؤية باقي رومات السيرفر.')
            .setColor('#57F287');

          return await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (roleError) {
          console.error('❌ خطأ في إسناد رتبة المفعل:', roleError);
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ حدث خطأ أثناء التفعيل')
            .setDescription('تأكد أن رتبة البوت أعلى من رتبة المفعل في إعدادات السيرفر.')
            .setColor('#ED4245');

          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }

      if (interaction.customId.startsWith('app_')) {
        await handleAppButton(interaction);
      } else if (interaction.customId === 'create_ticket') {
        await handleTicketCreate(interaction);
      } else if (interaction.customId === 'close_ticket' || interaction.customId === 'claim_ticket') {
        await handleTicketButtonActions(interaction);
      }
    }

    if (interaction.isStringSelectMenu()) {
      return;
    }

  } catch (error) {
    console.error('❌ حدث خطأ أثناء التفاعل:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);
                                          
