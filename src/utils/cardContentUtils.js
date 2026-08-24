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


export const buildAiPrompt = (language = 'ja-JP') => {
  const languageLabel = language ? String(language).trim() : 'ja-JP';
  return `Bạn là trợ lý tạo flashcard học từ vựng.

Ngôn ngữ phát âm của học phần: ${languageLabel}.

Hãy chuyển danh sách từ bên dưới thành các thẻ flashcard.
Chỉ trả về văn bản thuần, không Markdown, không tiêu đề, không đánh số,
không giải thích. Mỗi thẻ đúng một dòng, gồm chính xác sáu cột ngăn bởi: |

Từ vựng | Nghĩa tiếng Việt | Cách đọc | Câu ví dụ | Nghĩa ví dụ | Nội dung TTS ví dụ

Quy tắc:
- Không dùng ký tự | bên trong bất kỳ cột nào.
- Cung cấp một câu ví dụ ngắn, tự nhiên, đúng ngữ cảnh cho mỗi từ.
- Với tiếng Nhật: cột Cách đọc là Kana; cột TTS ví dụ là cả câu viết bằng Kana.
- Với tiếng Anh: cột Cách đọc là IPA; để trống cột TTS ví dụ trừ khi câu có cách đọc đặc biệt.
- Nếu không có cách đọc hoặc TTS thay thế, giữ cột đó trống nhưng vẫn giữ đủ sáu cột.
- Không bịa nghĩa hoặc câu ví dụ nếu từ đầu vào không đủ rõ; hãy giữ nguyên từ đó.

Danh sách từ cần tạo:
[DÁN TỪ HOẶC CHỦ ĐỀ CỦA TÔI Ở ĐÂY]`;
};

export const parseBulkImportText = (text, separator = '|') => {
  const rawText = typeof text === 'string' ? text : '';
  if (!rawText.trim()) {
    return {
      cards: [],
      errors: ['Hãy dán nội dung hoặc tải file trước khi xem trước.'],
    };
  }

  const effectiveSeparator = separator || '|';
  const lines = rawText.split(/\r?\n/);
  const cards = [];
  const errors = [];

  let nonEmptyLineCount = 0;
  const parsedEntries = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const lineNumber = index + 1;
    if (!rawLine.trim()) continue;

    nonEmptyLineCount += 1;
    parsedEntries.push({ rawLine, lineNumber });
  }

  if (nonEmptyLineCount === 0) {
    return {
      cards: [],
      errors: ['Không tìm thấy thẻ hợp lệ. Hãy kiểm tra lại từng dòng và dấu phân cách.'],
    };
  }

  if (nonEmptyLineCount > 500) {
    return {
      cards: [],
      errors: ['Số lượng thẻ vượt quá giới hạn tối đa 500 thẻ mỗi lần import.'],
    };
  }

  for (const { rawLine, lineNumber } of parsedEntries) {
    const parts = rawLine.split(effectiveSeparator);

    if (parts.length < 2 || parts.length > 6) {
      errors.push(
        `Dòng ${lineNumber}: Số cột không hợp lệ (${parts.length} cột, yêu cầu từ 2 đến 6 cột).`
      );
      continue;
    }

    const front = parts[0].trim();
    const back = parts[1].trim();
    const pronunciation = parts[2]?.trim() || '';
    const exampleText = parts[3]?.trim() || '';
    const exampleTranslation = parts[4]?.trim() || '';
    const exampleTts = parts[5]?.trim() || '';

    if (!front) {
      errors.push(`Dòng ${lineNumber}: Mặt trước của thẻ không được để trống.`);
    }
    if (!back) {
      errors.push(`Dòng ${lineNumber}: Mặt sau của thẻ không được để trống.`);
    }

    let examples = [];
    if (exampleText) {
      examples = [
        {
          text: exampleText,
          translation: exampleTranslation,
          ttsText: exampleTts,
        },
      ];
    } else if (exampleTranslation || exampleTts) {
      examples = [
        {
          text: '',
          translation: exampleTranslation,
          ttsText: exampleTts,
        },
      ];
    }

    cards.push(
      toEditableCardContent({
        front,
        pronunciation,
        speechText: '',
        back,
        examples,
      })
    );
  }

  return {
    cards: errors.length > 0 ? [] : cards,
    errors,
  };
};

