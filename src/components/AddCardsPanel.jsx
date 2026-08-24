import { useId, useRef, useState } from 'react';
import axios from 'axios';
import { AlertCircle, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import CardContentFields from './CardContentFields';
import useDialogFocus from '../hooks/useDialogFocus';
import {
  compactCardContent,
  createEmptyCardContent,
  getCardValidationErrors,
  hasCardValidationErrors,
  toEditableCardContent,
} from '../utils/cardContentUtils';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/cards';

const ADD_MODES = {
  manual: {
    label: 'Thêm thủ công',
    description: 'Nhập từng từ và nghĩa của từ đó.',
  },
  bulk: {
    label: 'Thêm hàng loạt',
    description: 'Dán nội dung hoặc tải file để tạo nhiều thẻ cùng lúc.',
  },
};

const AddCardsPanel = ({
  currentDeck,
  mode = 'manual',
  onModeChange,
  onManualCreated,
  onBulkImported,
  onFullscreenChange,
}) => {
  const [manualDraft, setManualDraft] = useState(createEmptyCardContent);
  const [importText, setImportText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [previewCards, setPreviewCards] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const [manualErrors, setManualErrors] = useState({});
  const [bulkError, setBulkError] = useState('');
  const fileInputRef = useRef(null);
  const previewButtonRef = useRef(null);
  const previewDialogRef = useRef(null);
  const idPrefix = useId();

  const manualTabId = `${idPrefix}-manual-tab`;
  const bulkTabId = `${idPrefix}-bulk-tab`;
  const manualPanelId = `${idPrefix}-manual-panel`;
  const bulkPanelId = `${idPrefix}-bulk-panel`;
  const separatorInputId = `${idPrefix}-separator`;
  const fileInputId = `${idPrefix}-file`;
  const importTextId = `${idPrefix}-import-text`;
  const hasDeck = Boolean(currentDeck);
  const previewErrors = previewCards.map(getCardValidationErrors);
  const invalidPreviewCount = previewErrors.filter(hasCardValidationErrors).length;
  const validPreviewCount = previewCards.length - invalidPreviewCount;

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    onModeChange(nextMode);
  };

  const handleManualDraftChange = (nextDraft) => {
    setManualDraft(nextDraft);
    setManualErrors({});
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const normalizedDraft = compactCardContent(manualDraft);

    if (!normalizedDraft.front) nextErrors.front = 'Hãy nhập mặt trước của thẻ.';
    if (!normalizedDraft.back) nextErrors.back = 'Hãy nhập mặt sau của thẻ.';
    const exampleErrors = normalizedDraft.examples.map((example) => (
      example.text ? '' : 'Hãy nhập câu ví dụ hoặc xóa mục này.'
    ));
    if (exampleErrors.some(Boolean)) nextErrors.examples = exampleErrors;
    if (!hasDeck) nextErrors.submit = 'Hãy chọn hoặc tạo một học phần trước khi thêm thẻ.';

    if (Object.keys(nextErrors).length > 0) {
      setManualErrors(nextErrors);
      return;
    }

    setIsManualSubmitting(true);
    setManualErrors({});

    try {
      await axios.post(API_URL, { ...normalizedDraft, deckId: currentDeck });
      setManualDraft(createEmptyCardContent());
      alert('Đã thêm thẻ thành công!');
      onManualCreated?.();
    } catch (error) {
      console.error('Error adding card:', error);
      setManualErrors({
        submit: 'Không thể thêm thẻ. Hãy kiểm tra kết nối rồi thử lại.',
      });
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleImportTextChange = (value) => {
    setImportText(value);
    setBulkError('');
  };

  const handleCreatePreview = () => {
    if (!hasDeck) {
      setBulkError('Hãy chọn hoặc tạo một học phần trước khi thêm thẻ.');
      return;
    }

    if (!importText.trim()) {
      setBulkError('Hãy dán nội dung hoặc tải file trước khi xem trước.');
      return;
    }

    const cards = [];

    importText.split('\n').forEach((line) => {
      if (!line.trim()) return;

      const parts = line.split(separator);
      if (parts.length >= 2) {
        cards.push(toEditableCardContent({
          front: parts[0].trim(),
          back: parts.slice(1).join(separator).trim(),
        }));
      }
    });

    if (cards.length === 0) {
      setBulkError('Không tìm thấy thẻ hợp lệ. Hãy kiểm tra lại từng dòng và dấu phân cách.');
      return;
    }

    setPreviewCards(cards);
    previewButtonRef.current = document.activeElement;
    setShowImportPreview(true);
    onFullscreenChange?.(true);
    setBulkError('');
  };

  const handlePreviewCardChange = (index, nextCard) => {
    setPreviewCards((currentCards) => currentCards.map((card, cardIndex) => (
      cardIndex === index ? nextCard : card
    )));
    setBulkError('');
  };

  const handlePreviewCardDelete = (index) => {
    setPreviewCards((currentCards) => currentCards.filter((_, cardIndex) => cardIndex !== index));
    setBulkError('');
  };

  const closeImportPreview = () => {
    if (isImportSubmitting) return;
    setShowImportPreview(false);
    setBulkError('');
    onFullscreenChange?.(false);
  };

  const handleConfirmImport = async () => {
    if (previewCards.length === 0) {
      setBulkError('Preview không còn thẻ nào để lưu. Hãy đóng preview và kiểm tra lại nội dung import.');
      return;
    }

    const normalizedCards = previewCards.map(compactCardContent);
    const invalidCardIndex = previewErrors.findIndex(hasCardValidationErrors);

    if (invalidCardIndex >= 0) {
      setBulkError(`Thẻ ${invalidCardIndex + 1} còn thiếu mặt trước, mặt sau hoặc câu ví dụ.`);
      return;
    }

    setIsImportSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/bulk`, {
        cards: normalizedCards,
        deckId: currentDeck,
      });

      setImportText('');
      setPreviewCards([]);
      setShowImportPreview(false);
      onFullscreenChange?.(false);
      alert(`Đã thêm thành công ${response.data.count} thẻ!`);
      onBulkImported?.();
    } catch (error) {
      console.error('Error importing cards:', error);
      setBulkError('Không thể import thẻ. Hãy kiểm tra kết nối rồi thử lại.');
    } finally {
      setIsImportSubmitting(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      handleImportTextChange(String(loadEvent.target?.result || ''));
    };
    reader.readAsText(file);
  };

  useDialogFocus({
    open: showImportPreview,
    dialogRef: previewDialogRef,
    onClose: closeImportPreview,
    returnFocusRef: previewButtonRef,
    closeDisabled: isImportSubmitting,
  });

  return (
    <section className="glass-card content-panel add-cards-panel" aria-labelledby={`${idPrefix}-title`}>
      <header className="add-cards-panel__header">
        <h2 id={`${idPrefix}-title`}>Thêm thẻ</h2>
        <p>Chọn cách phù hợp để thêm thẻ vào học phần hiện tại.</p>
      </header>

      {!hasDeck && (
        <div className="add-cards-panel__notice" role="status">
          <strong>Bạn chưa chọn học phần.</strong>
          <span>Hãy chọn hoặc tạo học phần ở khu vực Học phần trước khi thêm thẻ.</span>
        </div>
      )}

      <div className="add-mode-tabs" role="tablist" aria-label="Cách thêm thẻ">
        {Object.entries(ADD_MODES).map(([modeName, modeInfo]) => {
          const isActive = mode === modeName;
          const tabId = modeName === 'manual' ? manualTabId : bulkTabId;
          const panelId = modeName === 'manual' ? manualPanelId : bulkPanelId;

          return (
            <button
              key={modeName}
              id={tabId}
              type="button"
              role="tab"
              className={`add-mode-tab${isActive ? ' active' : ''}`}
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => changeMode(modeName)}
            >
              <span>{modeInfo.label}</span>
              <small>{modeInfo.description}</small>
            </button>
          );
        })}
      </div>

      {mode === 'manual' ? (
        <div
          id={manualPanelId}
          className="add-mode-panel"
          role="tabpanel"
          aria-labelledby={manualTabId}
        >
          <form onSubmit={handleManualSubmit} noValidate>
            {manualErrors.submit && (
              <p className="add-cards-panel__error" role="alert">{manualErrors.submit}</p>
            )}

            <fieldset className="add-cards-fieldset" disabled={!hasDeck || isManualSubmitting}>
              <CardContentFields
                value={manualDraft}
                onChange={handleManualDraftChange}
                idPrefix={`${idPrefix}-manual`}
                errors={manualErrors}
                mode="create"
              />

              <button type="submit" className="btn btn-primary add-cards-panel__cta">
                {isManualSubmitting ? 'Đang thêm...' : 'Thêm thẻ'}
              </button>
            </fieldset>
          </form>
        </div>
      ) : (
        <div
          id={bulkPanelId}
          className="add-mode-panel"
          role="tabpanel"
          aria-labelledby={bulkTabId}
        >
          <p className="add-cards-panel__description">
            Mỗi thẻ nằm trên một dòng. Mặt trước và mặt sau được ngăn bằng dấu bạn chọn.
          </p>

          {bulkError && <p className="add-cards-panel__error" role="alert">{bulkError}</p>}

          <fieldset className="add-cards-fieldset" disabled={!hasDeck || isImportSubmitting}>
            <div className="form-group add-cards-panel__separator">
              <label htmlFor={separatorInputId}>Dấu phân cách</label>
              <select
                id={separatorInputId}
                className="form-control"
                value={separator}
                onChange={(event) => {
                  setSeparator(event.target.value);
                  setBulkError('');
                }}
              >
                <option value="-">Dấu gạch ngang (-)</option>
                <option value=",">Dấu phẩy (,)</option>
                <option value="|">Dấu gạch đứng (|)</option>
                <option value=";">Dấu chấm phẩy (;)</option>
                <option value="\t">Tab</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor={fileInputId}>Tải file lên (Tùy chọn)</label>
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept=".txt,.csv"
                className="form-control"
                onChange={handleFileUpload}
              />
            </div>

            <div className="form-group">
              <label htmlFor={importTextId}>Nội dung import</label>
              <textarea
                id={importTextId}
                className="form-control"
                value={importText}
                onChange={(event) => handleImportTextChange(event.target.value)}
                rows="8"
                placeholder={'Ví dụ:\nHello - Xin chào\nApple - Quả táo'}
              />
            </div>

            <button ref={previewButtonRef} type="button" className="btn btn-primary add-cards-panel__cta" onClick={handleCreatePreview}>
              Xem trước thẻ
            </button>
          </fieldset>
        </div>
      )}

      {showImportPreview && (
        <div className="modal-overlay import-preview-overlay" role="presentation">
          <section
            ref={previewDialogRef}
            className="glass-card import-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-preview-title`}
            tabIndex="-1"
          >
            <header className="import-preview-header">
              <button
                type="button"
                className="import-preview-header__back"
                onClick={closeImportPreview}
                disabled={isImportSubmitting}
              >
                <ArrowLeft size={20} aria-hidden="true" />
                Quay lại
              </button>
              <div>
                <h3 id={`${idPrefix}-preview-title`}>Xem trước thẻ</h3>
                <p aria-live="polite">
                  <span className="import-preview-count import-preview-count--valid">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {validPreviewCount} hợp lệ
                  </span>
                  {invalidPreviewCount > 0 && (
                    <span className="import-preview-count import-preview-count--invalid">
                      <AlertCircle size={16} aria-hidden="true" />
                      {invalidPreviewCount} lỗi
                    </span>
                  )}
                </p>
              </div>
            </header>

            {bulkError && <p className="add-cards-panel__error import-preview-error" role="alert">{bulkError}</p>}

            <div className="import-preview-list">
              {previewCards.length === 0 ? (
                <div className="import-preview-empty">
                  <strong>Preview không còn thẻ nào</strong>
                  <p>Quay lại để kiểm tra dữ liệu import.</p>
                </div>
              ) : previewCards.map((card, index) => {
                const cardHasErrors = hasCardValidationErrors(previewErrors[index]);

                return (
                <article key={`preview-${index}`} className={`import-preview-card${cardHasErrors ? ' invalid' : ' valid'}`}>
                  <header className="import-preview-card__header">
                    <strong>
                      {cardHasErrors
                        ? <AlertCircle size={17} aria-hidden="true" />
                        : <CheckCircle2 size={17} aria-hidden="true" />}
                      Thẻ {index + 1} · {cardHasErrors ? 'Cần sửa' : 'Hợp lệ'}
                    </strong>
                    <button
                      type="button"
                      className="import-preview-card__delete"
                      onClick={() => handlePreviewCardDelete(index)}
                      aria-label={`Xóa thẻ ${index + 1}`}
                      title={`Xóa thẻ ${index + 1}`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </header>
                  <CardContentFields
                    value={card}
                    onChange={(nextCard) => handlePreviewCardChange(index, nextCard)}
                    idPrefix={`${idPrefix}-preview-${index}`}
                    errors={previewErrors[index]}
                    mode="preview"
                  />
                </article>
                );
              })}
            </div>

            <footer className="import-preview-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeImportPreview}
                disabled={isImportSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={isImportSubmitting || previewCards.length === 0 || invalidPreviewCount > 0}
              >
                {isImportSubmitting ? 'Đang nhập…' : `Nhập ${validPreviewCount} thẻ`}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
};

export default AddCardsPanel;
