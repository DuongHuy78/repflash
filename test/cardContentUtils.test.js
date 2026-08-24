import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCardValidationErrors,
  hasCardValidationErrors,
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
