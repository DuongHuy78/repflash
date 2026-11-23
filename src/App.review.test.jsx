import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('axios', () => {
  const axios = {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      response: {
        use: vi.fn(() => 1),
        eject: vi.fn(),
      },
    },
  };

  return { default: axios };
});

vi.mock('./components/DesktopAppShell', () => ({
  default: ({ children, onOpenReview, onOpenNew, onOpenRetry }) => (
    <>
      <button type="button" onClick={onOpenReview}>Mở ôn tập</button>
      <button type="button" onClick={onOpenNew}>Mở từ mới</button>
      <button type="button" onClick={onOpenRetry}>Mở bò nhai cỏ</button>
      {children}
    </>
  ),
}));

vi.mock('./components/AddCardsPanel', () => ({
  default: () => null,
}));

import axios from 'axios';
import App from './App';

const deck = {
  _id: 'deck-1',
  deckName: 'Tiếng Nhật',
  language: 'ja-JP',
};

const card = {
  _id: 'card-1',
  front: '覚悟',
  back: 'Quyết tâm',
  pronunciation: 'かくご',
  examples: [],
};

const cardWithExamples1 = {
  _id: 'card-ex-1',
  front: '覚悟',
  back: 'Quyết tâm',
  pronunciation: 'かくご',
  examples: [
    { text: '覚悟を決めて挑戦する。', translation: 'Quyết tâm thử thách.', ttsText: '' },
    { text: '覚悟ができている。', translation: 'Đã sẵn sàng.', ttsText: '' },
  ],
};

const cardWithExamples2 = {
  _id: 'card-ex-2',
  front: '努力',
  back: 'Nỗ lực',
  pronunciation: 'どりょく',
  examples: [
    { text: '毎日努力を続ける。', translation: 'Mỗi ngày tiếp tục nỗ lực.', ttsText: '' },
    { text: '努力は裏切らない。', translation: 'Nỗ lực không phản bội bạn.', ttsText: '' },
  ],
};

const originalSpeechSynthesisDescriptor = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
const originalSpeechUtteranceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance');

const installSpeechSynthesisMock = () => {
  const speechMock = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    writable: true,
    value: speechMock,
  });
  globalThis.SpeechSynthesisUtterance = class MockUtterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.onend = null;
      this.onerror = null;
    }
  };
  return speechMock;
};

const restoreSpeechSynthesisMock = () => {
  if (originalSpeechSynthesisDescriptor) {
    Object.defineProperty(window, 'speechSynthesis', originalSpeechSynthesisDescriptor);
  } else {
    delete window.speechSynthesis;
  }

  if (originalSpeechUtteranceDescriptor) {
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', originalSpeechUtteranceDescriptor);
  } else {
    delete globalThis.SpeechSynthesisUtterance;
  }
};

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const mockBootstrapRequests = () => {
  axios.get.mockImplementation((url) => {
    if (url === '/api/user/me') {
      return Promise.resolve({ data: { _id: 'user-1', username: 'learner', currentStreak: 0 } });
    }
    if (url === '/api/decks') {
      return Promise.resolve({ data: [deck] });
    }
    if (url === '/api/cards/retry') {
      return Promise.resolve({ data: [] });
    }
    if (url === '/api/cards') {
      return Promise.resolve({ data: [card] });
    }

    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
};

const openFlippedReviewCard = async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Mở ôn tập' }));
  await user.click(await screen.findByRole('button', { name: 'Lật thẻ để xem nghĩa' }));

  return user;
};

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('currentDeck', deck._id);
  mockBootstrapRequests();
});

afterEach(() => {
  axios.get.mockReset();
  axios.put.mockReset();
  restoreSpeechSynthesisMock();
});

test('double-click rating chỉ gửi một request review khi request đầu đang chờ', async () => {
  const reviewRequest = createDeferred();
  axios.put.mockReturnValue(reviewRequest.promise);
  const user = await openFlippedReviewCard();

  await user.dblClick(screen.getByRole('button', { name: /tốt/i }));

  expect(axios.put).toHaveBeenCalledOnce();
  expect(axios.put).toHaveBeenCalledWith('/api/cards/card-1/review', { quality: 3 });
  expect(screen.getByRole('status')).toHaveTextContent('Đang lưu đánh giá');
  expect(screen.getByRole('button', { name: /tốt/i })).toBeDisabled();

  reviewRequest.resolve({ data: { card: { ...card }, currentStreak: 1 } });
  expect(await screen.findByRole('heading', { name: 'Hoàn thành phiên ôn tập!' })).toBeInTheDocument();
});

test('click rating rồi nhấn phím tắt không gửi request thứ hai', async () => {
  const reviewRequest = createDeferred();
  axios.put.mockReturnValue(reviewRequest.promise);
  const user = await openFlippedReviewCard();

  await user.click(screen.getByRole('button', { name: /tốt/i }));
  await user.keyboard('d');

  expect(axios.put).toHaveBeenCalledOnce();

  reviewRequest.resolve({ data: { card: { ...card }, currentStreak: 1 } });
  await screen.findByRole('heading', { name: 'Hoàn thành phiên ôn tập!' });
});

test('lỗi review giữ nguyên thẻ, báo lỗi và cho phép thử lại', async () => {
  axios.put
    .mockRejectedValueOnce({ response: { data: { message: 'Không thể lưu lúc này.' } } })
    .mockResolvedValueOnce({ data: { card: { ...card }, currentStreak: 1 } });
  const user = await openFlippedReviewCard();

  await user.click(screen.getByRole('button', { name: /tốt/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu lúc này.');
  expect(screen.getByText('Quyết tâm')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /tốt/i })).toBeEnabled();

  await user.click(screen.getByRole('button', { name: /tốt/i }));
  expect(axios.put).toHaveBeenCalledTimes(2);
});

test('Ôn tập: đọc ví dụ thẻ trước chưa kết thúc vẫn không cuộn xuống ví dụ ở thẻ sau', async () => {
  const speechMock = installSpeechSynthesisMock();
  const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  axios.get.mockImplementation((url) => {
    if (url === '/api/user/me') {
      return Promise.resolve({ data: { _id: 'user-1', username: 'learner', currentStreak: 0 } });
    }
    if (url === '/api/decks') {
      return Promise.resolve({ data: [deck] });
    }
    if (url === '/api/cards/retry') {
      return Promise.resolve({ data: [] });
    }
    if (url === '/api/cards') {
      return Promise.resolve({ data: [cardWithExamples1, cardWithExamples2] });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
  axios.put.mockResolvedValueOnce({ data: { card: { ...cardWithExamples1 }, currentStreak: 1 } });

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Mở ôn tập' }));
  await user.click(await screen.findByRole('button', { name: 'Lật thẻ để xem nghĩa' }));

  scrollIntoViewSpy.mockClear();
  await user.keyboard('v');
  expect(speechMock.speak).toHaveBeenCalledOnce();
  expect(scrollIntoViewSpy).toHaveBeenCalledOnce();

  scrollIntoViewSpy.mockClear();
  speechMock.cancel.mockClear();
  await user.click(screen.getByRole('button', { name: /tốt/i }));

  expect(await screen.findAllByText('努力')).toHaveLength(2);
  expect(speechMock.cancel).toHaveBeenCalled();
  expect(scrollIntoViewSpy).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Lật thẻ để xem nghĩa' }));
  expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  expect(document.querySelector('.flashcard-content--answer').scrollTop).toBe(0);
  expect(document.querySelector('.flashcard-example[aria-current="true"]')).toBeNull();
});

test('Từ mới: đọc ví dụ thẻ trước rồi sang thẻ mới vẫn hiển thị mặt sau từ đầu', async () => {
  installSpeechSynthesisMock();
  const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  axios.get.mockImplementation((url) => {
    if (url === '/api/user/me') {
      return Promise.resolve({ data: { _id: 'user-1', username: 'learner', currentStreak: 0 } });
    }
    if (url === '/api/decks') {
      return Promise.resolve({ data: [deck] });
    }
    if (url === '/api/cards/retry') {
      return Promise.resolve({ data: [] });
    }
    if (url === '/api/cards/new') {
      return Promise.resolve({
        data: {
          cards: [cardWithExamples1, cardWithExamples2],
          limit: 20,
          usedToday: 0,
          remainingQuota: 20,
          totalNew: 2,
        },
      });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
  axios.put.mockResolvedValueOnce({ data: { card: { ...cardWithExamples1 }, currentStreak: 1 } });

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Mở từ mới' }));
  await user.click(await screen.findByRole('button', { name: 'Lật thẻ để xem nghĩa' }));

  await user.keyboard('v');
  scrollIntoViewSpy.mockClear();

  await user.click(screen.getByRole('button', { name: /tốt/i }));
  expect(await screen.findAllByText('努力')).toHaveLength(2);
  expect(scrollIntoViewSpy).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Lật thẻ để xem nghĩa' }));
  expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  expect(document.querySelector('.flashcard-content--answer').scrollTop).toBe(0);
  expect(document.querySelector('.flashcard-example[aria-current="true"]')).toBeNull();
});

test('Bò nhai cỏ còn 1 thẻ: bấm Chưa nhớ rồi lật lại vẫn về đầu mặt sau và xóa highlight ví dụ', async () => {
  const speechMock = installSpeechSynthesisMock();
  const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  axios.get.mockImplementation((url) => {
    if (url === '/api/user/me') {
      return Promise.resolve({ data: { _id: 'user-1', username: 'learner', currentStreak: 0 } });
    }
    if (url === '/api/decks') {
      return Promise.resolve({ data: [deck] });
    }
    if (url === '/api/cards/retry') {
      return Promise.resolve({ data: [cardWithExamples1] });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
  axios.put.mockResolvedValueOnce({ data: { card: { ...cardWithExamples1 }, currentStreak: 1 } });

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Mở bò nhai cỏ' }));
  await user.click(await screen.findByRole('button', { name: 'Lật thẻ để xem nghĩa' }));

  await user.keyboard('v');
  const answerContent = document.querySelector('.flashcard-content--answer');
  answerContent.scrollTop = 160;
  scrollIntoViewSpy.mockClear();
  speechMock.cancel.mockClear();

  await user.click(screen.getByRole('button', { name: /chưa nhớ/i }));
  expect(speechMock.cancel).toHaveBeenCalled();
  expect(scrollIntoViewSpy).not.toHaveBeenCalled();

  await user.click(await screen.findByRole('button', { name: 'Lật thẻ để xem nghĩa' }));
  expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  expect(document.querySelector('.flashcard-content--answer').scrollTop).toBe(0);
  expect(document.querySelector('.flashcard-example[aria-current="true"]')).toBeNull();
});
