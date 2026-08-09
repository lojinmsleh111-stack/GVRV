// tickets/ticketHandler.js
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ChannelType,
  SlashCommandBuilder
} = require('discord.js');

const ADMIN_ROLE_ID = '1534937247315398797';

// 1. بناء أوامر الشلاش (Slash Command Definition)
const ticketSlashCommand = new SlashCommandBuilder()
  .setName('تكت')
  .setDescription('أوامر إدارة التذاكر والدعم الفني')
  .addSubcommand(sub =>
    sub.setName('إضافة')
       .setDescription('إضافة عضو أو رتبة إلى التكت الحالية')
       .addUserOption(opt => opt.setName('العضو').setDescription('العضو المراد إضافته').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('إزالة')
       .setDescription('إزالة عضو أو رتبة من التكت الحالية')
       .addUserOption(opt => opt.setName('العضو').setDescription('العضو المراد إزالته').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('تسمية')
       .setDescription('تغيير اسم روم التكت')
       .addStringOption(opt => opt.setName('الاسم_الجديد').setDescription('الاسم الجديد للروم').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('مطالبة')
       .setDescription('استلام التكت وتحديدك كمسؤول عنها')
  )
  .addSubcommand(sub =>
    sub.setName('قفل')
       .setDescription('قفل الكتابة في التكت على صاحب الطلب')
  )
  .addSubcommand(sub =>
    sub.setName('فتح')
       .setDescription('إعادة فتح الكتابة لصاحب التكت')
  )
  .addSubcommand(sub =>
    sub.setName('إغلاق')
       .setDescription('إغلاق التكت وحذفها')
       .addStringOption(opt => opt.setName('السبب').setDescription('سبب إغلاق التكت').setRequired(false))
  );

// أمر الشلاش المستقل للمناداة: /نادي
const callSlashCommand = new SlashCommandBuilder()
  .setName('نادي')
  .setDescription('إرسال تنبيه بالخاص للعضو لمناداته للتكت')
  .addUserOption(opt => opt.setName('العضو').setDescription('العضو المراد مناداته بالخاص').setRequired(true));

// 2. لوحة فتح التكت (Embed)
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

// 3. إنشاء روم التكت
async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

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

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        },
        {
          id: ADMIN_ROLE_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
        },
      ],
    });

    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('🙋‍♂️ استلام التكت').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 إغلاق').setStyle(ButtonStyle.Danger)
    );

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 أهلاً بك في التكت الخاص بك`)
      .setDescription(`مرحباً ${user}، يرجى كتابة تفاصيل مشكلتك هنا.\n\n💡 **ملاحظة للإدارة:** يمكنكم استخدام الأمر \`/تكت\` للأوامر أو \`/نادي\` لمناداة عضو بالخاص.`)
      .setColor('#57F287');

    await ticketChannel.send({ embeds: [welcomeEmbed], components: [controlRow] });

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

// 4. معالجة أمر المناداة (/نادي)
async function handleCallCommand(interaction) {
  if (!interaction.channel.name.startsWith('ticket-')) {
    return await interaction.reply({ content: '❌ هذا الأمر مخصص فقط لرومات التكتات!', ephemeral: true });
  }

  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    return await interaction.reply({ content: '❌ عذراً، هذا الأمر مخصص للإدارة فقط.', ephemeral: true });
  }

  const targetUser = interaction.options.getUser('العضو');

  const dmEmbed = new EmbedBuilder()
    .setTitle('🔔 لديك تنبيه جديد في التكت!')
    .setDescription(`مرحباً ${targetUser}، يتم مناداتك حالياً في التكت الخاصة بك في سيرفر **${interaction.guild.name}**.\n\n🔗 **رابط الروم المباشر:** ${interaction.channel}`)
    .setColor('#FEE75C')
    .setTimestamp();

  try {
    await targetUser.send({ embeds: [dmEmbed] });

    const successEmbed = new EmbedBuilder()
      .setTitle('📩 تم إرسال المناداة')
      .setDescription(`تم إرسال رسالة تنبيه بالخاص لـ ${targetUser} بنجاح.`)
      .setColor('#57F287');

    await interaction.reply({ embeds: [successEmbed] });
  } catch (err) {
    const failEmbed = new EmbedBuilder()
      .setTitle('❌ تعذر الإرسال')
      .setDescription(`تعذر إرسال تنبيه بالخاص لـ ${targetUser}، قد تكون خاصيته مغلقة (DM Closed).`)
      .setColor('#ED4245');

    await interaction.reply({ embeds: [failEmbed], ephemeral: true });
  }
}

// 5. معالجة أوامر الشلاش الخاصّة بالـ (/تكت)
async function handleTicketSlashCommands(interaction) {
  if (!interaction.channel.name.startsWith('ticket-')) {
    return await interaction.reply({ content: '❌ هذا الأمر مخصص فقط لرومات التكتات!', ephemeral: true });
  }

  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    return await interaction.reply({ content: '❌ عذراً، هذا الأمر مخصص للإدارة فقط.', ephemeral: true });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'إضافة') {
    const targetUser = interaction.options.getUser('العضو');
    await interaction.channel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      AttachFiles: true
    });

    const embed = new EmbedBuilder()
      .setTitle('👤 إضافة عضو')
      .setDescription(`تمت إضافة ${targetUser} إلى التكت بنجاح.`)
      .setColor('#57F287');

    await interaction.reply({ embeds: [embed] });
  }
  else if (subcommand === 'إزالة') {
    const targetUser = interaction.options.getUser('العضو');
    await interaction.channel.permissionOverwrites.delete(targetUser.id);

    const embed = new EmbedBuilder()
      .setTitle('👤 إزالة عضو')
      .setDescription(`تمت إزالة ${targetUser} من التكت بنجاح.`)
      .setColor('#ED4245');

    await interaction.reply({ embeds: [embed] });
  }
  else if (subcommand === 'تسمية') {
    const newName = interaction.options.getString('الاسم_الجديد');
    await interaction.channel.setName(`ticket-${newName}`);

    const embed = new EmbedBuilder()
      .setTitle('✏️ تغيير اسم التكت')
      .setDescription(`تم تغيير اسم التكت إلى: \`ticket-${newName}\``)
      .setColor('#57F287');

    await interaction.reply({ embeds: [embed] });
  }
  else if (subcommand === 'مطالبة') {
    const embed = new EmbedBuilder()
      .setTitle('🙋‍♂️ تم استلام التكت')
      .setDescription(`تم استلام هذه التذكرة بواسطة الإداري: ${interaction.user}`)
      .setColor('#FEE75C');

    await interaction.reply({ embeds: [embed] });
  }
  else if (subcommand === 'قفل') {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
    
    const embed = new EmbedBuilder()
      .setTitle('🔒 تم قفل التكت')
      .setDescription('تم إيقاف إمكانية الكتابة في التكت مؤقتاً.')
      .setColor('#ED4245');

    await interaction.reply({ embeds: [embed] });
  }
  else if (subcommand === 'فتح') {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
    
    const embed = new EmbedBuilder()
      .setTitle('🔓 تم فتح التكت')
      .setDescription('تمت إعادة فتح إمكانية الكتابة في التكت.')
      .setColor('#57F287');

    await interaction.reply({ embeds: [embed] });
  }
  else if (subcommand === 'إغلاق') {
    const reason = interaction.options.getString('السبب') || 'لا يوجد سبب محدد';

    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 إغلاق التكت')
      .setDescription(`السبب: **${reason}**\nسيتم حذف الروم خلال 5 ثوانٍ...`)
      .setColor('#ED4245');

    await interaction.reply({ embeds: [closeEmbed] });

    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 5000);
  }
}

// 6. معالجة الأزرار
async function handleTicketButtonActions(interaction) {
  if (interaction.customId === 'close_ticket') {
    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 إغلاق التكت')
      .setDescription('سيتم حذف التكت خلال 5 ثوانٍ...')
      .setColor('#ED4245');

    await interaction.reply({ embeds: [closeEmbed] });

    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 5000);
  } 
  else if (interaction.customId === 'claim_ticket') {
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return await interaction.reply({ content: '❌ هذا الزر مخصص للإدارة فقط.', ephemeral: true });
    }

    const claimEmbed = new EmbedBuilder()
      .setTitle('🙋‍♂️ استلام التكت')
      .setDescription(`تم استلام التكت بواسطة الإداري: ${interaction.user}`)
      .setColor('#FEE75C');

    await interaction.reply({ embeds: [claimEmbed] });
  }
}

module.exports = {
  ticketSlashCommand,
  callSlashCommand,
  getTicketPanel,
  handleTicketCreate,
  handleCallCommand,
  handleTicketSlashCommands,
  handleTicketButtonActions
};
                
