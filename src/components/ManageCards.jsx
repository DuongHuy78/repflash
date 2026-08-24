import { useState, useEffect, useCallback, useId, useRef } from 'react';
import axios from 'axios';
import { MoreVertical, Pencil, SlidersHorizontal, Trash2 } from 'lucide-react';
import CardContentFields from './CardContentFields';
import CardFilterSheet from './CardFilterSheet';
import useDialogFocus from '../hooks/useDialogFocus';
import {
  CARD_STATUS_LABELS,
  CARD_STATUS_OPTIONS,
} from '../constants/cardStatus';
import {
  compactCardContent,
  createEmptyCardContent,
  getCardValidationErrors,
  hasCardValidationErrors,
  toEditableCardContent,
} from '../utils/cardContentUtils';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/cards';

const formatReviewSchedule = (value) => {
  const reviewDate = new Date(value);
  if (Number.isNaN(reviewDate.getTime())) return 'Chưa có lịch ôn';

  const today = new Date();
  const startOfToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfReviewDay = Date.UTC(
    reviewDate.getFullYear(),
    reviewDate.getMonth(),
    reviewDate.getDate(),
  );
  const differenceInDays = Math.round(
    (startOfReviewDay - startOfToday) / (24 * 60 * 60 * 1000),
  );

  if (differenceInDays === 0) return 'Ôn hôm nay';
  if (differenceInDays === 1) return 'Ôn ngày mai';
  if (differenceInDays < 0) return `Quá hạn ${Math.abs(differenceInDays)} ngày`;
  return `Ôn ${reviewDate.toLocaleDateString('vi-VN')}`;
};

export default function ManageCards({ currentDeck, onOpenImport, onFullscreenChange }) {
  const editFormId = useId();
  const filterButtonRef = useRef(null);
  const actionButtonRefs = useRef(new Map());
  const editDialogRef = useRef(null);
  const editReturnFocusRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  // Lọc và Phân trang
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [actionCardId, setActionCardId] = useState(null);

  // Edit state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState({
    ...createEmptyCardContent(),
    status: '',
    nextReview: '',
  });
  const [initialEditForm, setInitialEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [isEditSaving, setIsEditSaving] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!currentDeck) {
      setCards([]);
      setTotalCards(0);
      setTotalPages(1);
      setLoading(false);
      setLoadError('');
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const res = await axios.get(`${API_URL}/all`, {
        params: {
          search,
          status,
          page,
          limit: 20,
          deckId: currentDeck
        }
      });
      setCards(res.data.cards);
      setTotalPages(res.data.totalPages);
      setTotalCards(res.data.totalCards);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thẻ:", error);
      setLoadError('Không tải được danh sách thẻ. Hãy kiểm tra kết nối rồi thử lại.');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, currentDeck]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchCards, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchCards]);

  const handleEditClick = (card) => {
    const nextEditForm = {
      ...toEditableCardContent(card),
      status: card.status,
      nextReview: card.nextReview ? new Date(card.nextReview).toISOString().slice(0, 16) : ''
    };

    editReturnFocusRef.current = actionButtonRefs.current.get(card._id) || document.activeElement;
    setActionCardId(null);
    setEditingCardId(card._id);
    setEditForm(nextEditForm);
    setInitialEditForm(nextEditForm);
    setEditError('');
    setEditFieldErrors({});
    onFullscreenChange?.(true);
  };

  const closeEdit = () => {
    setEditingCardId(null);
    setInitialEditForm(null);
    setEditError('');
    setEditFieldErrors({});
    onFullscreenChange?.(false);
  };

  const isEditDirty = Boolean(
    initialEditForm && JSON.stringify(editForm) !== JSON.stringify(initialEditForm),
  );

  const requestCloseEdit = () => {
    if (isEditSaving) return;
    if (isEditDirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn vẫn muốn thoát?')) return;
    closeEdit();
  };

  const handleSaveEdit = async (id) => {
    const normalizedContent = compactCardContent(editForm);
    const validationErrors = getCardValidationErrors(editForm);

    if (hasCardValidationErrors(validationErrors)) {
      setEditFieldErrors(validationErrors);
      setEditError('Hãy kiểm tra các field đang được đánh dấu.');
      return;
    }

    setIsEditSaving(true);
    setEditError('');
    setEditFieldErrors({});
    try {
      await axios.put(`${API_URL}/${id}`, {
        ...normalizedContent,
        status: editForm.status,
        nextReview: editForm.nextReview || undefined
      });
      closeEdit();
      fetchCards(); // Tải lại danh sách
      alert('Đã cập nhật thành công!');
    } catch (error) {
      console.error("Lỗi khi cập nhật thẻ:", error);
      setEditError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thẻ.');
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá thẻ này không?")) return false;
    setActionCardId(null);
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchCards();
      return true;
    } catch (error) {
      console.error("Lỗi khi xoá:", error);
      alert('Có lỗi xảy ra khi xoá thẻ.');
      return false;
    }
  };

  const handleDeleteFromEdit = async () => {
    if (!editingCardId || isEditSaving) return;
    const deleted = await handleDelete(editingCardId);
    if (deleted) closeEdit();
  };

  const handleApplyStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    setIsFilterSheetOpen(false);
  };

  const handleClearStatus = () => {
    setStatus('');
    setPage(1);
    setIsFilterSheetOpen(false);
  };

  const closeCardActions = (cardId, restoreFocus = true) => {
    setActionCardId(null);
    if (restoreFocus) {
      window.requestAnimationFrame(() => actionButtonRefs.current.get(cardId)?.focus());
    }
  };

  useDialogFocus({
    open: Boolean(editingCardId),
    dialogRef: editDialogRef,
    onClose: requestCloseEdit,
    returnFocusRef: editReturnFocusRef,
    closeDisabled: isEditSaving,
  });

  return (
    <>
      <section className="glass-card manage-cards" aria-labelledby="manage-cards-title">
        <header className="manage-cards__header">
          <div>
            <h2 id="manage-cards-title">Quản lý từ vựng</h2>
            <p>{totalCards} thẻ trong học phần hiện tại</p>
          </div>
          <button type="button" className="btn btn-secondary manage-cards__import" onClick={onOpenImport}>
            Nhập file
          </button>
        </header>

        <div className="manage-filters">
          <label className="sr-only" htmlFor="card-search">Tìm kiếm từ hoặc nghĩa</label>
          <input
            id="card-search"
            type="search"
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            className="form-control"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <label className="sr-only" htmlFor="card-status">Lọc theo trạng thái</label>
          <select
            id="card-status"
            className="form-control manage-status-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            {CARD_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            ref={filterButtonRef}
            type="button"
            className={`manage-filter-trigger${status ? ' active' : ''}`}
            onClick={() => setIsFilterSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isFilterSheetOpen}
            aria-label={status ? 'Mở bộ lọc thẻ, đang có 1 bộ lọc' : 'Mở bộ lọc thẻ'}
            title="Lọc thẻ"
          >
            <SlidersHorizontal size={21} aria-hidden="true" />
            {status && <span className="manage-filter-trigger__badge">1</span>}
          </button>
        </div>

        {loading ? (
          <p className="manage-cards__feedback" role="status">Đang tải dữ liệu...</p>
        ) : loadError ? (
          <div className="manage-cards__error" role="alert">
            <h3>Không tải được danh sách thẻ</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={fetchCards}>
              Thử lại
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="manage-cards__empty">
            <h3>Không tìm thấy thẻ nào</h3>
            <p>Hãy đổi từ khóa, bộ lọc hoặc thêm một thẻ mới.</p>
            {(search || status) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearch('');
                  handleClearStatus();
                }}
              >
                Xóa tìm kiếm và bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="manage-table-wrap">
              <table className="manage-table">
                <thead>
                  <tr>
                    <th>Từ vựng</th>
                    <th>Nghĩa</th>
                    <th>Trạng thái</th>
                    <th>Ngày ôn tiếp theo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr key={card._id}>
                      <td>
                        <strong>{card.front}</strong>
                        {card.pronunciation && (
                          <span className="manage-card-pronunciation">{card.pronunciation}</span>
                        )}
                      </td>
                      <td>{card.back}</td>
                      <td>
                        <span className={`status-badge status-badge--${card.status}`}>
                           {CARD_STATUS_LABELS[card.status] || card.status}
                        </span>
                      </td>
                      <td>{new Date(card.nextReview).toLocaleString('vi-VN')}</td>
                      <td>
                        <div className="manage-table__actions">
                          <button className="btn btn-info" onClick={() => handleEditClick(card)}>Sửa</button>
                          <button className="btn btn-danger" onClick={() => handleDelete(card._id)}>Xoá</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="manage-card-list">
              {cards.map((card) => (
                <article key={card._id} className="manage-card-item">
                  <button
                    ref={(element) => {
                      if (element) actionButtonRefs.current.set(card._id, element);
                      else actionButtonRefs.current.delete(card._id);
                    }}
                    type="button"
                    className="manage-card-item__menu-trigger"
                    onClick={() => setActionCardId((currentId) => (
                      currentId === card._id ? null : card._id
                    ))}
                    aria-haspopup="menu"
                    aria-expanded={actionCardId === card._id}
                    aria-controls={`card-actions-${card._id}`}
                    aria-label={`Mở hành động cho thẻ ${card.front}`}
                    title="Hành động"
                  >
                    <MoreVertical size={21} aria-hidden="true" />
                  </button>
                  <div className="manage-card-item__content">
                    <h3>{card.front}</h3>
                    {card.pronunciation && (
                      <span className="manage-card-pronunciation">{card.pronunciation}</span>
                    )}
                    <p>{card.back}</p>
                  </div>
                  <div className="manage-card-item__meta">
                    <span className={`status-badge status-badge--${card.status}`}>
                      {CARD_STATUS_LABELS[card.status] || card.status}
                    </span>
                    <span>{formatReviewSchedule(card.nextReview)}</span>
                  </div>
                  {actionCardId === card._id && (
                    <>
                      <button
                        type="button"
                        className="manage-card-action-backdrop"
                        onClick={() => closeCardActions(card._id)}
                        aria-label="Đóng menu hành động thẻ"
                        tabIndex={-1}
                      />
                      <div
                        id={`card-actions-${card._id}`}
                        className="manage-card-action-menu"
                        role="menu"
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            closeCardActions(card._id);
                          }
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleEditClick(card)}
                          autoFocus
                        >
                          <Pencil size={18} aria-hidden="true" />
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="danger"
                          onClick={() => handleDelete(card._id)}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                          Xóa thẻ
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="manage-pagination" aria-label="Phân trang thẻ">
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => { setActionCardId(null); setPage(p => p - 1); }}>Trước</button>
                <span aria-live="polite">Trang {page} / {totalPages}</span>
                <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => { setActionCardId(null); setPage(p => p + 1); }}>Tiếp</button>
              </nav>
            )}
          </>
        )}
      </section>

      <CardFilterSheet
        open={isFilterSheetOpen}
        appliedStatus={status}
        returnFocusRef={filterButtonRef}
        onApply={handleApplyStatus}
        onClear={handleClearStatus}
        onClose={() => setIsFilterSheetOpen(false)}
      />

      {/* Modal chỉnh sửa */}
      {editingCardId && (
        <div className="modal-overlay manage-edit-overlay" role="presentation">
          <section
            ref={editDialogRef}
            className="glass-card manage-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-card-title"
            tabIndex="-1"
          >
            <header className="manage-edit-header">
              <button
                type="button"
                className="manage-edit-header__mobile-action"
                onClick={requestCloseEdit}
                disabled={isEditSaving}
              >
                Hủy
              </button>
              <div>
                <h3 id="edit-card-title">Chỉnh sửa thẻ</h3>
                <p>Cập nhật nội dung và trạng thái học của thẻ.</p>
              </div>
              <button
                type="button"
                className="manage-edit-header__mobile-action manage-edit-header__mobile-action--save"
                onClick={() => handleSaveEdit(editingCardId)}
                disabled={isEditSaving}
              >
                {isEditSaving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </header>

            <div className="manage-edit-body">
              {editError && <p className="add-cards-panel__error" role="alert">{editError}</p>}

              <CardContentFields
                value={editForm}
                onChange={(nextContent) => {
                  setEditForm((currentForm) => ({
                    ...currentForm,
                    ...nextContent,
                    status: currentForm.status,
                    nextReview: currentForm.nextReview,
                  }));
                  setEditError('');
                  setEditFieldErrors({});
                }}
                idPrefix={`${editFormId}-manage`}
                errors={editFieldErrors}
                advancedDefaultOpen
                mode="edit"
              />

              <div className="manage-edit-field">
                <label htmlFor="edit-card-status">Trạng thái</label>
                <select
                  id="edit-card-status"
                  className="form-control"
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                >
                  {CARD_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="manage-edit-field">
                <label htmlFor="edit-card-next-review">Ngày ôn tiếp theo</label>
                <input
                  id="edit-card-next-review"
                  type="datetime-local"
                  className="form-control"
                  value={editForm.nextReview}
                  onChange={e => setEditForm({...editForm, nextReview: e.target.value})}
                />
              </div>

              <div className="manage-edit-danger-zone">
                <div>
                  <strong>Xóa thẻ này</strong>
                  <p>Thao tác này không thể hoàn tác.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteFromEdit}
                  disabled={isEditSaving}
                >
                  Xóa thẻ
                </button>
              </div>
            </div>

            <footer className="manage-edit-actions">
              <button className="btn btn-secondary" onClick={requestCloseEdit} disabled={isEditSaving}>Huỷ</button>
              <button className="btn btn-primary" onClick={() => handleSaveEdit(editingCardId)} disabled={isEditSaving}>
                {isEditSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
