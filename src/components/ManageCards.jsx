import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/cards';

const STATUS_LABELS = {
  active: 'Chờ học',
  learning: 'Đang học lại',
  mastered: 'Đã thuộc',
};

export default function ManageCards({ currentDeck, onOpenImport }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Lọc và Phân trang
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);

  // Edit state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState({
    front: '', back: '', status: '', nextReview: ''
  });

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/all`, {
        params: {
          search,
          status,
          page,
          limit: 20,
          deck: currentDeck
        }
      });
      setCards(res.data.cards);
      setTotalPages(res.data.totalPages);
      setTotalCards(res.data.totalCards);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thẻ:", error);
    } finally {
      setLoading(false);
    }
  }, [search, status, page, currentDeck]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleEditClick = (card) => {
    setEditingCardId(card._id);
    setEditForm({
      front: card.front,
      back: card.back,
      status: card.status,
      nextReview: card.nextReview ? new Date(card.nextReview).toISOString().slice(0, 16) : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`${API_URL}/${id}`, {
        front: editForm.front,
        back: editForm.back,
        status: editForm.status,
        nextReview: editForm.nextReview || undefined
      });
      setEditingCardId(null);
      fetchCards(); // Tải lại danh sách
      alert('Đã cập nhật thành công!');
    } catch (error) {
      console.error("Lỗi khi cập nhật thẻ:", error);
      alert('Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá thẻ này không?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchCards();
    } catch (error) {
      console.error("Lỗi khi xoá:", error);
      alert('Có lỗi xảy ra khi xoá thẻ.');
    }
  };

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
            className="form-control"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Chờ học</option>
            <option value="learning">Đang học lại</option>
            <option value="mastered">Đã thuộc</option>
          </select>
        </div>

        {loading ? (
          <p className="manage-cards__feedback" role="status">Đang tải dữ liệu...</p>
        ) : cards.length === 0 ? (
          <div className="manage-cards__empty">
            <h3>Không tìm thấy thẻ nào</h3>
            <p>Hãy đổi từ khóa, bộ lọc hoặc thêm một thẻ mới.</p>
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
                      <td>{card.front}</td>
                      <td>{card.back}</td>
                      <td>
                        <span className={`status-badge status-badge--${card.status}`}>
                          {STATUS_LABELS[card.status] || card.status}
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
                  <div className="manage-card-item__content">
                    <h3>{card.front}</h3>
                    <p>{card.back}</p>
                  </div>
                  <div className="manage-card-item__meta">
                    <span className={`status-badge status-badge--${card.status}`}>
                      {STATUS_LABELS[card.status] || card.status}
                    </span>
                    <span>Ôn {new Date(card.nextReview).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="manage-card-item__actions">
                    <button className="btn btn-secondary" onClick={() => handleEditClick(card)}>Sửa</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(card._id)}>Xoá</button>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="manage-pagination" aria-label="Phân trang thẻ">
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button>
                <span aria-live="polite">Trang {page} / {totalPages}</span>
                <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Tiếp</button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Modal chỉnh sửa */}
      {editingCardId && (
        <div className="modal-overlay manage-edit-overlay" role="presentation">
          <section className="glass-card manage-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-card-title">
            <h3 id="edit-card-title">Chỉnh sửa thẻ</h3>
            
            <div className="manage-edit-field">
              <label htmlFor="edit-card-front">Từ vựng</label>
              <textarea 
                id="edit-card-front"
                className="form-control" 
                value={editForm.front} 
                onChange={e => setEditForm({...editForm, front: e.target.value})}
              />
            </div>

            <div className="manage-edit-field">
              <label htmlFor="edit-card-back">Nghĩa</label>
              <textarea 
                id="edit-card-back"
                className="form-control" 
                value={editForm.back} 
                onChange={e => setEditForm({...editForm, back: e.target.value})}
              />
            </div>

            <div className="manage-edit-field">
              <label htmlFor="edit-card-status">Trạng thái</label>
              <select 
                id="edit-card-status"
                className="form-control" 
                value={editForm.status} 
                onChange={e => setEditForm({...editForm, status: e.target.value})}
              >
                <option value="active">Chờ học</option>
                <option value="learning">Đang học lại</option>
                <option value="mastered">Đã thuộc</option>
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

            <div className="manage-edit-actions">
              <button className="btn btn-secondary" onClick={handleCancelEdit}>Huỷ</button>
              <button className="btn btn-primary" onClick={() => handleSaveEdit(editingCardId)}>Lưu thay đổi</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
