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
  default: ({ children, onOpenReview }) => (
    <>
      <button type="button" onClick={onOpenReview}>Mở ôn tập</button>
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
