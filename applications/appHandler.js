// applications/appHandler.js
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

// رابط الصورة الموحد
const PANEL_IMAGE = 'https://cdn.discordapp.com/attachments/1423345110732640316/1536494515878240426/af8d2477ec06380f4fa6c48e188384ec-1-ezgif.com-webp-to-png-converter_1.webp?ex=6a7b9b87&is=6a7a4a07&hm=641cb345c5dd4e9a961781a446d677bcb7f8e0d7fd46c32d3eed4cb464030998&';

// الآيديات الخاصة بالرتب
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || '1534937247315398797';
const SELLER_ROLE_ID = process.env.SELLER_ROLE_ID || '1534952025953931418';
const MIDDLEMAN_ROLE_ID = process.env.MIDDLEMAN_ROLE_ID || '1534950655020503111';
const PRE_ADMIN_ROLE_ID = process.env.PRE_ADMIN_ROLE_ID || '1534946895263305778';

// تتبع المتقدمين النشطين
const activeUsers = new Set();

function getSellerAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('app_seller')
      .setLabel('تقديم على بائع / تاجر')
      .setEmoji('🛒')
      .setStyle(ButtonStyle.Danger) // أحمر
  );

  const embed = new EmbedBuilder()
    .setTitle('🛒 تقديم بائع في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#ED4245')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

function getMiddlemanAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('app_middleman')
      .setLabel('تقديم على وسيط (MM)')
      .setEmoji('🤝')
      .setStyle(ButtonStyle.Secondary) // رمادي غامق
  );

  const embed = new EmbedBuilder()
    .setTitle('🤝 تقديم وسيط في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#4F545C')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

function getAdminAppPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('app_admin')
      .setLabel('تقديم على طاقم الإدارة')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Primary) // ذهبي/أزرق
  );

  const embed = new EmbedBuilder()
    .setTitle('🛡️ تقديم إدارة في حراج جرينفيل')
    .setDescription('إضغط على الزر أدناه للبدء بالتقديم للإدارة. سيتم إرسال الأسئلة لك في الرسائل الخاصة (DM).')
    .setColor('#FEE75C')
    .setImage(PANEL_IMAGE);

  return { embeds: [embed], components: [row] };
}

async function handleButton(interaction) {
  const userId = interaction.user.id;

  if (activeUsers.has(userId)) {
    const alreadyActiveEmbed = new EmbedBuilder()
      .setTitle('⚠️ لديك تقديم نشط بالفعل')
      .setDescription('لديك تقديم قيد الإجراء حالياً في الرسائل الخاصة! يرجى إكماله أو انتظاره حتى يلغى تلقائياً.')
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
      { 
        text: 'هل كنت إداري بسيرفر اخر؟', 
        type: 'select',
        options: [
          { label: 'نعم', value: 'نعم', emoji: '✅' },
          { label: 'لا', value: 'لا', emoji: '❌' }
        ]
      },
      { text: 'عمرك:', type: 'text' },
      { text: 'خبراتك الإدارية:', type: 'text' },
      { text: 'خبراتك البرمجيه:', type: 'text' },
      { text: 'سبب انضمامك إلى إدارة حراج:', type: 'text' },
      { 
        text: 'هل مستعد للحلف؟', 
        type: 'select',
        options: [
          { label: 'نعم', value: 'نعم', emoji: '✅' },
          { label: 'لا', value: 'لا', emoji: '❌' }
        ]
      },
      { 
        text: 'هل لديك مايك للحلف؟', 
        type: 'select',
        options: [
          { label: 'نعم', value: 'نعم', emoji: '✅' },
          { label: 'لا', value: 'لا', emoji: '❌' }
        ]
      }
    ];
  }

  try {
    const dmChannel = await interaction.user.createDM();
    activeUsers.add(userId);

    // الرسالة الأولى بالخاص تحتوي على الصورة العريضة
    const startEmbed = new EmbedBuilder()
      .setTitle(`📝 بدء تقديم: [ ${appType} ]`)
      .setDescription('سأقوم الآن بطرح الأسئلة عليك هنا بالخاص واحدة تلو الأخرى.\n\n⏳ **لديك 10 دقائق للإجابة على كل سؤال.**')
      .setColor('#5865F2')
      .setImage(PANEL_IMAGE);

    await dmChannel.send({ embeds: [startEmbed] });

    const startSuccessEmbed = new EmbedBuilder()
      .setTitle('📩 تم إرسال الأسئلة بالخاص')
      .setDescription('يرجى التحقق من الرسائل الخاصة بك مع البوت لإكمال التقديم.')
      .setColor('#57F287');

    await interaction.reply({ embeds: [startSuccessEmbed], ephemeral: true });

    const qaPairs = [];

    for (let i = 0; i < questions.length; i++) {
      const qData = questions[i];
      let userAnswer = '';

      if (qData.type === 'select') {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_q_${i}_${userId}`)
          .setPlaceholder('اختر إجابتك من القائمة...')
          .addOptions(
            qData.options.map(opt => 
              new StringSelectMenuOptionBuilder()
                .setLabel(opt.label)
                .setValue(opt.value)
                .setEmoji(opt.emoji)
            )
          );

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        const qEmbed = new EmbedBuilder()
          .setTitle(`السؤال (${i + 1}/${questions.length})`)
          .setDescription(`**${qData.text}**\n\n👇 **اختر من القائمة المنسدلة:**`)
          .setColor('#5865F2');

        const msg = await dmChannel.send({ embeds: [qEmbed], components: [selectRow] });

        const selectInteraction = await msg.awaitMessageComponent({
          filter: inter => inter.user.id === userId && inter.customId === `select_q_${i}_${userId}`,
          time: 600000
        }).catch(() => null);

        if (!selectInteraction) {
          activeUsers.delete(userId);
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ تم إلغاء التقديم')
            .setDescription('تم إلغاء تقديمك تلقائياً لعدم التفاعل لمدة 10 دقائق.')
            .setColor('#ED4245');
          return await dmChannel.send({ embeds: [timeoutEmbed] });
        }

        userAnswer = selectInteraction.values[0];

        const answeredEmbed = new EmbedBuilder()
          .setTitle(`السؤال (${i + 1}/${questions.length})`)
          .setDescription(`**${qData.text}**\n\n✅ **إجابتك:** ${userAnswer}`)
          .setColor('#57F287');

        await selectInteraction.update({ embeds: [answeredEmbed], components: [] });

      } else {
        const qEmbed = new EmbedBuilder()
          .setTitle(`السؤال (${i + 1}/${questions.length})`)
          .setDescription(`**${qData.text}**`)
          .setColor('#FEE75C');

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
            .setTitle('⏰ تم إلغاء التقديم')
            .setDescription('تم إلغاء تقديمك تلقائياً لعدم التفاعل لمدة 10 دقائق.')
            .setColor('#ED4245');
          return await dmChannel.send({ embeds: [timeoutEmbed] });
        }

        userAnswer = collected.first().content;
      }

      qaPairs.push({ question: qData.text, answer: userAnswer });
    }

    activeUsers.delete(userId);

    // --- منطق القبول والرفض التلقائي 100% ---
    let isAccepted = true;

    if (appType === 'إدارة') {
      const oathAns = qaPairs.find(p => p.question.includes('مستعد للحلف'))?.answer;
      const micAns = qaPairs.find(p => p.question.includes('مايك للحلف'))?.answer;
      if (oathAns === 'لا' || micAns === 'لا') {
        isAccepted = false;
      }
    }

    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (isAccepted) {
      if (member) {
        if (appType === 'بائع') await member.roles.add(SELLER_ROLE_ID).catch(() => {});
        else if (appType === 'وسيط') await member.roles.add(MIDDLEMAN_ROLE_ID).catch(() => {});
        else if (appType === 'إدارة') await member.roles.add(PRE_ADMIN_ROLE_ID).catch(() => {});
      }

      let acceptText = appType === 'إدارة'
        ? '🎉 **نبارك لك على قبولك المبدئي بـ إدارة حراج الرجاء التوجه لـ الإداره العليا لاستكمال الإجراءات**'
        : `🎉 **__تم قبولك كـ ${appType} في حراج جرينفيل, لكن لاتنسى انك حلفت و صبعك راح يشهد عليك في يوم القيامة__**`;

      const acceptEmbed = new EmbedBuilder()
        .setTitle('🎉 تم قبول تقديمك تلقائياً!')
        .setDescription(acceptText)
        .setColor('#57F287');

      await dmChannel.send({ embeds: [acceptEmbed] });

    } else {
      let rejectText = appType === 'إدارة'
        ? '❌ **نعتذر لعدم قبولك**'
        : `❌ **__نـعتـذر لعـدم قبـولـك فحال تود الانضمام الينا عيد التقديم__**`;

      const rejectEmbed = new EmbedBuilder()
        .setTitle('❌ تم رفض تقديمك')
        .setDescription(rejectText)
        .setColor('#ED4245');

      await dmChannel.send({ embeds: [rejectEmbed] });
    }

    // إرسال اللوق للإدارة
    const logEmbed = new EmbedBuilder()
      .setTitle(`📥 لوق تقديم جديد (معالجة تلقائية): [ ${appType} ]`)
      .addFields(
        { name: '👤 المتقدم:', value: `${interaction.user} (\`${interaction.user.id}\`)` },
        ...qaPairs.map((item, idx) => ({ name: `س${idx + 1}: ${item.question}`, value: item.answer })),
        { name: '🤖 القرار الآلي التلقائي:', value: isAccepted ? '✅ **تم القبول تلقائياً وتم إعطاء الرتبة**' : '❌ **تم الرفض تلقائياً**' }
      )
      .setColor(isAccepted ? '#57F287' : '#ED4245')
      .setTimestamp();

    const logChannelId = process.env.APP_LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] });
      }
    }

  } catch (error) {
    console.error(error);
    activeUsers.delete(userId);

    const failEmbed = new EmbedBuilder()
      .setTitle('❌ تعذر إرسال الرسالة')
      .setDescription('يرجى التأكد من فتح الرسائل الخاصة (DM) لسيرفر الديسكورد ثم حاوِل مرة أخرى.')
      .setColor('#ED4245');

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
}

function handleAdminAction() {}

module.exports = { 
  getSellerAppPanel, 
  getMiddlemanAppPanel, 
  getAdminAppPanel,
  handleButton, 
  handleAdminAction 
};
       
