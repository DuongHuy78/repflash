import { useState } from 'react';
import { Edit2, Check, X, Trash2, Volume2 } from 'lucide-react';

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
  currentDeck,
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.front);
      if (currentDeck === 'japanese') {
        utterance.lang = 'ja-JP';
      } else if (currentDeck === 'english') {
        utterance.lang = 'en-US';
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Trình duyệt không hỗ trợ đọc văn bản.");
    }
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
        className={`flashcard-container`}
        onClick={handleFlip}
        title="Lật thẻ (Space)"
        aria-keyshortcuts="Space"
      >
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          
          {/* Mặt trước */}
          <div className="flashcard-face flashcard-front">
            {!isEditing && (
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handleSpeak} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="Đọc từ vựng (Phím V)"
                >
                  <Volume2 size={20} />
                </button>
                <button 
                  onClick={handleDeleteClick} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="Xoá thẻ"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={handleEditClick} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="Chỉnh sửa"
                >
                  <Edit2 size={20} />
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
                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Nhấn để lật
                </div>
              </>
            )}
          </div>
          
          {/* Mặt sau */}
          <div className="flashcard-face flashcard-back">
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
              <button className="btn btn-danger" onClick={(e) => handleScore(e, 1)} title="Chưa nhớ (A)" aria-keyshortcuts="A">
                Chưa nhớ (Again)
              </button>
              <button className="btn btn-success" onClick={(e) => handleScore(e, 3)} title="Đã nhớ (F)" aria-keyshortcuts="F">
                Đã nhớ (Good)
              </button>
            </>
          ) : (
            // Chế độ ôn tập chính: 4 nút
            <>
              <button className="btn btn-danger" onClick={(e) => handleScore(e, 1)} title="Lại (A)" aria-keyshortcuts="A">Lại (Again)</button>
              <button className="btn btn-warning" onClick={(e) => handleScore(e, 2)} title="Khó (S)" aria-keyshortcuts="S">Khó (Hard)</button>
              <button className="btn btn-info" onClick={(e) => handleScore(e, 3)} title="Tốt (D)" aria-keyshortcuts="D">Tốt (Good)</button>
              <button className="btn btn-success" onClick={(e) => handleScore(e, 4)} title="Dễ (F)" aria-keyshortcuts="F">Dễ (Easy)</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
