import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMPORT_MAX_COLUMNS,
  buildAiPrompt,
  getCardValidationErrors,
  getSpeakableExamples,
  getStudySpeech,
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

test('parseBulkImportText: báo lỗi chính xác số dòng khi số cột không thuộc 2/6/9/12/15', () => {
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
  assert.match(result.errors[1], /6\/9\/12\/15/);
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

test('parseBulkImportText: 3/4/5/8/10 cột đều lỗi', () => {
  const cases = [
    ['Từ | Nghĩa | よみ', 3],
    ['Từ | Nghĩa | よみ | câu', 4],
    ['Từ | Nghĩa | よみ | câu | nghĩa câu', 5],
    ['Từ | Nghĩa | よみ | c1 | n1 | t1 | c2 | n2', 8],
    ['Từ | Nghĩa | よみ | c1 | n1 | t1 | c2 | n2 | t2 | c3', 10],
  ];

  for (const [text, columnCount] of cases) {
    const result = parseBulkImportText(text, '|');
    assert.equal(result.cards.length, 0, `${columnCount} cột không được nhận`);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], new RegExp(`Số cột không hợp lệ \\(${columnCount} cột\\)`));
  }
});

test('parseBulkImportText: 9 cột tạo 2 ví dụ', () => {
  const text = 'かける | Treo, móc ; Gọi điện | かける | 壁に絵をかける。 | Treo tranh lên tường. | かべに えを かける。 | 友達に電話をかける。 | Gọi điện cho bạn. | ともだちに でんわを かける。';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].examples.length, 2);
  assert.equal(result.cards[0].examples[0].text, '壁に絵をかける。');
  assert.deepEqual(result.cards[0].examples[1], {
    text: '友達に電話をかける。',
    translation: 'Gọi điện cho bạn.',
    ttsText: 'ともだちに でんわを かける。',
  });
});

test('parseBulkImportText: 15 cột tạo 4 ví dụ, 16 cột thì lỗi', () => {
  const fifteen = 'apple | Quả táo | /ˈæp.əl/ | e1 | t1 | | e2 | t2 | tts2 | e3 | t3 | | e4 | t4 | tts4';
  const ok = parseBulkImportText(fifteen, '|');
  assert.equal(ok.errors.length, 0);
  assert.equal(ok.cards[0].examples.length, 4);
  assert.equal(ok.cards[0].examples[0].ttsText, '');
  assert.equal(ok.cards[0].examples[3].text, 'e4');

  const sixteen = `${fifteen} | extra`;
  const tooMany = parseBulkImportText(sixteen, '|');
  assert.equal(tooMany.cards.length, 0);
  assert.match(tooMany.errors[0], new RegExp(`Số cột không hợp lệ \\(${IMPORT_MAX_COLUMNS + 1} cột\\)`));
});

test('parseBulkImportText: cùng lần dán 2 cột và 9 cột', () => {
  const text = [
    'Hello | Xin chào',
    'かける | Treo, móc ; Gọi điện | かける | 壁に絵をかける。 | Treo tranh lên tường. | かべに えを かける。 | 友達に電話をかける。 | Gọi điện cho bạn. | ともだちに でんわを かける。',
  ].join('\n');
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 2);
  assert.equal(result.cards[0].examples.length, 0);
  assert.equal(result.cards[1].examples.length, 2);
});

test('parseBulkImportText: 9 cột bộ ví dụ đầu trống thì bỏ nhóm đó', () => {
  const text = 'word | meaning | /ipa/ | | | | ex2 | trans2 | tts2';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 1);
  assert.deepEqual(result.cards[0].examples, [
    {
      text: 'ex2',
      translation: 'trans2',
      ttsText: 'tts2',
    },
  ]);
});

test('buildAiPrompt: tạo prompt chuẩn kèm ngôn ngữ học phần', () => {
  const jaPrompt = buildAiPrompt('ja-JP');
  assert.match(jaPrompt, /ja-JP/);
  assert.match(jaPrompt, /Từ vựng \| Nghĩa tiếng Việt \| Cách đọc \| Câu ví dụ \| Nghĩa ví dụ \| Nội dung TTS ví dụ/);
  assert.match(jaPrompt, /Kana/);
  assert.doesNotMatch(jaPrompt, /chính xác sáu cột/);
  assert.match(jaPrompt, /6\/9\/12\/15/);
  assert.match(jaPrompt, /4 ví dụ/);

  const enPrompt = buildAiPrompt('en-US');
  assert.match(enPrompt, /en-US/);
  assert.match(enPrompt, /IPA/);
  assert.match(enPrompt, /Để trống trừ khi câu có từ viết tắt/);
});

test('buildAiPrompt: tiếng Nhật có quy tắc âm Hán tự và gộp thẻ đa nghĩa', () => {
  const jaPrompt = buildAiPrompt('ja-JP');
  assert.match(jaPrompt, /Âm Hán tự/i);
  assert.match(jaPrompt, /GIÁC NGỘ/);
  assert.match(jaPrompt, /GỘP MỘT THẺ/);
  assert.match(jaPrompt, / ; /);
  assert.doesNotMatch(jaPrompt, /TÁCH THÀNH CÁC DÒNG THẺ RIÊNG BIỆT/);
  assert.match(jaPrompt, /khác cách đọc/i);

  const enPrompt = buildAiPrompt('en-US');
  assert.match(enPrompt, /GỘP MỘT THẺ/);
});

test('buildAiPrompt: chú thích dùng \\nchú ý: và không bịa khi không có', () => {
  const jaPrompt = buildAiPrompt('ja-JP');
  assert.match(jaPrompt, /\\nchú ý:/);
  assert.match(jaPrompt, /chú thích/i);
  assert.match(jaPrompt, /Không bịa chú thích/);
  assert.match(jaPrompt, /không đưa âm Hán vào dòng "chú ý:"/);

  const enPrompt = buildAiPrompt('en-US');
  assert.match(enPrompt, /\\nchú ý:/);
  assert.match(enPrompt, /chú thích/i);
});

test('parseBulkImportText: cột nghĩa gộp nhiều nét trên một dòng vẫn là một thẻ', () => {
  const text = 'かける | Treo, móc ; Gọi điện ; Đeo (kính) | かける | 壁に絵をかける。 | Treo tranh lên tường. | かべに えを かける。';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].front, 'かける');
  assert.equal(result.cards[0].back, 'Treo, móc ; Gọi điện ; Đeo (kính)');
  assert.equal(result.cards[0].examples.length, 1);
  assert.equal(result.cards[0].examples[0].text, '壁に絵をかける。');
});

test('parseBulkImportText: \\nchú ý: trong cột nghĩa thành newline thật', () => {
  const text = 'かける | Treo, móc ; Gọi điện ; Đeo (kính)\\nchú ý: Tha động từ; tân ngữ を | かける | 壁に絵をかける。 | Treo tranh lên tường. | かべに えを かける。';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 1);
  assert.equal(
    result.cards[0].back,
    'Treo, móc ; Gọi điện ; Đeo (kính)\nchú ý: Tha động từ; tân ngữ を'
  );
  assert.equal(result.cards[0].examples[0].text, '壁に絵をかける。');
});

test('parseBulkImportText: không có chú thích thì không thêm dòng chú ý; \\n ở cột khác giữ nguyên', () => {
  const text = 'apple | Quả táo. | /ˈæp.əl/ | She eats an apple\\nevery day. | Cô ấy ăn. |';
  const result = parseBulkImportText(text, '|');
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].back, 'Quả táo.');
  assert.doesNotMatch(result.cards[0].back, /chú ý:/);
  assert.equal(result.cards[0].examples[0].text, 'She eats an apple\\nevery day.');
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

test('getStudySpeech: mặt trước luôn đọc từ', () => {
  const result = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: false,
    exampleIndex: 2,
    advance: true,
  });

  assert.equal(result.text, 'cat');
  assert.equal(result.selectedIndex, null);
  assert.equal(result.source, 'word');
  assert.equal(result.spokenIndex, null);
});

test('getStudySpeech: mặt sau không ví dụ thì đọc từ', () => {
  const result = getStudySpeech({
    card: { front: 'cat', speechText: 'cat', examples: [] },
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
    advance: true,
  });

  assert.equal(result.source, 'word');
  assert.equal(result.text, 'cat');
  assert.equal(result.selectedIndex, null);
  assert.equal(result.spokenIndex, null);
});

test('getStudySpeech: chưa chọn thì V và B đều đọc câu 1', () => {
  const replay = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: null,
    advance: false,
  });
  const next = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: null,
    advance: true,
  });

  assert.equal(replay.spokenIndex, 0);
  assert.equal(replay.selectedIndex, 0);
  assert.equal(replay.text, 'I have a cat.');
  assert.equal(next.spokenIndex, 0);
  assert.equal(next.selectedIndex, 0);
  assert.equal(next.text, 'I have a cat.');
});

test('getStudySpeech: V phát lại câu đang chọn, B mới sang câu tiếp', () => {
  const replay = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
    advance: false,
  });
  const next = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
    advance: true,
  });

  assert.equal(replay.spokenIndex, 0);
  assert.equal(replay.selectedIndex, 0);
  assert.equal(replay.text, 'I have a cat.');
  assert.equal(next.spokenIndex, 1);
  assert.equal(next.selectedIndex, 1);
  assert.equal(next.text, 'the cat sleeps');
});

test('getStudySpeech: một ví dụ thì V và B cùng câu đó', () => {
  const card = {
    front: 'cat',
    speechText: 'cat',
    examples: [{ text: 'I have a cat.', ttsText: '' }],
  };
  const replay = getStudySpeech({
    card,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
    advance: false,
  });
  const next = getStudySpeech({
    card,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
    advance: true,
  });

  assert.equal(replay.source, 'example');
  assert.equal(replay.spokenIndex, 0);
  assert.equal(replay.selectedIndex, 0);
  assert.equal(next.spokenIndex, 0);
  assert.equal(next.selectedIndex, 0);
});

test('getStudySpeech: B quay vòng và ưu tiên ttsText', () => {
  const first = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 0,
    advance: true,
  });
  const second = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: first.selectedIndex,
    advance: true,
  });
  const third = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: second.selectedIndex,
    advance: true,
  });

  assert.equal(first.text, 'the cat sleeps');
  assert.equal(first.spokenIndex, 1);
  assert.equal(first.selectedIndex, 1);
  assert.equal(second.text, 'Cats are cute.');
  assert.equal(second.spokenIndex, 2);
  assert.equal(second.selectedIndex, 2);
  assert.equal(third.text, 'I have a cat.');
  assert.equal(third.spokenIndex, 0);
  assert.equal(third.selectedIndex, 0);
});

test('getStudySpeech: index lệch thì modulo rồi phát lại', () => {
  const fromNegative = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: -1,
    advance: false,
  });
  const fromOverflow = getStudySpeech({
    card: speechCard,
    language: 'en-US',
    isFlipped: true,
    exampleIndex: 99,
    advance: false,
  });

  assert.equal(fromNegative.spokenIndex, 2);
  assert.equal(fromNegative.selectedIndex, 2);
  assert.equal(fromOverflow.spokenIndex, 0);
  assert.equal(fromOverflow.selectedIndex, 0);
});


