import { useId, useRef, useState } from 'react';
import axios from 'axios';

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
}) => {
  const [manualDraft, setManualDraft] = useState({ front: '', back: '' });
  const [importText, setImportText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [previewCards, setPreviewCards] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const [manualErrors, setManualErrors] = useState({});
  const [bulkError, setBulkError] = useState('');
  const fileInputRef = useRef(null);
  const idPrefix = useId();

  const manualTabId = `${idPrefix}-manual-tab`;
  const bulkTabId = `${idPrefix}-bulk-tab`;
  const manualPanelId = `${idPrefix}-manual-panel`;
  const bulkPanelId = `${idPrefix}-bulk-panel`;
  const frontInputId = `${idPrefix}-front`;
  const backInputId = `${idPrefix}-back`;
  const separatorInputId = `${idPrefix}-separator`;
  const fileInputId = `${idPrefix}-file`;
  const importTextId = `${idPrefix}-import-text`;
  const hasDeck = Boolean(currentDeck);

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    onModeChange(nextMode);
  };

  const handleManualFieldChange = (fieldName, value) => {
    setManualDraft((currentDraft) => ({
      ...currentDraft,
      [fieldName]: value,
    }));
    setManualErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: '',
      submit: '',
    }));
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const front = manualDraft.front.trim();
    const back = manualDraft.back.trim();

    if (!front) nextErrors.front = 'Hãy nhập mặt trước của thẻ.';
    if (!back) nextErrors.back = 'Hãy nhập mặt sau của thẻ.';
    if (!hasDeck) nextErrors.submit = 'Hãy chọn hoặc tạo một học phần trước khi thêm thẻ.';

    if (Object.keys(nextErrors).length > 0) {
      setManualErrors(nextErrors);
      return;
    }

    setIsManualSubmitting(true);
    setManualErrors({});

    try {
      await axios.post(API_URL, { front, back, deck: currentDeck });
      setManualDraft({ front: '', back: '' });
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
        cards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join(separator).trim(),
        });
      }
    });

    if (cards.length === 0) {
      setBulkError('Không tìm thấy thẻ hợp lệ. Hãy kiểm tra lại từng dòng và dấu phân cách.');
      return;
    }

    setPreviewCards(cards);
    setShowImportPreview(true);
    setBulkError('');
  };

  const handlePreviewCardChange = (index, fieldName, value) => {
    setPreviewCards((currentCards) => currentCards.map((card, cardIndex) => (
      cardIndex === index ? { ...card, [fieldName]: value } : card
    )));
  };

  const handlePreviewCardDelete = (index) => {
    setPreviewCards((currentCards) => currentCards.filter((_, cardIndex) => cardIndex !== index));
  };

  const handleConfirmImport = async () => {
    if (previewCards.length === 0) {
      setBulkError('Preview không còn thẻ nào để lưu. Hãy đóng preview và kiểm tra lại nội dung import.');
      setShowImportPreview(false);
      return;
    }

    setIsImportSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/bulk`, {
        cards: previewCards,
        deck: currentDeck,
      });

      setImportText('');
      setPreviewCards([]);
      setShowImportPreview(false);
      alert(`Đã thêm thành công ${response.data.count} thẻ!`);
      onBulkImported?.();
    } catch (error) {
      console.error('Error importing cards:', error);
      setBulkError('Không thể import thẻ. Hãy kiểm tra kết nối rồi thử lại.');
      setShowImportPreview(false);
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
              <div className="form-group">
                <label htmlFor={frontInputId}>Từ vựng (Mặt trước)</label>
                <input
                  id={frontInputId}
                  type="text"
                  className="form-control"
                  value={manualDraft.front}
                  onChange={(event) => handleManualFieldChange('front', event.target.value)}
                  placeholder="Ví dụ: Spaced Repetition"
                  aria-invalid={Boolean(manualErrors.front)}
                  aria-describedby={manualErrors.front ? `${frontInputId}-error` : undefined}
                />
                {manualErrors.front && (
                  <p id={`${frontInputId}-error`} className="add-cards-panel__field-error">
                    {manualErrors.front}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={backInputId}>Ý nghĩa (Mặt sau)</label>
                <textarea
                  id={backInputId}
                  className="form-control"
                  value={manualDraft.back}
                  onChange={(event) => handleManualFieldChange('back', event.target.value)}
                  rows="3"
                  placeholder="Ví dụ: Lặp lại ngắt quãng"
                  aria-invalid={Boolean(manualErrors.back)}
                  aria-describedby={manualErrors.back ? `${backInputId}-error` : undefined}
                />
                {manualErrors.back && (
                  <p id={`${backInputId}-error`} className="add-cards-panel__field-error">
                    {manualErrors.back}
                  </p>
                )}
              </div>

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

            <button type="button" className="btn btn-primary add-cards-panel__cta" onClick={handleCreatePreview}>
              Xem trước thẻ
            </button>
          </fieldset>
        </div>
      )}

      {showImportPreview && (
        <div className="modal-overlay import-preview-overlay" role="presentation">
          <section
            className="glass-card import-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-preview-title`}
          >
            <h3 id={`${idPrefix}-preview-title`}>Xem trước ({previewCards.length} thẻ)</h3>

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Từ vựng (Mặt trước)</th>
                    <th>Nghĩa (Mặt sau)</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {previewCards.map((card, index) => (
                    <tr key={`${card.front}-${index}`}>
                      <td>
                        <textarea
                          className="form-control"
                          value={card.front}
                          onChange={(event) => handlePreviewCardChange(index, 'front', event.target.value)}
                          aria-label={`Mặt trước của thẻ ${index + 1}`}
                        />
                      </td>
                      <td>
                        <textarea
                          className="form-control"
                          value={card.back}
                          onChange={(event) => handlePreviewCardChange(index, 'back', event.target.value)}
                          aria-label={`Mặt sau của thẻ ${index + 1}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handlePreviewCardDelete(index)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="import-preview-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowImportPreview(false)}
                disabled={isImportSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={isImportSubmitting || previewCards.length === 0}
              >
                {isImportSubmitting ? 'Đang lưu...' : 'Lưu thẻ'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default AddCardsPanel;
