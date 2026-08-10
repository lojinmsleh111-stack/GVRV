// applications/appHandler.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');

// رابط الصورة الموحد
const PANEL_IMAGE = 'https://cdn.discordapp.com/attachments/1423345110732640316/1536494515878240426/af8d2477ec06380f4fa6c48e188384ec-1-ezgif.com-webp-to-png-converter_1.webp?ex=6a7b9b87&is=6a7a4a07&hm=641cb345c5dd4e9a961781a446d677bcb7f8e0d7fd46c32d3eed4cb464030998&';

const activeUsers = new Set();

// 1. لوحات التقديم
function getSellerAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('app_seller').setLabel('تقديم على بائع / تاجر').setStyle(ButtonStyle.Success)
  );

  const embed = new EmbedBuilder()
    .setTitle('🛒 تقديم بائع في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#57F287')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

function getMiddlemanAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('app_middleman').setLabel('تقديم على وسيط (MM)').setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setTitle('🤝 تقديم وسيط في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#FEE75C')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

function getAdminAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('app_admin').setLabel('تقديم على طاقم الإدارة').setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle('🛡️ تقديم إدارة في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم للإدارة. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#ED4245')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

// 2. معالجة الضغط على أزرار التقديم
async function handleButton(interaction) {
  const userId = interaction.user.id;

  if (activeUsers.has(userId)) {
    return await interaction.reply({
      content: '⚠️ لديك تقديم قائم بالفعل بالخاص! يرجى إكماله أو انتظاره حتى ينتهي الوقت.',
      ephemeral: true
    });
  }

  const appType = interaction.customId.replace('app_', '');
  
  try {
    const dmChannel = await interaction.user.createDM();

    // رسالة الترحيب الأولى في الخاص مع الصورة
    const startEmbed = new EmbedBuilder()
      .setTitle('📝 بدء عملية التقديم')
      .setDescription(`مرحباً بك! تم بدء تقديمك على **${appType.toUpperCase()}**. الرجاء الإجابة على الأسئلة القادمة بعناية.\n\n⏱️ لديك 10 دقائق لكل سؤال.`)
      .setColor('#2B2D31')
      .setImage(PANEL_IMAGE);

    await dmChannel.send({ embeds: [startEmbed] });
    
    // إشعار بالروم العام أن التقديم فتح بالخاص
    await interaction.reply({
      content: '📩 تم إرسال معلومات التقديم لك في الرسائل الخاصة!',
      ephemeral: true
    });

    activeUsers.add(userId);
    await startApplicationProcess(interaction.member, dmChannel, appType);

  } catch (error) {
    console.error('❌ خطأ في فتح الخاصة:', error);
    await interaction.reply({
      content: '❌ لم أستطع إرسال رسالة في الخاص. تأكد من إمكانية استقبال رسائل خاصة من أعضاء السيرفر.',
      ephemeral: true
    });
  }
}

// 3. إدارة أسئلة التقديم بالخاص
async function startApplicationProcess(member, dmChannel, appType) {
  let questions = [];

  if (appType === 'seller') {
    questions = [
      { id: 'q1', text: 'ما هو اسمك أو لقبت في السيرفر؟', type: 'text' },
      { id: 'q2', text: 'ما هي المنتجات التي تخطط لبيعها؟', type: 'text' },
      { id: 'q3', text: 'هل تلتزم بقوانين البيع والتجارة في حراج جرينفيل؟', type: 'text' }
    ];
  } else if (appType === 'middleman') {
    questions = [
      { id: 'q1', text: 'ما هو اسمك وعمرك؟', type: 'text' },
      { id: 'q2', text: 'كم ساعة تتواجد في ديسكورد يومياً؟', type: 'text' },
      { id: 'q3', text: 'هل سبق لك العمل كـ وسيط (Middleman) في سيرفرات أخرى؟', type: 'text' }
    ];
  } else if (appType === 'admin') {
    questions = [
      { id: 'q1', text: 'ما هو اسمك وعمرك؟', type: 'text' },
      { 
        id: 'q2', 
        text: 'هل تقسم بالله أن تعمل بأمانة وعدل دون تحيز؟', 
        type: 'select', 
        options: [{ label: 'نعم', value: 'نعم' }, { label: 'لا', value: 'لا' }] 
      },
      { 
        id: 'q3', 
        text: 'هل متوفر لديك مايكروفون واضح للتواصل مع الإدارة؟', 
        type: 'select', 
        options: [{ label: 'نعم', value: 'نعم' }, { label: 'لا', value: 'لا' }] 
      }
    ];
  }

  const answers = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const embed = new EmbedBuilder()
      .setTitle(`📋 تقديم (${appType.toUpperCase()}) - السؤال [${i + 1}/${questions.length}]`)
      .setDescription(q.text)
      .setColor('#2B2D31');

    let msgData = { embeds: [embed] };

    if (q.type === 'select') {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_${q.id}`)
        .setPlaceholder('اختر إجابتك من هنا...')
        .addOptions(q.options);

      msgData.components = [new ActionRowBuilder().addComponents(selectMenu)];
    }

    await dmChannel.send(msgData);

    try {
      if (q.type === 'select') {
        const collected = await dmChannel.awaitMessageComponent({
          filter: (i) => i.user.id === member.id,
          time: 600000
        });
        answers[q.id] = collected.values[0];
        await collected.reply({ content: `✅ تم تسجيل إجابتك: **${collected.values[0]}**`, ephemeral: false });
      } else {
        const collected = await dmChannel.awaitMessages({
          filter: (m) => m.author.id === member.id,
          max: 1,
          time: 600000,
          errors: ['time']
        });
        answers[q.id] = collected.first().content;
      }
    } catch (err) {
      activeUsers.delete(member.id);
      return await dmChannel.send('⏱️ انتهت المهلة المحددة للإجابة (10 دقائق). تم إلغاء الطلب.');
    }
  }

  activeUsers.delete(member.id);

  // إرسال النتيجة واللوق
  await processFinalDecision(member, appType, answers, dmChannel);
}

async function processFinalDecision(member, appType, answers, dmChannel) {
  const logChannelId = process.env.APP_LOG_CHANNEL_ID;
  const logChannel = member.guild.channels.cache.get(logChannelId);

  let isAccepted = true;
  let roleToAdd = null;

  if (appType === 'seller') roleToAdd = process.env.SELLER_ROLE_ID;
  if (appType === 'middleman') roleToAdd = process.env.MIDDLEMAN_ROLE_ID;
  if (appType === 'admin') {
    if (answers['q2'] === 'لا' || answers['q3'] === 'لا') {
      isAccepted = false;
    } else {
      roleToAdd = process.env.PRE_ADMIN_ROLE_ID;
    }
  }

  if (isAccepted) {
    if (roleToAdd) await member.roles.add(roleToAdd).catch(() => {});
    await dmChannel.send('🎉 **تهانينا!** تم قبول تقديمك بنجاح وإعطاؤك الرتبة المناسبة.');
  } else {
    await dmChannel.send('❌ **للأسف!** تم رفض تقديمك لعدم استيفاء الشروط الأساسية.');
  }

  // إرسال اللوق
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setTitle(`📥 سجل تقديم جديد - ${appType.toUpperCase()}`)
      .setColor(isAccepted ? '#57F287' : '#ED4245')
      .addFields(
        { name: 'المتقدم', value: `<@${member.id}> (${member.user.tag})`, inline: true },
        { name: 'النتيجة الآلية', value: isAccepted ? '✅ مقبول' : '❌ مقتطع/مرفوض', inline: true }
      )
      .setTimestamp();

    Object.keys(answers).forEach((key, index) => {
      logEmbed.addFields({ name: `سؤال ${index + 1}`, value: answers[key] || 'لا يوجد' });
    });

    await logChannel.send({ embeds: [logEmbed] });
  }
}

module.exports = {
  getSellerAppPanel,
  getMiddlemanAppPanel,
  getAdminAppPanel,
  handleButton
};
