export const createEmptyExample = () => ({
  text: '',
  translation: '',
  ttsText: '',
});

export const createEmptyCardContent = () => ({
  front: '',
  pronunciation: '',
  speechText: '',
  back: '',
  examples: [],
});

export const toEditableCardContent = (card = {}) => ({
  front: card.front || '',
  pronunciation: card.pronunciation || '',
  speechText: card.speechText || '',
  back: card.back || '',
  examples: Array.isArray(card.examples)
    ? card.examples.map((example) => ({
        text: example?.text || '',
        translation: example?.translation || '',
        ttsText: example?.ttsText || '',
      }))
    : [],
});

export const compactCardContent = (card = {}) => ({
  front: String(card.front || '').trim(),
  pronunciation: String(card.pronunciation || '').trim(),
  speechText: String(card.speechText || '').trim(),
  back: String(card.back || '').trim(),
  examples: Array.isArray(card.examples)
    ? card.examples
        .map((example) => ({
          text: String(example?.text || '').trim(),
          translation: String(example?.translation || '').trim(),
          ttsText: String(example?.ttsText || '').trim(),
        }))
        .filter((example) => example.text || example.translation || example.ttsText)
    : [],
});

export const getCardSpeechText = (card, language = '') => {
  if (!card) return '';
  if (card.speechText?.trim()) return card.speechText.trim();

  const isJapanese = language.toLowerCase().startsWith('ja');
  if (isJapanese && card.pronunciation?.trim()) {
    return card.pronunciation.trim();
  }

  return card.front?.trim() || '';
};

export const getExampleSpeechText = (example) => (
  example?.ttsText?.trim() || example?.text?.trim() || ''
);

export const getCardValidationErrors = (card = {}) => {
  const normalizedCard = compactCardContent(card);

  return {
    front: normalizedCard.front ? '' : 'Hãy nhập mặt trước của thẻ.',
    back: normalizedCard.back ? '' : 'Hãy nhập mặt sau của thẻ.',
    examples: normalizedCard.examples.map((example) => (
      example.text ? '' : 'Hãy nhập câu ví dụ hoặc xóa mục này.'
    )),
  };
};

export const hasCardValidationErrors = (errors = {}) => (
  Boolean(errors.front) ||
  Boolean(errors.back) ||
  (Array.isArray(errors.examples) && errors.examples.some(Boolean))
);
