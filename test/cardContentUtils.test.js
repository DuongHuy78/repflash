import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiPrompt,
  getCardValidationErrors,
  getNextStudySpeech,
  getSpeakableExamples,
  hasCardValidationErrors,
  parseBulkImportText,
} from '../src/utils/cardContentUtils.js';

test('thẻ hợp lệ không có lỗi validation', () => {
  const errors = getCardValidationErrors({
    front: '覚悟',
    back: 'Quyết tâm',
    examples: [],
  });

  assert.equal(hasCardValidationErrors(errors), false);
});

test('thẻ thiếu front và back báo lỗi đúng field', () => {
  const errors = getCardValidationErrors({ front: ' ', back: '' });

  assert.match(errors.front, /mặt trước/i);
  assert.match(errors.back, /mặt sau/i);
  assert.equal(hasCardValidationErrors(errors), true);
});

test('ví dụ có nghĩa nhưng thiếu câu ví dụ bị xem là lỗi', () => {
  const errors = getCardValidationErrors({
    front: '覚悟',
    back: 'Quyết tâm',
    examples: [{ text: '', translation: 'Tôi đã sẵn sàng.', ttsText: '' }],
  });

  assert.match(errors.examples[0], /câu ví dụ/i);
  assert.equal(hasCardValidationErrors(errors), true);
});

test('dữ liệu cũ không có examples vẫn hợp lệ', () => {
  const errors = getCardValidationErrors({ front: 'old', back: 'cũ' });

  assert.deepEqual(errors.examples, []);
  assert.equal(hasCardValidationErrors(errors), false);
});

test('parseBulkImportText: import 2 cột cũ với các loại dấu phân cách', () => {
  const pipeInput = 'Hello | Xin chào\nApple | Quả táo';
  const pipeResult = parseBulkImportText(pipeInput, '|');
  assert.equal(pipeResult.errors.length, 0);
  assert.equal(pipeResult.cards.length, 2);
  assert.deepEqual(pipeResult.cards[0], {
    front: 'Hello',
    pronunciation: '',
    speechText: '',
    back: 'Xin chào',
    examples: [],
  });

  const dashInput = 'Cat - Con mèo\nDog - Con chó';
  const dashResult = parseBulkImportText(dashInput, '-');
  assert.equal(dashResult.errors.length, 0);
  assert.equal(dashResult.cards.length, 2);
  assert.equal(dashResult.cards[1].front, 'Dog');
  assert.equal(dashResult.cards[1].back, 'Con chó');

  const tabInput = 'Water\tNước';
  const tabResult = parseBulkImportText(tabInput, '\t');
  assert.equal(tabResult.errors.length, 0);
  assert.equal(tabResult.cards.length, 1);
  assert.equal(tabResult.cards[0].front, 'Water');
  assert.equal(tabResult.cards[0].back, 'Nước');
});

test('parseBulkImportText: import 6 cột đầy đủ tiếng Nhật và tiếng Anh', () => {
  const text = [
    '覚悟 | Quyết tâm | かくご | 覚悟を決めて挑戦する。 | Tôi quyết tâm thử thách bản thân. | かくごをきめてちょうせんする。',
    'apple | Quả táo. | /ˈæp.əl/ | She eats an apple every day. | Cô ấy ăn một quả táo mỗi ngày. |',
  ].join('\n');

  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 2);

  assert.deepEqual(result.cards[0], {
    front: '覚悟',
    pronunciation: 'かくご',
    speechText: '',
    back: 'Quyết tâm',
    examples: [
      {
        text: '覚悟を決めて挑戦する。',
        translation: 'Tôi quyết tâm thử thách bản thân.',
        ttsText: 'かくごをきめてちょうせんする。',
      },
    ],
  });

  assert.deepEqual(result.cards[1], {
    front: 'apple',
    pronunciation: '/ˈæp.əl/',
    speechText: '',
    back: 'Quả táo.',
    examples: [
      {
        text: 'She eats an apple every day.',
        translation: 'Cô ấy ăn một quả táo mỗi ngày.',
        ttsText: '',
      },
    ],
  });
});

test('parseBulkImportText: bỏ qua các dòng trống và dòng khoảng trắng', () => {
  const text = '\n  \nHello | Xin chào\n\n\nWorld | Thế giới\n  ';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 2);
  assert.equal(result.cards[0].front, 'Hello');
  assert.equal(result.cards[1].front, 'World');
});

test('parseBulkImportText: báo lỗi chính xác số dòng khi thiếu cột hoặc quá 6 cột', () => {
  const text = [
    'Dòng 1 hợp lệ | Nghĩa 1',
    'Dòng 2 chỉ có một cột duy nhất',
    'Dòng 3 hợp lệ | Nghĩa 3',
    'Dòng 4 | Quá | Nhiều | Cột | Không | Hợp | Lệ',
  ].join('\n');

  const result = parseBulkImportText(text, '|');
  assert.equal(result.cards.length, 0);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /Dòng 2:.*Số cột không hợp lệ \(1 cột/i);
  assert.match(result.errors[1], /Dòng 4:.*Số cột không hợp lệ \(7 cột/i);
});

test('parseBulkImportText: báo lỗi khi mặt trước hoặc mặt sau rỗng', () => {
  const text = '   | Nghĩa\nTừ |   ';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.cards.length, 0);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /Dòng 1:.*Mặt trước/i);
  assert.match(result.errors[1], /Dòng 2:.*Mặt sau/i);
});

test('parseBulkImportText: cột 5 hoặc 6 có dữ liệu nhưng cột 4 rỗng tạo example để preview báo lỗi', () => {
  const text = 'apple | Quả táo | /ˈæp.əl/ | | Nghĩa câu ví dụ |';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 1);
  assert.deepEqual(result.cards[0].examples, [
    {
      text: '',
      translation: 'Nghĩa câu ví dụ',
      ttsText: '',
    },
  ]);

  const validationErrors = getCardValidationErrors(result.cards[0]);
  assert.equal(hasCardValidationErrors(validationErrors), true);
  assert.match(validationErrors.examples[0], /câu ví dụ/i);
});

test('parseBulkImportText: chặn import khi vượt quá 500 thẻ', () => {
  const lines = Array.from({ length: 501 }, (_, i) => `Từ ${i + 1} | Nghĩa ${i + 1}`);
  const result = parseBulkImportText(lines.join('\n'), '|');
  assert.equal(result.cards.length, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /500/);
});

test('buildAiPrompt: tạo prompt chuẩn kèm ngôn ngữ học phần', () => {
  const jaPrompt = buildAiPrompt('ja-JP');
  assert.match(jaPrompt, /ja-JP/);
  assert.match(jaPrompt, /Từ vựng \| Nghĩa tiếng Việt \| Cách đọc \| Câu ví dụ \| Nghĩa ví dụ \| Nội dung TTS ví dụ/);
  assert.match(jaPrompt, /Kana/);

  const enPrompt = buildAiPrompt('en-US');
  assert.match(enPrompt, /en-US/);
  assert.match(enPrompt, /IPA/);
});

test('buildAiPrompt: tiếng Nhật có quy tắc âm Hán tự và tách thẻ theo mẫu nghĩa', () => {
  const jaPrompt = buildAiPrompt('ja-JP');
  assert.match(jaPrompt, /Âm Hán tự/i);
  assert.match(jaPrompt, /GIÁC NGỘ/);
  assert.match(jaPrompt, /TÁCH THÀNH CÁC DÒNG THẺ RIÊNG BIỆT/);
});

const speechCard = {
  front: 'cat',
  speechText: 'cat',
  examples: [
    { text: 'I have a cat.', translation: 'Tôi có mèo.', ttsText: '' },
    { text: 'The cat sleeps.', translation: '', ttsText: 'the cat sleeps' },
    { text: 'Cats are cute.', translation: '', ttsText: '' },
    { text: '   ', translation: 'bỏ qua', ttsText: 'ignored' },
  ],
};

test('getSpeakableExamples: chỉ giữ câu có text và bỏ examples không phải mảng', () => {
  assert.equal(getSpeakableExamples(speechCard).length, 3);
  assert.deepEqual(getSpeakableExamples({ front: 'cat' }), []);
  assert.deepEqual(getSpeakableExamples(null), []);
});

test('getNextStudySpeech: mặt trước luôn đọc từ', () => {
  const result = getNextStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: false,
    exampleIndex: 2,
  });

  assert.equal(result.text, 'cat');
  assert.equal(result.nextIndex, 0);
  assert.equal(result.source, 'word');
  assert.equal(result.spokenIndex, null);
});

test('getNextStudySpeech: mặt sau không ví dụ thì đọc từ', () => {
  const result = getNextStudySpeech({
    card: { front: 'cat', speechText: 'cat', examples: [] },
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
  });

  assert.equal(result.source, 'word');
  assert.equal(result.text, 'cat');
  assert.equal(result.nextIndex, 0);
  assert.equal(result.spokenIndex, null);
});

test('getNextStudySpeech: một ví dụ đọc lại chính câu đó', () => {
  const result = getNextStudySpeech({
    card: {
      front: 'cat',
      speechText: 'cat',
      examples: [{ text: 'I have a cat.', ttsText: '' }],
    },
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
  });

  assert.equal(result.source, 'example');
  assert.equal(result.text, 'I have a cat.');
  assert.equal(result.spokenIndex, 0);
  assert.equal(result.nextIndex, 0);
});

test('getNextStudySpeech: nhiều ví dụ quay vòng và ưu tiên ttsText', () => {
  const first = getNextStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
  });
  const second = getNextStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: first.nextIndex,
  });
  const third = getNextStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: second.nextIndex,
  });

  assert.equal(first.text, 'I have a cat.');
  assert.equal(first.spokenIndex, 0);
  assert.equal(first.nextIndex, 1);
  assert.equal(second.text, 'the cat sleeps');
  assert.equal(second.spokenIndex, 1);
  assert.equal(second.nextIndex, 2);
  assert.equal(third.text, 'Cats are cute.');
  assert.equal(third.spokenIndex, 2);
  assert.equal(third.nextIndex, 0);
});

test('getNextStudySpeech: index lệch vẫn ra vị trí hợp lệ', () => {
  const fromNegative = getNextStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: -1,
  });
  const fromOverflow = getNextStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 99,
  });

  assert.equal(fromNegative.spokenIndex, 2);
  assert.equal(fromNegative.nextIndex, 0);
  assert.equal(fromOverflow.spokenIndex, 0);
  assert.equal(Number.isNaN(fromOverflow.nextIndex), false);
});


