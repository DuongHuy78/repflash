import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/cards';

export default function ManageCards({ currentDeck }) {
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
      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto', overflowX: 'auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Quản lý Từ vựng ({totalCards} thẻ)</h2>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Tìm kiếm từ hoặc nghĩa..." 
          className="form-control"
          style={{ flex: 1, minWidth: '200px' }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select 
          className="form-control" 
          style={{ width: 'auto' }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Chờ học (Active)</option>
          <option value="learning">Đang học lại (Learning)</option>
          <option value="mastered">Đã thuộc (Mastered)</option>
        </select>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '0.75rem' }}>Từ vựng</th>
                <th style={{ padding: '0.75rem' }}>Nghĩa</th>
                <th style={{ padding: '0.75rem' }}>Trạng thái</th>
                <th style={{ padding: '0.75rem' }}>Ngày ôn tiếp theo</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '0.75rem' }}>{card.front}</td>
                  <td style={{ padding: '0.75rem' }}>{card.back}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.85rem',
                      backgroundColor: card.status === 'mastered' ? '#4ade8022' : card.status === 'learning' ? '#facc1522' : '#60a5fa22',
                      color: card.status === 'mastered' ? '#4ade80' : card.status === 'learning' ? '#facc15' : '#60a5fa'
                    }}>
                      {card.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(card.nextReview).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#3b82f6' }} onClick={() => handleEditClick(card)}>Sửa</button>
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#ef4444' }} onClick={() => handleDelete(card._id)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy thẻ nào</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', alignItems: 'center' }}>
              <button className="btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1rem' }}>Trước</button>
              <span>Trang {page} / {totalPages}</span>
              <button className="btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1rem' }}>Tiếp</button>
            </div>
          )}
        </>
      )}
      </div>

      {/* Modal chỉnh sửa */}
      {editingCardId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', backgroundColor: '#1e293b', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'white' }}>Chỉnh sửa Thẻ</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Từ vựng</label>
              <textarea 
                className="form-control" 
                value={editForm.front} 
                onChange={e => setEditForm({...editForm, front: e.target.value})}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Nghĩa</label>
              <textarea 
                className="form-control" 
                value={editForm.back} 
                onChange={e => setEditForm({...editForm, back: e.target.value})}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Trạng thái</label>
              <select 
                className="form-control" 
                value={editForm.status} 
                onChange={e => setEditForm({...editForm, status: e.target.value})}
                style={{ width: '100%' }}
              >
                <option value="active">Chờ học (Active)</option>
                <option value="learning">Đang học lại (Learning)</option>
                <option value="mastered">Đã thuộc (Mastered)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Ngày ôn tiếp theo</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                value={editForm.nextReview} 
                onChange={e => setEditForm({...editForm, nextReview: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ backgroundColor: '#4b5563' }} onClick={handleCancelEdit}>Huỷ</button>
              <button className="btn btn-primary" onClick={() => handleSaveEdit(editingCardId)}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
