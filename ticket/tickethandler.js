// tickets/ticketHandler.js
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ChannelType 
} = require('discord.js');

// رابط الصورة الموحد
const PANEL_IMAGE = 'https://cdn.discordapp.com/attachments/1423345110732640316/1536494515878240426/af8d2477ec06380f4fa6c48e188384ec-1-ezgif.com-webp-to-png-converter_1.webp?ex=6a7b9b87&is=6a7a4a07&hm=641cb345c5dd4e9a961781a446d677bcb7f8e0d7fd46c32d3eed4cb464030998&';

// الآيديات من البيئة أو القيم الافتراضية
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;
const TICKET_LOG_CHANNEL_ID = process.env.TICKET_LOG_CHANNEL_ID || process.env.APP_LOG_CHANNEL_ID;
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || '1534937247315398797';

/**
 * إنشاء لوحة فتح التذاكر (Panel)
 */
function getTicketPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('فتح تكت الدعم الفني')
      .setEmoji('📩')
      .setStyle(ButtonStyle.Primary) // زر أزرق
  );

  const embed = new EmbedBuilder()
    .setTitle('📩 مركز الدعم الفني والمساعدة - حراج جرينفيل')
    .setDescription('**__ من هنا ترفع تكت 

• شكوى على سراق 

• الدعم الفني 

• شراكه او اعلان
-
في حال رفعت تذكره ومافيه احد رد عليك انتظر يبعدي واستغفر الله 
ان الطاقم الاداري مشغول .
<@&1534960086022226020> ..
__**')
    .setColor('#5865F2')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

/**
 * التعامل مع الأزرار الخاصة بنظام التذاكر (فتح / إغلاق)
 */
async function handleTicketButton(interaction) {
  const { guild, user, customId, channel } = interaction;

  // 1. زر إنشاء تكت جديد
  if (customId === 'create_ticket') {
    // التحقق مما إذا كان العضو يملك تكت مفتوحة بالفعل
    const existingTicket = guild.channels.cache.find(
      c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` ||
           c.topic === user.id
    );

    if (existingTicket) {
      return await interaction.reply({
        content: `⚠️ لديك تكت مفتوحة بالفعل في الروم: ${existingTicket}`,
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // صلاحيات روم التكت
      const permissionOverwrites = [
        {
          id: guild.id, // منع الجميع من رؤية الروم
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id, // إعطاء المتقدم صلاحية القراءة وإرسال الرسائل
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ];

      // إعطاء الإدارة صلاحية إذا كانت الرتبة موجودة
      if (ADMIN_ROLE_ID) {
        permissionOverwrites.push({
          id: ADMIN_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
          ]
        });
      }

      // إنشاء الكاتيجوري أو الروم مباشرة
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID || undefined,
        topic: user.id,
        permissionOverwrites
      });

      // زر إغلاق التكت
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('إغلاق التكت')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`📩 تكت دعم فني جديدة`)
        .setDescription(`مرحباً بك ${user}! 👋\n\nيرجى كتابة تفاصيل استفسارك أو مشكلتك هنا وسيقوم فريق الدعم الفني بالرد عليك في أقرب وقت ممكن.\n\n🔒 **لإغلاق التكت، إضغط على الزر أدناه.**`)
        .setColor('#5865F2')
        .setImage(PANEL_IMAGE)
        .setTimestamp();

      await ticketChannel.send({
        content: `${user} | <@&${ADMIN_ROLE_ID}>`,
        embeds: [welcomeEmbed],
        components: [closeRow]
      });

      await interaction.editReply({
        content: `✅ تم إنشاء التكت بنجاح: ${ticketChannel}`
      });

    } catch (error) {
      console.error('❌ خطأ أثناء إنشاء التكت:', error);
      await interaction.editReply({
        content: '❌ حدث خطأ أثناء إنشاء التكت، يرجى التأكد من صلاحيات البوت.'
      });
    }
  }

  // 2. زر إغلاق التكت
  else if (customId === 'close_ticket') {
    await interaction.reply({
      content: '🔒 جاري إغلاق التكت وأرشفة المحادثة خلال 5 ثوانٍ...'
    });

    setTimeout(async () => {
      try {
        const ticketOwnerId = channel.topic;
        const ticketOwner = ticketOwnerId ? await guild.members.fetch(ticketOwnerId).catch(() => null) : null;

        // إرسال اللوق لروم اللوقات
        if (TICKET_LOG_CHANNEL_ID) {
          const logChannel = guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('🔒 تم إغلاق تكت')
              .addFields(
                { name: 'اسم الروم:', value: `\`${channel.name}\``, inline: true },
                { name: 'صاحب التكت:', value: ticketOwner ? `${ticketOwner} (\`${ticketOwner.id}\`)` : 'غير معروف', inline: true },
                { name: 'تم الإغلاق بواسطة:', value: `${user} (\`${user.id}\`)`, inline: true }
              )
              .setColor('#ED4245')
              .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
          }
        }

        // حذف روم التكت
        await channel.delete();
      } catch (err) {
        console.error('❌ خطأ أثناء إغلاق التكت:', err);
      }
    }, 5000);
  }
}

module.exports = {
  getTicketPanel,
  handleTicketButton
};
