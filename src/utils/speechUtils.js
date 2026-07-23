
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

// 2. Hàm phát âm tiện ích (dùng chung cho cả App.jsx và ReviewCard.jsx)
export const speakText = (text, lang = 'en-US') => {
  if (!('speechSynthesis' in window) || !text) return;

  window.speechSynthesis.cancel(); // Dừng câu đang đọc trước đó nếu có
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  window.speechSynthesis.speak(utterance);
}