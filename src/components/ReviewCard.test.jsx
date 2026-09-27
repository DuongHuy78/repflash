import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import ReviewCard from './ReviewCard';

const card = {
  _id: 'card-1',
  front: '覚悟',
  back: 'Quyết tâm',
  pronunciation: 'かくご',
  examples: [],
};

const renderReviewCard = (props = {}) => {
  const onReview = vi.fn();

  render(
    <ReviewCard
      card={card}
      isFlipped
      setIsFlipped={vi.fn()}
      isEditing={false}
      setIsEditing={vi.fn()}
      isPronunciationVisible={false}
      onTogglePronunciation={vi.fn()}
      onReview={onReview}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onSpeakCard={vi.fn()}
      onSpeakExample={vi.fn()}
      {...props}
    />,
  );

  return { onReview };
};

test('rating Main hiển thị đủ bốn mức đánh giá', () => {
  renderReviewCard();

  expect(screen.getByRole('button', { name: /lại/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /khó/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /tốt/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /dễ/i })).toBeInTheDocument();
});

test('rating Retry chỉ hiển thị Chưa nhớ và Đã nhớ', () => {
  renderReviewCard({ reviewMode: 'retry' });

  expect(screen.getByRole('button', { name: /chưa nhớ/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /đã nhớ/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^khó/i })).not.toBeInTheDocument();
});

test('click Tốt gọi review với card id và quality đúng', async () => {
  const user = userEvent.setup();
  const { onReview } = renderReviewCard();

  await user.click(screen.getByRole('button', { name: /tốt/i }));

  expect(onReview).toHaveBeenCalledOnce();
  expect(onReview).toHaveBeenCalledWith('card-1', 3);
});

test('đang lưu khóa toàn bộ rating và công bố trạng thái', () => {
  renderReviewCard({ isReviewing: true });

  for (const name of [/lại/i, /khó/i, /tốt/i, /dễ/i]) {
    expect(screen.getByRole('button', { name })).toBeDisabled();
  }
  expect(screen.getByRole('status')).toHaveTextContent('Đang lưu đánh giá');
});

test('lỗi review được công bố cho người dùng', () => {
  renderReviewCard({ reviewError: 'Không thể lưu đánh giá.' });

  expect(screen.getByRole('alert')).toHaveTextContent('Không thể lưu đánh giá.');
});
