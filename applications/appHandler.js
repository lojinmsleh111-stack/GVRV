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
const MIDDLEMAN_ROLE_ID = '1534950655020503111';
const PRE_ADMIN_ROLE_ID = '1534946895263305778';

// قائمة لتتبع المستخدمين الذين يملكون تقديم شغال حالياً
const activeUsers = new Set();

// 1. لوحة تقديم البائع
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

// 2. لوحة تقديم الوسيط
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

// 3. لوحة تقديم الإدارة
function getAdminAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('app_admin').setLabel('تقديم على طاقم الإدارة').setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle('🛡️ تقديم إدارة في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم للإدارة. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#ED4245');

  return { embeds: [embed], components: [row] };
}

// معالجة الضغط على أزرار التقديم وبدء الأسئلة بالخاص
async function handleButton(interaction) {
  const userId = interaction.user.id;

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
      { text: 'اسمك الثلاثي (شرط أساسي):', type: 'text' },
      { text: 'هل قريت قوانين السيرفر والبيع؟', type: 'text' },
      { text: 'اكتب هذا الحلف (بدون نسخ):\n"اقسم بالله العظيم انا (اسمك) ما راح اسرق حسابات او انصب او اتستر عن نصاب ، وراح التزم بقوانين البيع والسيرفر والله على ما اقوله شهيد"', type: 'text' },
      { text: 'في حال مخالفتك للقوانين وسرقة أحد الأعضاء، سيتم التشهير بك واتخاذ الإجراءات القانونية بحقك. هل أنت موافق؟ (نعم موافق / لا أرفض)', type: 'text' }
    ];
  } else if (interaction.customId === 'app_middleman') {
    appType = 'وسيط';
    questions = [
      { text: 'الأسم الثلاثي الحقيقي:', type: 'text' },
      { text: 'العمر الحقيقي:', type: 'text' },
      { text: 'خبراتك في الوساطة:', type: 'text' },
      { text: 'إذا جيت بتبدل بين اثنين ولقيت حساب مسروق وش تسوي؟ يرجى الشرح بالتفصيل:', type: 'text' },
      { text: 'يوزرك على منصة التيك توك:', type: 'text' },
      { text: 'يوزرك على منصة السناب شات:', type: 'text' },
      { text: 'يوزرك على الانستقرام:', type: 'text' },
      { text: 'رقم هاتفك:', type: 'text' },
      { text: 'هل أنت موافق إذا سرقت أحد سوف يتم التشهير بك مع معلوماتك وسوف يتم حلفك على المصحف؟ (موافق جزاك الله خير / لا مرفوض)', type: 'text' }
    ];
  } else if (interaction.customId === 'app_admin') {
    appType = 'إدارة';
    questions = [
      { text: 'اسمك:', type: 'text' },
      { text: 'هل كنت إداري بسيرفر اخر؟', type: 'choice' },
      { text: 'عمرك:', type: 'text' },
      { text: 'خبراتك الإدارية:', type: 'text' },
      { text: 'خبراتك البرمجيه:', type: 'text' },
      { text: 'سبب انضمامك إلى إدارة حراج:', type: 'text' },
      { text: 'هل مستعد للحلف؟', type: 'choice' },
      { text: 'هل لديك مايك للحلف؟', type: 'choice' }
    ];
  }

  try {
    const dmChannel = await interaction.user.createDM();
    activeUsers.add(userId);

    const startEmbed = new EmbedBuilder()
      .setTitle(`📝 بدء تقديم: [ ${appType} ]`)
      .setDescription('سأقوم الآن بطرح الأسئلة عليك هنا بالخاص واحدة تلو الأخرى. يرجى الرد بالإجابة مباشرة.\n\n⏳ **لديك 10 دقائق (AFK) للإجابة على كل سؤال.**')
      .setColor('#5865F2');

    await dmChannel.send({ embeds: [startEmbed] });

    const startSuccessEmbed = new EmbedBuilder()
      .setTitle('📩 تم إرسال الأسئلة بالخاص')
      .setDescription('يرجى التحقق من الرسائل الخاصة بك مع البوت لإكمال التقديم.')
      .setColor('#57F287');

    await interaction.reply({ embeds: [startSuccessEmbed], ephemeral: true });

    const qaPairs = [];

    for (let i = 0; i < questions.length; i++) {
      const qData = questions[i];
      const qEmbed = new EmbedBuilder()
        .setTitle(`السؤال (${i + 1}/${questions.length})`)
        .setDescription(`**${qData.text}**`)
        .setColor('#FEE75C');

      let userAnswer = '';

      if (qData.type === 'choice') {
        const choiceRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('btn_yes').setLabel('نعم').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('btn_no').setLabel('لا').setStyle(ButtonStyle.Danger)
        );

        const msg = await dmChannel.send({ embeds: [qEmbed], components: [choiceRow] });

        const btnInteraction = await msg.awaitMessageComponent({
          filter: btn => btn.user.id === userId,
          time: 600000
        }).catch(() => null);

        if (!btnInteraction) {
          activeUsers.delete(userId);
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ تم إلغاء التقديم (AFK)')
            .setDescription('تم إلغاء تقديمك تلقائياً لعدم التفاعل لمدة 10 دقائق.')
            .setColor('#ED4245');
          return await dmChannel.send({ embeds: [timeoutEmbed] });
        }

        userAnswer = btnInteraction.customId === 'btn_yes' ? 'نعم' : 'لا';
        await btnInteraction.update({ components: [] });

      } else {
        await dmChannel.send({ embeds: [qEmbed] });

        const collected = await dmChannel.awaitMessages({
          filter: m => m.author.id === userId,
          max: 1,
          time: 600000,
          errors: ['time']
        }).catch(() => null);

        if (!collected) {
          activeUsers.delete(userId);
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ تم إلغاء التقديم (AFK)')
            .setDescription('تم إلغاء تقديمك تلقائياً لعدم التفاعل لمدة 10 دقائق.')
            .setColor('#ED4245');
          return await dmChannel.send({ embeds: [timeoutEmbed] });
        }

        userAnswer = collected.first().content;
      }

      qaPairs.push({ question: qData.text, answer: userAnswer });
    }

    activeUsers.delete(userId);

    const finishEmbed = new EmbedBuilder()
      .setTitle('✅ تم إرسال تقديمك بنجاح')
      .setDescription('شكرًا لك! تم تسليم إجاباتك للإدارة وتقييمها عبر الذكاء الاصطناعي.')
      .setColor('#57F287');

    await dmChannel.send({ embeds: [finishEmbed] });

    const aiEvaluation = await evaluateApplication(appType, qaPairs);

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
    activeUsers.delete(userId);

    const failEmbed = new EmbedBuilder()
      .setTitle('❌ تعذر إرسال الرسالة')
      .setDescription('يرجى التأكد من فتح الرسائل الخاصة (DM) لسيرفر الديسكورد ثم حاوِل مرة أخرى.')
      .setColor('#ED4245');

    if (!interaction.replied) {
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
}

// معالجة القبول والرفض للتقديم محصورة للإدارة + إعطاء الرتبة المناسبة
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

    // إعطاء الرتبة المخصصة حسب نوع التقديم
    if (targetMember) {
      if (appType === 'بائع') {
        await targetMember.roles.add(SELLER_ROLE_ID).catch(err => console.error('تعذر إعطاء رتبة البائع:', err));
      } else if (appType === 'وسيط') {
        await targetMember.roles.add(MIDDLEMAN_ROLE_ID).catch(err => console.error('تعذر إعطاء رتبة الوسيط:', err));
      } else if (appType === 'إدارة') {
        await targetMember.roles.add(PRE_ADMIN_ROLE_ID).catch(err => console.error('تعذر إعطاء رتبة قبول مبدئي إدارة:', err));
      }
    }

    if (targetUser) {
      let acceptText = '';

      if (appType === 'إدارة') {
        acceptText = '🎉 **نبارك لك على قبولك المبدئي بـ إدارة حراج الرجاء التوجه لـ الإداره العليا لاستكمال الإجراءات**';
      } else {
        acceptText = `🎉 **__تم قبولك كـ ${appType} في حراج جرينفيل, لكن لاتنسى انك حلفت و صبعك راح يشهد عليك في يوم القيامة__**`;
      }
      
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
      let rejectText = '';

      if (appType === 'إدارة') {
        rejectText = '❌ **نعتذر لعدم قبولك**';
      } else {
        rejectText = `❌ **__نـعتـذر لعـدم قبـولـك فحال تود الانضمام الينا عيد التقديم__**`;
      }

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
  getAdminAppPanel,
  handleButton, 
  handleAdminAction 
};
      
