import { useState } from 'react';
import { Edit2, Check, X, Trash2, Volume2 } from 'lucide-react';
import { speakText } from '../utils/speechUtils';

const ReviewCard = ({
  card,
  isFlipped,
  setIsFlipped,
  isEditing,
  setIsEditing,
  onReview,
  onEdit,
  onDelete,
  reviewMode = 'main', // 'main' hoặc 'retry'
  currentDeckLanguage = 'ja-JP',
}) => {
  const [editFront, setEditFront] = useState(card.front);
  const [editBack, setEditBack] = useState(card.back);

  const handleFlip = () => {
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleScore = (e, score) => {
    e.stopPropagation();
    onReview(card._id, score);
    setIsFlipped(false); // Reset for next card
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakText(card.front, currentDeckLanguage);
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
    <div>
      <div
        className={`flashcard-container${isEditing ? ' is-editing' : ''}`}
        onClick={handleFlip}
      >
        {!isEditing && (
          <button
            type="button"
            className="flashcard-flip-target"
            onClick={handleFlip}
            aria-label={isFlipped ? 'Thẻ đã lật, xem nghĩa' : 'Lật thẻ để xem nghĩa'}
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
                  className="flashcard-tool-btn"
                  onClick={handleSpeak} 
                  title="Đọc từ vựng (Phím V)"
                  aria-label="Đọc từ vựng"
                >
                  <Volume2 size={20} aria-hidden="true" />
                </button>
                <button 
                  type="button"
                  className="flashcard-tool-btn flashcard-tool-btn--delete"
                  onClick={handleDeleteClick} 
                  title="Xoá thẻ"
                  aria-label="Xoá thẻ"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
                <button 
                  type="button"
                  className="flashcard-tool-btn"
                  onClick={handleEditClick} 
                  title="Chỉnh sửa"
                  aria-label="Chỉnh sửa thẻ"
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
                <div className="flashcard-content">{card.front}</div>
                <div className="flashcard-flip-hint">Chạm để lật</div>
              </>
            )}
          </div>
          
          {/* Mặt sau */}
          <div className="flashcard-face flashcard-back" aria-hidden={!isFlipped || isEditing}>
            <span className="flashcard-label">Nghĩa</span>
            <div className="flashcard-content">{card.back}</div>
          </div>
        </div>
      </div>

      {isFlipped && !isEditing && (
        <div className="review-controls">
          {reviewMode === 'retry' ? (
            // Chế độ bò nhai cỏ: chỉ 2 nút
            <>
              <button className="btn btn-danger review-score" onClick={(e) => handleScore(e, 1)} title="Chưa nhớ (A)" aria-keyshortcuts="A">
                <span className="review-score__label review-score__label--desktop">Chưa nhớ (Again)</span>
                <span className="review-score__label review-score__label--mobile">Chưa nhớ</span>
                <span className="review-score__shortcut" aria-hidden="true">A</span>
              </button>
              <button className="btn btn-success review-score" onClick={(e) => handleScore(e, 3)} title="Đã nhớ (F)" aria-keyshortcuts="F">
                <span className="review-score__label review-score__label--desktop">Đã nhớ (Good)</span>
                <span className="review-score__label review-score__label--mobile">Đã nhớ</span>
                <span className="review-score__shortcut" aria-hidden="true">F</span>
              </button>
            </>
          ) : (
            // Chế độ ôn tập chính: 4 nút
            <>
              <button className="btn btn-danger review-score" onClick={(e) => handleScore(e, 1)} title="Lại (A)" aria-keyshortcuts="A">
                <span className="review-score__label review-score__label--desktop">Lại (Again)</span>
                <span className="review-score__label review-score__label--mobile">Lại</span>
                <span className="review-score__shortcut" aria-hidden="true">A</span>
              </button>
              <button className="btn btn-warning review-score" onClick={(e) => handleScore(e, 2)} title="Khó (S)" aria-keyshortcuts="S">
                <span className="review-score__label review-score__label--desktop">Khó (Hard)</span>
                <span className="review-score__label review-score__label--mobile">Khó</span>
                <span className="review-score__shortcut" aria-hidden="true">S</span>
              </button>
              <button className="btn btn-info review-score" onClick={(e) => handleScore(e, 3)} title="Tốt (D)" aria-keyshortcuts="D">
                <span className="review-score__label review-score__label--desktop">Tốt (Good)</span>
                <span className="review-score__label review-score__label--mobile">Tốt</span>
                <span className="review-score__shortcut" aria-hidden="true">D</span>
              </button>
              <button className="btn btn-success review-score" onClick={(e) => handleScore(e, 4)} title="Dễ (F)" aria-keyshortcuts="F">
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
