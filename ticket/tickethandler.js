// tickets/ticketHandler.js
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ChannelType 
} = require('discord.js');

const ADMIN_ROLE_ID = '1534937247315398797';

// 1. لوحة فتح التكت (Embed)
function getTicketPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('📩 فتح تكت')
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setTitle('🎫 نظام الدعم الفني والتذاكر')
    .setDescription('إذا كان لديك استفسار أو مشكلة، اضغط على الزر أدناه لفتح تذكرة وسيتم التواصل معك من قبل الإدارة.')
    .setColor('#5865F2');

  return { embeds: [embed], components: [row] };
}

// 2. انشاء روم التكت
async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  // التحقق مما إذا كان العضو يملك تكت مفتوح حالياً
  const existingChannel = guild.channels.cache.find(
    c => c.name === `ticket-${user.username.toLowerCase()}`
  );

  if (existingChannel) {
    const existEmbed = new EmbedBuilder()
      .setTitle('⚠️ لديك تكت مفتوح بالفعل')
      .setDescription(`لديك تكت مفتوح حالياً في الروم: ${existingChannel}`)
      .setColor('#ED4245');

    return await interaction.reply({ embeds: [existEmbed], ephemeral: true });
  }

  // إنشاء روم نصي خاص للتكت
  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id, // منع الجميع من رؤية الروم
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id, // السماح لصاحب التكت فقط
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        },
        {
          id: ADMIN_ROLE_ID, // السماح للإدارة
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        },
      ],
    });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 إغلاق التكت')
        .setStyle(ButtonStyle.Danger)
    );

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 أهلاً بك في التكت الخاص بك`)
      .setDescription(`مرحباً ${user}، يرجى كتابة تفاصيل مشكلتك أو استفسارك هنا وسيقوم طاقم الإدارة بالرد عليك في أقرب وقت.`)
      .setColor('#57F287');

    await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeRow] });

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ تم إنشاء التكت')
      .setDescription(`تم فتح تكت جديد بنجاح: ${ticketChannel}`)
      .setColor('#57F287');

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });

  } catch (error) {
    console.error('خطأ أثناء إنشاء التكت:', error);
    await interaction.reply({ content: '❌ تعذر إنشاء التكت، يرجى التأكد من صلاحيات البوت.', ephemeral: true });
  }
}

// 3. إغلاق وحذف التكت
async function handleTicketClose(interaction) {
  const closeEmbed = new EmbedBuilder()
    .setTitle('🔒 إغلاق التكت')
    .setDescription('سيتم حذف هذا التكت تلقائياً خلال 5 ثوانٍ...')
    .setColor('#ED4245');

  await interaction.reply({ embeds: [closeEmbed] });

  setTimeout(async () => {
    await interaction.channel.delete().catch(() => {});
  }, 5000);
}

module.exports = {
  getTicketPanel,
  handleTicketCreate,
  handleTicketClose
};

