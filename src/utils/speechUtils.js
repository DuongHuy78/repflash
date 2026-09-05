
// 1. Lấy danh sách các ngôn ngữ có sẵn từ trình duyệt
export const getAvailableLanguages = () => {
  if (!('speechSynthesis' in window)) return [];

  const voices = window.speechSynthesis.getVoices();
  const languagesMap = new Map();

  voices.forEach((voice) => {
    if (!languagesMap.has(voice.lang)) {
      languagesMap.set(voice.lang, {
        code: voice.lang,
        name: `${voice.lang} (${voice.name})`
      });
    }
  });

  return Array.from(languagesMap.values());
};

let speakGeneration = 0;

// 2. Hàm phát âm tiện ích (dùng chung cho cả App.jsx và ReviewCard.jsx)
export const speakText = (text, lang = 'en-US', { onEnd } = {}) => {
  if (!('speechSynthesis' in window) || !text) return;

  window.speechSynthesis.cancel(); // Dừng câu đang đọc trước đó nếu có
  const generation = ++speakGeneration;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const finish = () => {
    if (generation !== speakGeneration) return;
    onEnd?.();
  };
  utterance.onend = finish;
  utterance.onerror = finish;

  window.speechSynthesis.speak(utterance);
}