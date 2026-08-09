// services/groqService.js
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function evaluateApplication(appType, qaPairs) {
  try {
    let formattedAnswers = qaPairs
      .map((item, index) => `س${index + 1}: ${item.question}\nج${index + 1}: ${item.answer}`)
      .join('\n\n');

    // تحديد التوجيه الخاص لكل تقديم
    let systemPrompt = '';
    if (appType === 'إدارة') {
      systemPrompt = 'أنت مقيّم إداريين في سيرفر ديسكورد. قم بتحليل إجابات المتقدم بناءً على: الرزانة، التعامل مع المشاكل، والحيادية. تحقق إن كانت الإجابات تبدو منسوخة من ذكاء اصطناعي آخر. قدم تقييماً من 100 وتوصية (قبول/رفض).';
    } else if (appType === 'بائع') {
      systemPrompt = 'أنت مراجع أمان المبيعات. قم بفحص إجابات المتقدم للتأكد من أن المنتجات لا تخالف قوانين السيرفر، وأن لديه سياسة تعامل واضحة ومحترمة مع الزبائن لضمان عدم حدوث احتيال. قدم تقييماً من 100.';
    } else if (appType === 'وسيط') {
      systemPrompt = 'أنت خبير أمان في عمليات الوساطة (Middleman). قم بتحليل خطة العمل للوسيط. يجب أن تكون خطواته محكمة ودقيقة جداً ولا تدع مجالاً للثغرات أو النصب. قدم تقييماً من 100 ورأيك في أمانته.';
    }

    const userMessage = `نوع التقديم: ${appType}\n\nالإجابات:\n${formattedAnswers}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    });

    return chatCompletion.choices[0]?.message?.content || 'تعذر تقييم التقديم.';
  } catch (error) {
    console.error('Groq API Error:', error);
    return 'حدث خطأ أثناء معالجة التقييم بالذكاء الاصطناعي.';
  }
}

module.exports = { evaluateApplication };
