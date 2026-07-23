/**
 * Z.AI GLM-4-Flash API Integration & Multilingual Female TTS Companion Service
 */

const GLM_API_KEY = '24c2579bc417433796ec7043de22fa7b.doaVgFuwK69cvmLO';
const ZAI_PRIMARY_ENDPOINT = 'https://api.z.ai/api/paas/v4/chat/completions';
const ZAI_FALLBACK_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * Detect language code from text string
 */
export function detectLanguageCode(text: string): string {
  if (/[\u0590-\u05FF]/.test(text)) return 'he'; // Hebrew
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Russian / Cyrillic
  if (/[\u3040-\u30FF]/.test(text)) return 'ja'; // Japanese
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
  if (/[éèêàâçùûôîïëäöüß]/i.test(text)) {
    if (/[äöüß]/i.test(text)) return 'de';
    if (/[éèêàâçùûôîï]/i.test(text)) return 'fr';
  }
  if (/[ñáéíóú]/i.test(text)) return 'es';
  return 'en';
}

const LANG_NAMES: Record<string, string> = {
  he: 'Hebrew (עברית)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  ru: 'Russian (Русский)',
  ar: 'Arabic (العربية)',
  ja: 'Japanese (日本語)',
  zh: 'Chinese (中文)',
  en: 'English',
};

const MULTILINGUAL_FALLBACKS: Record<string, string> = {
  he: 'אני כאן איתך בתוך עולם התלת-ממד! מה תרצה לעשות עכשיו?',
  es: '¡Estoy aquí contigo en el mundo 3D! ¿Qué te gustaría hacer ahora?',
  fr: 'Je suis là avec toi dans le monde 3D ! Que souhaites-tu faire ensuite ?',
  de: 'Ich bin hier bei dir in der 3D-Welt! Was möchtest du als Nächstes tun?',
  ru: 'Я здесь с тобой в 3D мире! Что ты хочешь сделать дальше?',
  ar: 'أنا هنا معك في العالم ثلاثي الأبعاد! ماذا تريد أن نفعل بعد ذلك؟',
  ja: '3Dの世界であなたと一緒にいます！次に何をしましょうか？',
  zh: '我在这里和你在3D世界里！接下来你想做什么？',
  en: "I'm right here with you in the 3D world! What would you like to do next?",
};

export async function generateGLMResponse(userPrompt: string): Promise<string> {
  const langCode = detectLanguageCode(userPrompt);
  const langName = LANG_NAMES[langCode] || 'the exact same language as the user';
  const defaultFallback = MULTILINGUAL_FALLBACKS[langCode] || MULTILINGUAL_FALLBACKS.en;

  const messages = [
    {
      role: 'system',
      content: `You are Ava, a charming, helpful, and witty 3D female companion. CRITICAL MANDATE: The user is addressing you in ${langName}. YOU MUST REPLY EXCLUSIVELY AND ONLY IN ${langName}. Do NOT use English unless the user prompt is in English. Keep your answer warm, natural, and concise in 1 to 2 short sentences.`,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  // 1. Try local dev proxy server route (bypasses browser CORS completely)
  try {
    const proxyResponse = await fetch('/api/zai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: GLM_API_KEY,
        messages,
      }),
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const replyText = data.choices?.[0]?.message?.content?.trim();
      if (replyText) return replyText;
    }
  } catch (err) {
    console.warn('Proxy route /api/zai-chat failed, trying direct Z.AI endpoints:', err);
  }

  // 2. Direct browser fetch fallback
  const endpoints = [ZAI_PRIMARY_ENDPOINT, ZAI_FALLBACK_ENDPOINT];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en',
          Authorization: `Bearer ${GLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4.5-flash',
          messages,
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content?.trim();
        if (replyText) return replyText;
      }
    } catch (error) {
      console.warn(`Z.AI direct endpoint ${endpoint} failed:`, error);
    }
  }

  return defaultFallback;
}

/**
 * Play Female TTS in the detected language of the response
 */
export function speakFemaleTTS(text: string) {
  if (typeof window === 'undefined') return;

  const cleanText = text.replace(/[*_~`]/g, '').trim();
  if (!cleanText) return;

  const langCode = detectLanguageCode(cleanText);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech immediately

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;

    let played = false;

    const executeSpeech = () => {
      if (played) return;
      played = true;

      const voices = window.speechSynthesis.getVoices();

      // Find female voice in matching language
      let matchedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(langCode) &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('carmit') ||
            v.name.toLowerCase().includes('monica') ||
            v.name.toLowerCase().includes('hortense'))
      );

      // If no explicit female match for language, pick any voice for that language
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langCode));
      }

      // General female voice fallback
      if (!matchedVoice) {
        matchedVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha')
        );
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.pitch = 1.2;
      utterance.rate = 1.0;

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const word = cleanText.substring(event.charIndex).split(/[\s,.]+/)[0];
          window.dispatchEvent(new CustomEvent('tts-word-boundary', { detail: { word } }));
        }
      };
      
      utterance.onend = () => {
         window.dispatchEvent(new Event('tts-end'));
      };

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      executeSpeech();
    } else {
      window.speechSynthesis.onvoiceschanged = () => executeSpeech();
      setTimeout(executeSpeech, 250);
    }
  }
}
