import { useState } from 'react';
import {
  Brain,
  Check,
  CheckCheck,
  Edit2,
  Eye,
  EyeOff,
  FlipHorizontal2,
  RotateCcw,
  ThumbsUp,
  Trash2,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import {
  getCardSpeechText,
  getExampleSpeechText,
} from '../utils/cardContentUtils';

const ReviewCard = ({
  card,
  isFlipped,
  setIsFlipped,
  isEditing,
  setIsEditing,
  isPronunciationVisible,
  onTogglePronunciation,
  onReview,
  onEdit,
  onDelete,
  reviewMode = 'main', // 'main' hoặc 'retry'
  currentDeckLanguage = 'ja-JP',
}) => {
  const [editFront, setEditFront] = useState(card.front);
  const [editBack, setEditBack] = useState(card.back);
  const pronunciation = card.pronunciation?.trim() || '';
  const examples = Array.isArray(card.examples)
    ? card.examples.filter((example) => example?.text?.trim())
    : [];

  const handleFlip = () => {
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleScore = (e, score) => {
    e.stopPropagation();
    onReview(card._id, score);
  };

  const handleFlipAction = (e) => {
    e.stopPropagation();
    handleFlip();
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakText(getCardSpeechText(card, currentDeckLanguage), currentDeckLanguage);
  };

  const handleSpeakExample = (e, example) => {
    e.stopPropagation();
    speakText(getExampleSpeechText(example), currentDeckLanguage);
  };

  const handleTogglePronunciation = (e) => {
    e.stopPropagation();
    onTogglePronunciation?.();
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditFront(card.front);
    setEditBack(card.back);
    setIsEditing(true);
    setIsFlipped(false); // Đảm bảo lật về mặt trước để edit
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditFront(card.front);
    setEditBack(card.back);
    setIsEditing(false);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    onEdit(card._id, editFront, editBack);
    setIsEditing(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(card._id);
  };

  return (
    <div className="review-card">
      <div
        className={`flashcard-container${isEditing ? ' is-editing' : ''}`}
        onClick={handleFlip}
      >
        {!isEditing && (
          <button
            type="button"
            className="flashcard-flip-target"
            onClick={handleFlip}
            aria-label={isFlipped ? 'Lật về mặt trước' : 'Lật thẻ để xem nghĩa'}
            title="Lật thẻ (Space)"
            aria-keyshortcuts="Space"
          />
        )}
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          
          {/* Mặt trước */}
          <div className="flashcard-face flashcard-front" aria-hidden={isFlipped && !isEditing}>
            {!isEditing && (
              <div className="flashcard-tools">
                <button 
                  type="button"
                  className="flashcard-tool-btn flashcard-tool-btn--speak"
                  onClick={handleSpeak} 
                  title="Đọc từ vựng (Phím V)"
                  aria-label="Đọc từ vựng"
                  tabIndex={isFlipped ? -1 : 0}
                  disabled={isFlipped}
                >
                  <Volume2 size={20} aria-hidden="true" />
                </button>
                <button 
                  type="button"
                  className="flashcard-tool-btn flashcard-tool-btn--delete"
                  onClick={handleDeleteClick} 
                  title="Xoá thẻ"
                  aria-label="Xoá thẻ"
                  tabIndex={isFlipped ? -1 : 0}
                  disabled={isFlipped}
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
                <button 
                  type="button"
                  className="flashcard-tool-btn flashcard-tool-btn--edit"
                  onClick={handleEditClick} 
                  title="Chỉnh sửa"
                  aria-label="Chỉnh sửa thẻ"
                  tabIndex={isFlipped ? -1 : 0}
                  disabled={isFlipped}
                >
                  <Edit2 size={20} aria-hidden="true" />
                </button>
              </div>
            )}
            
            {isEditing ? (
              <div onClick={e => e.stopPropagation()} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Chỉnh sửa thẻ</span>
                <textarea 
                  className="form-control" 
                  value={editFront} 
                  onChange={e => setEditFront(e.target.value)} 
                  rows="2"
                  placeholder="Từ vựng..."
                  style={{ padding: '0.75rem', resize: 'vertical' }}
                />
                <textarea 
                  className="form-control" 
                  value={editBack} 
                  onChange={e => setEditBack(e.target.value)} 
                  rows="3"
                  placeholder="Ý nghĩa..."
                  style={{ padding: '0.75rem', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <button className="btn btn-success" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleSaveEdit}>
                    <Check size={18} /> Lưu
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleCancelEdit}>
                    <X size={18} /> Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="flashcard-label">Từ vựng</span>
                <div className="flashcard-content flashcard-content--front">
                  <div className="flashcard-term">{card.front}</div>
                  {pronunciation && isPronunciationVisible && (
                    <div className="flashcard-pronunciation">{pronunciation}</div>
                  )}
                </div>
                <div className="flashcard-front-actions">
                  {pronunciation && (
                    <button
                      type="button"
                      className="flashcard-pronunciation-toggle"
                      onClick={handleTogglePronunciation}
                      aria-keyshortcuts="G"
                      aria-pressed={isPronunciationVisible}
                      aria-label={isPronunciationVisible ? 'Ẩn cách đọc' : 'Hiện cách đọc'}
                      title={isPronunciationVisible ? 'Ẩn cách đọc (G)' : 'Hiện cách đọc (G)'}
                      tabIndex={isFlipped ? -1 : 0}
                      disabled={isFlipped}
                    >
                      {isPronunciationVisible
                        ? <EyeOff size={18} aria-hidden="true" />
                        : <Eye size={18} aria-hidden="true" />}
                      {isPronunciationVisible ? 'Ẩn cách đọc' : 'Hiện cách đọc'}
                      <span className="flashcard-pronunciation-toggle__shortcut" aria-hidden="true">G</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="flashcard-flip-action"
                    onClick={handleFlipAction}
                    aria-keyshortcuts="Space"
                    disabled={isFlipped}
                  >
                    <FlipHorizontal2 size={19} aria-hidden="true" />
                    Lật thẻ (Hiện nghĩa)
                  </button>
                </div>
                <div className="flashcard-flip-hint">Chạm để lật</div>
              </>
            )}
          </div>
          
          {/* Mặt sau */}
          <div className="flashcard-face flashcard-back" aria-hidden={!isFlipped || isEditing}>
            <div className="flashcard-tools flashcard-tools--back">
              <button
                type="button"
                className="flashcard-tool-btn flashcard-tool-btn--speak"
                onClick={handleSpeak}
                title="Đọc từ vựng (Phím V)"
                aria-label="Đọc từ vựng"
                tabIndex={isFlipped && !isEditing ? 0 : -1}
                disabled={!isFlipped || isEditing}
              >
                <Volume2 size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="flashcard-content flashcard-content--answer">
              <header className="flashcard-answer__term">
                <div className="flashcard-term">{card.front}</div>
                {pronunciation && (
                  <div className="flashcard-pronunciation">{pronunciation}</div>
                )}
              </header>

              <section className="flashcard-answer__section">
                <h3>Nghĩa</h3>
                <div className="flashcard-answer__meaning">{card.back}</div>
              </section>

              {examples.length > 0 && (
                <section className="flashcard-answer__section flashcard-answer__examples">
                  <h3>Ví dụ</h3>
                  <div className="flashcard-example-list">
                    {examples.map((example, index) => (
                      <article key={`${example.text}-${index}`} className="flashcard-example">
                        <div className="flashcard-example__source">
                          <p>{example.text}</p>
                          <button
                            type="button"
                            className="flashcard-example__speak"
                            onClick={(event) => handleSpeakExample(event, example)}
                            aria-label={`Đọc ví dụ ${index + 1}`}
                            title={`Đọc ví dụ ${index + 1}`}
                            tabIndex={isFlipped && !isEditing ? 0 : -1}
                            disabled={!isFlipped || isEditing}
                          >
                            <Volume2 size={18} aria-hidden="true" />
                          </button>
                        </div>
                        {example.translation?.trim() && (
                          <p className="flashcard-example__translation">
                            {example.translation}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFlipped && !isEditing && (
        <div className="review-controls">
          {reviewMode === 'retry' ? (
            // Chế độ bò nhai cỏ: chỉ 2 nút
            <>
              <button className="btn btn-danger review-score" onClick={(e) => handleScore(e, 1)} title="Chưa nhớ" aria-keyshortcuts="A">
                <span className="review-score__icon" aria-hidden="true"><RotateCcw size={20} /></span>
                <span className="review-score__label review-score__label--desktop">Chưa nhớ (Again)</span>
                <span className="review-score__label review-score__label--mobile">Chưa nhớ</span>
                <span className="review-score__shortcut" aria-hidden="true">A</span>
              </button>
              <button className="btn btn-success review-score" onClick={(e) => handleScore(e, 3)} title="Đã nhớ" aria-keyshortcuts="F">
                <span className="review-score__icon" aria-hidden="true"><CheckCheck size={21} /></span>
                <span className="review-score__label review-score__label--desktop">Đã nhớ (Good)</span>
                <span className="review-score__label review-score__label--mobile">Đã nhớ</span>
                <span className="review-score__shortcut" aria-hidden="true">F</span>
              </button>
            </>
          ) : (
            // Chế độ ôn tập chính: 4 nút
            <>
              <button className="btn btn-danger review-score" onClick={(e) => handleScore(e, 1)} title="Lại" aria-keyshortcuts="A">
                <span className="review-score__icon" aria-hidden="true"><RotateCcw size={20} /></span>
                <span className="review-score__label review-score__label--desktop">Lại (Again)</span>
                <span className="review-score__label review-score__label--mobile">Lại</span>
                <span className="review-score__shortcut" aria-hidden="true">A</span>
              </button>
              <button className="btn btn-warning review-score" onClick={(e) => handleScore(e, 2)} title="Khó" aria-keyshortcuts="S">
                <span className="review-score__icon" aria-hidden="true"><Brain size={21} /></span>
                <span className="review-score__label review-score__label--desktop">Khó (Hard)</span>
                <span className="review-score__label review-score__label--mobile">Khó</span>
                <span className="review-score__shortcut" aria-hidden="true">S</span>
              </button>
              <button className="btn btn-info review-score" onClick={(e) => handleScore(e, 3)} title="Tốt" aria-keyshortcuts="D">
                <span className="review-score__icon" aria-hidden="true"><ThumbsUp size={21} /></span>
                <span className="review-score__label review-score__label--desktop">Tốt (Good)</span>
                <span className="review-score__label review-score__label--mobile">Tốt</span>
                <span className="review-score__shortcut" aria-hidden="true">D</span>
              </button>
              <button className="btn btn-success review-score" onClick={(e) => handleScore(e, 4)} title="Dễ" aria-keyshortcuts="F">
                <span className="review-score__icon" aria-hidden="true"><Zap size={21} /></span>
                <span className="review-score__label review-score__label--desktop">Dễ (Easy)</span>
                <span className="review-score__label review-score__label--mobile">Dễ</span>
                <span className="review-score__shortcut" aria-hidden="true">F</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
