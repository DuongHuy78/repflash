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

const cardWithExamples = {
  ...card,
  examples: [
    { text: '覚悟を決める。', translation: 'Hạ quyết tâm.', ttsText: 'かくごをきめる。' },
    { text: '覚悟はいいか。', translation: 'Sẵn sàng chưa?', ttsText: 'かくごはいいか。' },
  ],
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

test('không tự cuộn xuống ví dụ khi thẻ chưa lật dù activeExampleIndex khác null', () => {
  const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});

  renderReviewCard({
    card: cardWithExamples,
    isFlipped: false,
    activeExampleIndex: 0,
  });

  expect(scrollIntoViewSpy).not.toHaveBeenCalled();
});

test('đặt lại vị trí cuộn mặt sau về đầu khi lật sang mặt sau', () => {
  const { rerender } = render(
    <ReviewCard
      card={cardWithExamples}
      isFlipped
      setIsFlipped={vi.fn()}
      isEditing={false}
      setIsEditing={vi.fn()}
      isPronunciationVisible={false}
      onTogglePronunciation={vi.fn()}
      onReview={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onSpeakCard={vi.fn()}
      onSpeakExample={vi.fn()}
    />,
  );

  const answerContent = document.querySelector('.flashcard-content--answer');
  answerContent.scrollTop = 180;

  rerender(
    <ReviewCard
      card={cardWithExamples}
      isFlipped={false}
      setIsFlipped={vi.fn()}
      isEditing={false}
      setIsEditing={vi.fn()}
      isPronunciationVisible={false}
      onTogglePronunciation={vi.fn()}
      onReview={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onSpeakCard={vi.fn()}
      onSpeakExample={vi.fn()}
    />,
  );
  rerender(
    <ReviewCard
      card={cardWithExamples}
      isFlipped
      setIsFlipped={vi.fn()}
      isEditing={false}
      setIsEditing={vi.fn()}
      isPronunciationVisible={false}
      onTogglePronunciation={vi.fn()}
      onReview={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onSpeakCard={vi.fn()}
      onSpeakExample={vi.fn()}
    />,
  );

  expect(answerContent.scrollTop).toBe(0);
});

test('cuộn tới ví dụ đang đọc khi đã lật mặt sau', () => {
  const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});

  renderReviewCard({
    card: cardWithExamples,
    isFlipped: true,
    activeExampleIndex: 1,
  });

  expect(scrollIntoViewSpy).toHaveBeenCalledOnce();
  expect(scrollIntoViewSpy.mock.instances[0]).toHaveAttribute('aria-current', 'true');
  expect(scrollIntoViewSpy.mock.instances[0]).toHaveTextContent('覚悟はいいか。');
});
