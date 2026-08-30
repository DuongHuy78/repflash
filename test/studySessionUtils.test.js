import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDY_MODE,
  STUDY_SESSION_STATUS,
  createStudySessionState,
  getStudyCompletionAction,
  getStudyProgress,
  isInitialStudyEmpty,
  isStudyCompleted,
  studySessionReducer,
} from '../src/utils/studySessionUtils.js';

const syncQueue = (state, payload) => studySessionReducer(state, {
  type: 'SYNC_QUEUE',
  payload,
});

const recordReview = (state, quality) => studySessionReducer(state, {
  type: 'RECORD_REVIEW',
  payload: { quality },
});

test('main quality 1 tăng attempt, again và completed', () => {
  const initial = createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 3,
  });
  const next = recordReview(initial, 1);

  assert.equal(next.attemptCount, 1);
  assert.equal(next.againCount, 1);
  assert.equal(next.completedCardCount, 1);
  assert.equal(next.rememberedCount, 0);
});

test('retry quality 1 chưa hoàn thành thẻ vì thẻ quay lại cuối hàng', () => {
  const initial = createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.RETRY,
    cardCount: 2,
  });
  const next = recordReview(initial, 1);

  assert.equal(next.attemptCount, 1);
  assert.equal(next.againCount, 1);
  assert.equal(next.completedCardCount, 0);
});

test('retry quality 3 hoàn thành và ghi nhận nhớ thẻ', () => {
  const initial = createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.RETRY,
    cardCount: 2,
  });
  const next = recordReview(initial, 3);

  assert.equal(next.completedCardCount, 1);
  assert.equal(next.rememberedCount, 1);
  assert.deepEqual(getStudyProgress(next), {
    current: 2,
    total: 2,
    percentage: 50,
  });
});

test('đổi deck tạo session mới và xóa thống kê cũ', () => {
  const initial = recordReview(createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 4,
  }), 3);
  const next = syncQueue(initial, {
    deckId: 'deck-2',
    mode: STUDY_MODE.MAIN,
    cardCount: 2,
  });

  assert.equal(next.key, 'deck-2:main');
  assert.equal(next.initialCardCount, 2);
  assert.equal(next.attemptCount, 0);
});

test('phân biệt hàng đợi rỗng ban đầu và phiên vừa hoàn thành', () => {
  const empty = createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 0,
  });

  assert.equal(isInitialStudyEmpty(empty, false, 0), true);
  assert.equal(isStudyCompleted(empty), false);

  const active = syncQueue(empty, {
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 1,
  });
  const completed = syncQueue(recordReview(active, 3), {
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 0,
  });

  assert.equal(completed.status, STUDY_SESSION_STATUS.COMPLETED);
  assert.equal(isStudyCompleted(completed), true);
  assert.equal(isInitialStudyEmpty(completed, false, 0), false);
});

test('completion action phụ thuộc mode và số thẻ retry', () => {
  assert.equal(getStudyCompletionAction({
    mode: STUDY_MODE.MAIN,
    retryCardsCount: 3,
  }), 'continue-retry');
  assert.equal(getStudyCompletionAction({
    mode: STUDY_MODE.MAIN,
    retryCardsCount: 0,
  }), 'choose-deck');
  assert.equal(getStudyCompletionAction({
    mode: STUDY_MODE.RETRY,
    retryCardsCount: 0,
  }), 'finish');
  assert.equal(getStudyCompletionAction({
    mode: STUDY_MODE.NEW,
    retryCardsCount: 2,
  }), 'continue-retry');
  assert.equal(getStudyCompletionAction({
    mode: STUDY_MODE.NEW,
    retryCardsCount: 0,
  }), 'choose-deck');
});

test('new quality 1 hoàn thành thẻ giống vòng chính', () => {
  const initial = createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.NEW,
    cardCount: 3,
  });
  const next = recordReview(initial, 1);

  assert.equal(next.attemptCount, 1);
  assert.equal(next.againCount, 1);
  assert.equal(next.completedCardCount, 1);
  assert.equal(next.rememberedCount, 0);
});

test('hàng đợi có thẻ mới sau completion bắt đầu một session mới', () => {
  const active = createStudySessionState({
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 1,
  });
  const completed = syncQueue(recordReview(active, 3), {
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 0,
  });
  const restarted = syncQueue(completed, {
    deckId: 'deck-1',
    mode: STUDY_MODE.MAIN,
    cardCount: 2,
  });

  assert.equal(restarted.status, STUDY_SESSION_STATUS.ACTIVE);
  assert.equal(restarted.initialCardCount, 2);
  assert.equal(restarted.attemptCount, 0);
});
