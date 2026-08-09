// applications/appHandler.js
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');
const { evaluateApplication } = require('../services/groqService');

// الآيديات الخاصة بالرتب
const ADMIN_ROLE_ID = '1534937247315398797';
const SELLER_ROLE_ID = '1534952025953931418';

// قائمة لتتبع المستخدمين الذين يملكون تقديم شغال حالياً
const activeUsers = new Set();

// 1. لوحة تقديم البائع (Embed)
function getSellerAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('app_seller').setLabel('تقديم على بائع / تاجر').setStyle(ButtonStyle.Success)
  );

  const embed = new EmbedBuilder()
    .setTitle('🛒 تقديم بائع في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#57F287');

  return { embeds: [embed], components: [row] };
}

// 2. لوحة تقديم الوسيط (Embed)
function getMiddlemanAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('app_middleman').setLabel('تقديم على وسيط (MM)').setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setTitle('🤝 تقديم وسيط في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#FEE75C');

  return { embeds: [embed], components: [row] };
}

// معالجة الضغط على أزرار التقديم وبدء الأسئلة بالخاص
async function handleButton(interaction) {
  const userId = interaction.user.id;

  // 1. الحماية: التأكد من أن الشخص لا يملك تقديم شغال حالياً
  if (activeUsers.has(userId)) {
    const alreadyActiveEmbed = new EmbedBuilder()
      .setTitle('⚠️ لديك تقديم نشط بالفعل')
      .setDescription('لديك تقديم قيد الإجراء حالياً في الرسائل الخاصة! يرجى إكماله أو انتظاره حتى يلغى تلقائياً لتتمكن من تقديم طلب جديد.')
      .setColor('#ED4245');

    return await interaction.reply({ embeds: [alreadyActiveEmbed], ephemeral: true });
  }

  let appType = '';
  let questions = [];

  if (interaction.customId === 'app_seller') {
    appType = 'بائع';
    questions = [
      'اسمك الثلاثي (شرط أساسي):',
      'هل قريت قوانين السيرفر والبيع؟',
      'اكتب هذا الحلف (بدون نسخ):\n"اقسم بالله العظيم انا (اسمك) ما راح اسرق حسابات او انصب او اتستر عن نصاب ، وراح التزم بقوانين البيع والسيرفر والله على ما اقوله شهيد"',
      'في حال مخالفتك للقوانين وسرقة أحد الأعضاء، سيتم التشهير بك واتخاذ الإجراءات القانونية بحقك. هل أنت موافق؟ (نعم موافق / لا أرفض)'
    ];
  } else if (interaction.customId === 'app_middleman') {
    appType = 'وسيط';
    questions = [
      'الأسم الثلاثي الحقيقي:',
      'العمر الحقيقي:',
      'خبراتك في الوساطة:',
      'إذا جيت بتبدل بين اثنين ولقيت حساب مسروق وش تسوي؟ يرجى الشرح بالتفصيل:',
      'يوزرك على منصة التيك توك:',
      'يوزرك على منصة السناب شات:',
      'يوزرك على الانستقرام:',
      'رقم هاتفك:',
      'هل أنت موافق إذا سرقت أحد سوف يتم التشهير بك مع معلوماتك وسوف يتم حلفك على المصحف؟ (موافق جزاك الله خير / لا مرفوض)'
    ];
  }

  try {
    const dmChannel = await interaction.user.createDM();
    
    // إضافة المستخدم لقائمة التقديم النشط
    activeUsers.add(userId);

    const startEmbed = new EmbedBuilder()
      .setTitle(`📝 بدء تقديم: [ ${appType} ]`)
      .setDescription('سأقوم الآن بطرح الأسئلة عليك هنا بالخاص واحدة تلو الأخرى. يرجى الرد بالإجابة مباشرة.\n\n⏳ **لديك 10 دقائق (AFK) للإجابة على كل سؤال قبل أن يتم إلغاء التقديم تلقائياً.**')
      .setColor('#5865F2');

    await dmChannel.send({ embeds: [startEmbed] });

    const startSuccessEmbed = new EmbedBuilder()
      .setTitle('📩 تم إرسال الأسئلة بالخاص')
      .setDescription('يرجى التحقق من الرسائل الخاصة بك مع البوت لإكمال التقديم.')
      .setColor('#57F287');

    await interaction.reply({ embeds: [startSuccessEmbed], ephemeral: true });

    const qaPairs = [];

    for (let i = 0; i < questions.length; i++) {
      const qEmbed = new EmbedBuilder()
        .setTitle(`السؤال (${i + 1}/${questions.length})`)
        .setDescription(`**${questions[i]}**`)
        .setColor('#FEE75C');

      await dmChannel.send({ embeds: [qEmbed] });

      // 2. مهلة الـ AFK: 10 دقائق (600,000 ملي ثانية) لكل سؤال
      const collected = await dmChannel.awaitMessages({
        filter: m => m.author.id === userId,
        max: 1,
        time: 600000, // 10 دقائق
        errors: ['time']
      }).catch(() => null);

      // في حال عدم الرد (AFK)
      if (!collected) {
        activeUsers.delete(userId); // إزالة الحظر عن الشخص لتقديم جديد لاحقاً

        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⏰ تم إلغاء التقديم (AFK)')
          .setDescription('تم إلغاء تقديمك تلقائياً لعدم التفاعل لمدة 10 دقائق. يمكنك البدء من جديد عبر الضغط على الزر في السيرفر.')
          .setColor('#ED4245');

        return await dmChannel.send({ embeds: [timeoutEmbed] });
      }

      const userAnswer = collected.first().content;
      qaPairs.push({ question: questions[i], answer: userAnswer });
    }

    // إزالة المستخدم من القائمة بعد إنهاء كافة الأسئلة
    activeUsers.delete(userId);

    const finishEmbed = new EmbedBuilder()
      .setTitle('✅ تم إرسال تقديمك بنجاح')
      .setDescription('شكرًا لك! تم تسليم إجاباتك للإدارة وتقييمها عبر الذكاء الاصطناعي.')
      .setColor('#57F287');

    await dmChannel.send({ embeds: [finishEmbed] });

    // تقييم الإجابات عبر Groq
    const aiEvaluation = await evaluateApplication(appType, qaPairs);

    // إرسال اللوق لروم الإدارة
    const logEmbed = new EmbedBuilder()
      .setTitle(`📥 لوق تقديم جديد: [ ${appType} ]`)
      .addFields(
        { name: '👤 المتقدم:', value: `${interaction.user} (\`${interaction.user.id}\`)` },
        ...qaPairs.map((item, idx) => ({ name: `س${idx + 1}: ${item.question}`, value: item.answer })),
        { name: '🤖 تقييم الذكاء الاصطناعي (Groq):', value: aiEvaluation }
      )
      .setColor('#FEE75C')
      .setTimestamp();

    const adminControlButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin_accept_${interaction.user.id}_${appType}`)
        .setLabel('✅ قبول')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`admin_reject_${interaction.user.id}_${appType}`)
        .setLabel('❌ رفض')
        .setStyle(ButtonStyle.Danger)
    );

    const logChannel = interaction.guild.channels.cache.get(process.env.APP_LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed], components: [adminControlButtons] });
    }

  } catch (error) {
    console.error(error);
    activeUsers.delete(userId); // تنظيف القائمة في حال حدوث خطأ

    const failEmbed = new EmbedBuilder()
      .setTitle('❌ تعذر إرسال الرسالة')
      .setDescription('يرجى التأكد من فتح الرسائل الخاصة (DM) لسيرفر الديسكورد ثم حاوِل مرة أخرى.')
      .setColor('#ED4245');

    if (!interaction.replied) {
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
}

// معالجة القبول والرفض للتقديم محصورة للإدارة + إعطاء الرتبة
async function handleAdminAction(interaction) {
  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    const noPermissionEmbed = new EmbedBuilder()
      .setTitle('❌ غير مصرح')
      .setDescription('عذراً، فقط أعضاء الإدارة يمتلكون صلاحية قبول أو رفض التقديمات.')
      .setColor('#ED4245');

    return await interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
  }

  const [action, targetUserId, appType] = interaction.customId.replace('admin_', '').split('_');
  const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
  const targetUser = targetMember ? targetMember.user : await interaction.client.users.fetch(targetUserId).catch(() => null);

  const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

  if (action === 'accept') {
    updatedEmbed.setColor('#57F287').addFields({ 
      name: '📌 القرار النهائي:', 
      value: `✅ تم **القبول** بواسطة الإداري: ${interaction.user}` 
    });

    if (appType === 'بائع' && targetMember) {
      await targetMember.roles.add(SELLER_ROLE_ID).catch(err => console.error('تعذر إعطاء رتبة البائع:', err));
    }

    if (targetUser) {
      let acceptText = `🎉 **__تم قبولك كـ ${appType} في حراج جرينفيل, لكن لاتنسى انك حلفت و صبعك راح يشهد عليك في يوم القيامة__**`;
      
      const resultEmbed = new EmbedBuilder()
        .setTitle('🎉 تم قبول تقديمك!')
        .setDescription(acceptText)
        .setColor('#57F287');
      await targetUser.send({ embeds: [resultEmbed] }).catch(() => null);
    }

    await interaction.update({ embeds: [updatedEmbed], components: [] });

  } else if (action === 'reject') {
    updatedEmbed.setColor('#ED4245').addFields({ 
      name: '📌 القرار النهائي:', 
      value: `❌ تم **الرفض** بواسطة الإداري: ${interaction.user}` 
    });

    if (targetUser) {
      let rejectText = `❌ **__نـعتـذر لعـدم قبـولـك فحال تود الانضمام الينا عيد التقديم__**`;

      const resultEmbed = new EmbedBuilder()
        .setTitle('❌ تم رفض تقديمك')
        .setDescription(rejectText)
        .setColor('#ED4245');
      await targetUser.send({ embeds: [resultEmbed] }).catch(() => null);
    }

    await interaction.update({ embeds: [updatedEmbed], components: [] });
  }
}

module.exports = { 
  getSellerAppPanel, 
  getMiddlemanAppPanel, 
  handleButton, 
  handleAdminAction 
};
                             
