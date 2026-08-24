import { useEffect, useRef, useState } from 'react';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import { CARD_STATUS_OPTIONS } from '../constants/cardStatus';
import useDialogFocus from '../hooks/useDialogFocus';

const CardFilterSheet = ({
  open,
  appliedStatus,
  returnFocusRef,
  onApply,
  onClear,
  onClose,
}) => {
  const dialogRef = useRef(null);
  const [draftStatus, setDraftStatus] = useState(appliedStatus);

  useEffect(() => {
    if (!open) return undefined;
    const timeoutId = window.setTimeout(() => setDraftStatus(appliedStatus), 0);
    return () => window.clearTimeout(timeoutId);
  }, [appliedStatus, open]);

  useDialogFocus({
    open,
    dialogRef,
    onClose,
    returnFocusRef,
  });

  if (!open) return null;

  const options = [
    { value: '', label: 'Tất cả' },
    ...CARD_STATUS_OPTIONS,
  ];

  return (
    <>
      <button
        type="button"
        className="card-filter-sheet-backdrop"
        onClick={onClose}
        aria-label="Đóng bộ lọc thẻ"
        tabIndex={-1}
      />
      <section
        ref={dialogRef}
        className="card-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-filter-sheet-title"
        tabIndex="-1"
      >
        <div className="card-filter-sheet__handle" aria-hidden="true" />
        <header className="card-filter-sheet__header">
          <div>
            <h2 id="card-filter-sheet-title">Lọc thẻ</h2>
            <p>Chọn trạng thái cần hiển thị.</p>
          </div>
          <button
            type="button"
            className="mobile-sheet-close"
            onClick={onClose}
            aria-label="Đóng bộ lọc thẻ"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="card-filter-sheet__section">
          <div className="card-filter-sheet__section-title">
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span>Trạng thái</span>
          </div>
          <div className="card-filter-sheet__chips">
            {options.map((option) => {
              const isSelected = draftStatus === option.value;

              return (
                <button
                  key={option.value || 'all'}
                  type="button"
                  className={`card-filter-chip${isSelected ? ' active' : ''}`}
                  onClick={() => setDraftStatus(option.value)}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={17} aria-hidden="true" />}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="card-filter-sheet__actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClear}
            disabled={!appliedStatus && !draftStatus}
          >
            Xóa bộ lọc
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onApply(draftStatus)}
          >
            Áp dụng
          </button>
        </footer>
      </section>
    </>
  );
};

export default CardFilterSheet;
