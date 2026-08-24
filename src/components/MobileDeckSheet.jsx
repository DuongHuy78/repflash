import { useId, useRef } from 'react';
import {
  Check,
  CheckCircle2,
  Folder,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FALLBACK_DECK_LANGUAGES } from '../constants/deckLanguages';
import useDialogFocus from '../hooks/useDialogFocus';

const MobileDeckSheet = ({
  open,
  returnFocusRef,
  decks,
  currentDeck,
  showAddDeck,
  onToggleAddDeck,
  newDeckName,
  onNewDeckNameChange,
  newDeckLanguage,
  onNewDeckLanguageChange,
  availableLanguages,
  onCreateDeck,
  editingDeckId,
  editingDeckName,
  onEditingDeckNameChange,
  onCancelRenameDeck,
  onSaveRenameDeck,
  onStartRenameDeck,
  onDeleteDeck,
  onSelectDeck,
  onClose,
}) => {
  const dialogRef = useRef(null);
  const idPrefix = useId();
  const languages = availableLanguages?.length > 0
    ? availableLanguages
    : FALLBACK_DECK_LANGUAGES;

  useDialogFocus({
    open,
    dialogRef,
    onClose,
    returnFocusRef,
  });

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="mobile-deck-sheet-backdrop"
        onClick={onClose}
        aria-label="Đóng danh sách học phần"
        tabIndex={-1}
      />
      <section
        ref={dialogRef}
        id="mobile-deck-sheet"
        className="mobile-deck-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idPrefix}-title`}
        tabIndex="-1"
      >
        <div className="mobile-deck-sheet__handle" aria-hidden="true" />
        <header className="mobile-deck-sheet__header">
          <div>
            <h2 id={`${idPrefix}-title`}>Chọn học phần</h2>
            <p>{decks.length} học phần</p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close"
            onClick={onClose}
            aria-label="Đóng danh sách học phần"
            title="Đóng"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <button
          type="button"
          className="btn btn-primary mobile-deck-sheet__create-toggle"
          onClick={onToggleAddDeck}
          aria-expanded={showAddDeck}
          aria-controls={`${idPrefix}-create-form`}
        >
          <Plus size={19} aria-hidden="true" />
          {showAddDeck ? 'Đóng form tạo học phần' : 'Tạo học phần mới'}
        </button>

        {showAddDeck && (
          <form
            id={`${idPrefix}-create-form`}
            className="mobile-deck-create-form"
            onSubmit={onCreateDeck}
          >
            <div className="form-group">
              <label htmlFor={`${idPrefix}-deck-name`}>Tên học phần</label>
              <input
                id={`${idPrefix}-deck-name`}
                type="text"
                className="form-control"
                value={newDeckName}
                onChange={(event) => onNewDeckNameChange(event.target.value)}
                placeholder="Ví dụ: JLPT N2"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`${idPrefix}-deck-language`}>Ngôn ngữ phát âm</label>
              <select
                id={`${idPrefix}-deck-language`}
                className="form-control"
                value={newDeckLanguage}
                onChange={(event) => onNewDeckLanguageChange(event.target.value)}
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Tạo học phần
            </button>
          </form>
        )}

        <div className="mobile-deck-sheet__list">
          {decks.length === 0 ? (
            <div className="mobile-deck-sheet__empty">
              <Folder size={28} aria-hidden="true" />
              <strong>Chưa có học phần</strong>
              <p>Hãy tạo học phần đầu tiên để bắt đầu thêm thẻ.</p>
            </div>
          ) : (
            decks.map((deck) => {
              const isActive = currentDeck === deck._id;
              const isEditing = editingDeckId === deck._id;

              return (
                <article
                  key={deck._id}
                  className={`mobile-deck-card${isActive ? ' active' : ''}`}
                >
                  {isEditing ? (
                    <div className="mobile-deck-card__rename">
                      <label className="sr-only" htmlFor={`${idPrefix}-rename-${deck._id}`}>
                        Đổi tên học phần {deck.deckName}
                      </label>
                      <input
                        id={`${idPrefix}-rename-${deck._id}`}
                        type="text"
                        className="form-control"
                        value={editingDeckName}
                        onChange={(event) => onEditingDeckNameChange(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            onSaveRenameDeck(deck._id, deck.deckName);
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            onCancelRenameDeck();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="mobile-deck-card__action"
                        onClick={() => onSaveRenameDeck(deck._id, deck.deckName)}
                        aria-label={`Lưu tên học phần ${deck.deckName}`}
                      >
                        <Check size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="mobile-deck-card__action"
                        onClick={onCancelRenameDeck}
                        aria-label="Hủy đổi tên học phần"
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="mobile-deck-card__select"
                        onClick={() => onSelectDeck(deck._id)}
                        aria-pressed={isActive}
                      >
                        <span className="mobile-deck-card__icon" aria-hidden="true">
                          <Folder size={22} />
                        </span>
                        <span className="mobile-deck-card__content">
                          <strong>{deck.deckName}</strong>
                          <small>{deck.language || 'Chưa đặt ngôn ngữ'}</small>
                        </span>
                        {isActive && (
                          <span className="mobile-deck-card__selected">
                            <CheckCircle2 size={18} aria-hidden="true" />
                            Đang chọn
                          </span>
                        )}
                      </button>
                      <div className="mobile-deck-card__actions">
                        <button
                          type="button"
                          className="mobile-deck-card__action"
                          onClick={() => onStartRenameDeck(deck)}
                          aria-label={`Đổi tên học phần ${deck.deckName}`}
                          title="Đổi tên"
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="mobile-deck-card__action mobile-deck-card__action--delete"
                          onClick={() => onDeleteDeck(deck._id, deck.deckName)}
                          aria-label={`Xóa học phần ${deck.deckName}`}
                          title="Xóa học phần"
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </>
  );
};

export default MobileDeckSheet;
