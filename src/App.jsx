import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import ReviewCard from './components/ReviewCard';
import './index.css'; // Premium CSS
import ManageCards from './components/ManageCards';
import QUOTES from './quotes.json';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/cards';
const RETRY_API_URL = `${API_URL}/retry`;

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName);
};

const resolveStateUpdate = (nextValue, currentValue) =>
  typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;

function App() {
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState('review'); // 'review', 'retry', 'add', 'import'
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  
  const [currentDeck, setCurrentDeck] = useState(() => {
    return localStorage.getItem('currentDeck') || 'japanese';
  });

  useEffect(() => {
    localStorage.setItem('currentDeck', currentDeck);
  }, [currentDeck]);
  
  // Quote state
  const [currentQuote, setCurrentQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Import states
  const [importText, setImportText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [importLoading, setImportLoading] = useState(false);
  const [previewCards, setPreviewCards] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cardUiState, setCardUiState] = useState({ cardId: null, isFlipped: false, isEditing: false });
  const [reviewMode, setReviewMode] = useState('main'); // 'main', 'retry'

  const currentCard = cards[0];
  const currentCardId = currentCard?._id;
  const isCurrentCardUiState = cardUiState.cardId === currentCardId;
  const isCardFlipped = isCurrentCardUiState ? cardUiState.isFlipped : false;
  const isCardEditing = isCurrentCardUiState ? cardUiState.isEditing : false;

  const setIsCardFlipped = useCallback((nextValue) => {
    setCardUiState((state) => {
      const isCurrent = state.cardId === currentCardId;
      const currentFlipped = isCurrent ? state.isFlipped : false;

      return {
        cardId: currentCardId,
        isFlipped: resolveStateUpdate(nextValue, currentFlipped),
        isEditing: isCurrent ? state.isEditing : false,
      };
    });
  }, [currentCardId]);

  const setIsCardEditing = useCallback((nextValue) => {
    setCardUiState((state) => {
      const isCurrent = state.cardId === currentCardId;
      const currentEditing = isCurrent ? state.isEditing : false;

      return {
        cardId: currentCardId,
        isFlipped: isCurrent ? state.isFlipped : false,
        isEditing: resolveStateUpdate(nextValue, currentEditing),
      };
    });
  }, [currentCardId]);

  const fetchDueCards = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setReviewMode('main');
    try {
      const res = await axios.get(`${API_URL}?deck=${currentDeck}`);
      setCards(res.data);
    } catch (error) {
      console.error("Error fetching cards:", error);
      setLoadError('Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 6000.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRetryCards = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await axios.get(`${RETRY_API_URL}?deck=${currentDeck}`);
      setCards(res.data);
      setReviewMode('retry');
    } catch (error) {
      console.error("Error fetching retry cards:", error);
      setLoadError('Không tải được danh sách thẻ cần ôn lại. Hãy kiểm tra backend đang chạy ở cổng 6000.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRandomQuote = useCallback(() => {
    setCurrentQuote((quote) => {
      let newQuote;
      do {
        newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      } while (newQuote === quote && QUOTES.length > 1);
      return newQuote;
    });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (activeTab === 'review') fetchDueCards();
      else if (activeTab === 'retry') fetchRetryCards();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDueCards, fetchRetryCards, activeTab, currentDeck]);

  const openReviewTab = useCallback(() => {
    setActiveTab('review');
    fetchDueCards();
  }, [fetchDueCards]);

  const openRetryTab = useCallback(() => {
    setActiveTab('retry');
    fetchRetryCards();
  }, [fetchRetryCards]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newFront || !newBack) return;

    try {
      await axios.post(API_URL, { front: newFront, back: newBack, deck: currentDeck });
      setNewFront('');
      setNewBack('');
      alert('Đã thêm thẻ thành công!');
      fetchDueCards(); // Refresh list if we want to immediately see it (if it's due)
    } catch (error) {
      console.error("Error adding card:", error);
      alert('Có lỗi xảy ra khi thêm thẻ.');
    }
  };

  const handleReview = useCallback(async (id, quality) => {
    try {
      const res = await axios.put(`${API_URL}/${id}/review`, { quality });
      setCards((currentCards) => {
        const reviewedCard = currentCards.find(card => card._id === id);
        const remainingCards = currentCards.filter(card => card._id !== id);

        if (reviewMode === 'retry' && quality === 1 && reviewedCard) {
          return [...remainingCards, res.data?._id ? res.data : reviewedCard];
        }

        return remainingCards;
      });
      setIsCardFlipped(false);
    } catch (error) {
      console.error("Error reviewing card:", error);
    }
  }, [reviewMode, setIsCardFlipped]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      if (key === 'escape' && isCardEditing) {
        event.preventDefault();
        setIsCardEditing(false);
        return;
      }

      if (isTypingTarget(event.target) || isCardEditing) return;

      const canUseReviewShortcuts =
        ['review', 'retry'].includes(activeTab) &&
        currentCard &&
        !loading &&
        !loadError;

      if (!canUseReviewShortcuts) return;

      if (event.code === 'Space') {
        event.preventDefault();
        setIsCardFlipped((flipped) => !flipped);
        return;
      }

      if (key === 'r') {
        event.preventDefault();
        handleRandomQuote();
        return;
      }

      if (key === 'v' && currentCard && !isCardEditing) {
        event.preventDefault();
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentCard.front);
          if (currentDeck === 'japanese') {
            utterance.lang = 'ja-JP';
          } else if (currentDeck === 'english') {
            utterance.lang = 'en-US';
          }
          window.speechSynthesis.speak(utterance);
        }
        return;
      }

      if (!isCardFlipped) return;

      const reviewShortcuts = {
        a: 1,
        s: 2,
        d: 3,
        f: 4,
      };

      // Trong chế độ retry chỉ dùng shortcut A (1) và F (3)
      let quality;
      if (reviewMode === 'retry') {
        const retryShortcuts = { a: 1, f: 3 };
        quality = retryShortcuts[key];
      } else {
        quality = reviewShortcuts[key];
      }

      if (quality) {
        event.preventDefault();
        handleReview(currentCard._id, quality);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    currentCard,
    currentDeck,
    handleRandomQuote,
    handleReview,
    isCardEditing,
    isCardFlipped,
    loadError,
    loading,
    setIsCardEditing,
    setIsCardFlipped,
    reviewMode,
  ]);

  const handleEdit = async (id, updatedFront, updatedBack) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, { front: updatedFront, back: updatedBack });
      // Update the card in the list
      setCards(cards.map(card => card._id === id ? res.data : card));
    } catch (error) {
      console.error("Error editing card:", error);
      alert("Có lỗi xảy ra khi cập nhật thẻ");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setCards(cards.filter(card => card._id !== id));
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Có lỗi xảy ra khi xóa thẻ");
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    const lines = importText.split('\n');
    const newCards = [];

    lines.forEach(line => {
      // Bỏ qua dòng trống
      if (!line.trim()) return;
      
      const parts = line.split(separator);
      if (parts.length >= 2) {
        newCards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join(separator).trim() // Gom lại các phần sau nếu có chứa ký tự separator
        });
      }
    });

    if (newCards.length === 0) {
      alert('Không tìm thấy thẻ hợp lệ nào. Vui lòng kiểm tra lại cấu trúc và dấu phân cách.');
      return;
    }

    setPreviewCards(newCards);
    setShowImportPreview(true);
  };

  const confirmImport = async () => {
    setImportLoading(true);
    try {
      const res = await axios.post(`${API_URL}/bulk`, { cards: previewCards, deck: currentDeck });
      alert(`Đã thêm thành công ${res.data.count} thẻ!`);
      setImportText('');
      fetchDueCards();
      setActiveTab('review');
      setShowImportPreview(false);
      setPreviewCards([]);
    } catch (error) {
      console.error("Error importing cards:", error);
      alert('Có lỗi xảy ra khi import thẻ.');
    }
    setImportLoading(false);
  };

  const handlePreviewCardChange = (index, field, value) => {
    const newCards = [...previewCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setPreviewCards(newCards);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Flashcard Spaced Repetition</h1>
          <p className="subtitle" style={{ margin: '0.5rem 0 0 0' }}>Học từ vựng hiệu quả vào đúng thời điểm</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ color: 'white', fontWeight: 'bold' }}>Ngôn ngữ:</label>
          <select 
            className="form-control" 
            style={{ width: 'auto', padding: '0.5rem', fontWeight: 'bold' }}
            value={currentDeck}
            onChange={(e) => setCurrentDeck(e.target.value)}
          >
            <option value="japanese">🇯🇵 Tiếng Nhật</option>
            <option value="english">🇬🇧 Tiếng Anh</option>
          </select>
        </div>
      </header>

      <div className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={openReviewTab}
        >
          Ôn tập {activeTab === 'review' ? `(${cards.length})` : ''}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'retry' ? 'active' : ''}`}
          onClick={openRetryTab}
        >
          Bò nhai cỏ {activeTab === 'retry' ? `(${cards.length})` : ''}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Quản lý thẻ
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Thêm thẻ mới
        </button>
        <button 
          className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Nhập từ file (Import)
        </button>
      </div>

      <main>
        {activeTab === 'add' && (
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Tạo Flashcard mới</h2>
            <form onSubmit={handleAddCard}>
              <div className="form-group">
                <label>Từ vựng (Mặt trước)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Ví dụ: Spaced Repetition"
                />
              </div>
              <div className="form-group">
                <label>Ý nghĩa (Mặt sau)</label>
                <textarea 
                  className="form-control" 
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  rows="3"
                  placeholder="Ví dụ: Lặp lại ngắt quãng"
                  style={{ resize: 'vertical' }}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Lưu thẻ
              </button>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <ManageCards currentDeck={currentDeck} />
        )}

        {activeTab === 'import' && (
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Nhập thẻ hàng loạt (Import)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Bạn có thể dán nội dung văn bản vào ô dưới đây, hoặc tải lên một file text (.txt, .csv) chứa từ vựng. 
              Mỗi từ vựng nên ở trên 1 dòng.
            </p>

            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ margin: 0 }}>Dấu phân cách:</label>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '0.5rem' }}
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
              >
                <option value="-">Dấu gạch ngang (-)</option>
                <option value=",">Dấu phẩy (,)</option>
                <option value="|">Dấu gạch đứng (|)</option>
                <option value=";">Dấu chấm phẩy (;)</option>
                <option value="	">Tab</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tải file lên (Tuỳ chọn)</label>
              <input 
                type="file" 
                accept=".txt,.csv" 
                className="form-control" 
                onChange={handleFileUpload}
              />
            </div>

            <div className="form-group">
              <label>Nội dung Import</label>
              <textarea 
                className="form-control" 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows="8"
                placeholder={`Ví dụ:\nHello - Xin chào\nApple - Quả táo`}
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              onClick={handleImport}
            >
              Xem trước / Lưu dữ liệu
            </button>
          </div>
        )}

        {['review', 'retry'].includes(activeTab) && (
          <div>
            {loading ? (
              <div className="empty-state"><h3>Đang tải dữ liệu...</h3></div>
            ) : loadError ? (
              <div className="glass-card empty-state error-state">
                <h3>Không kết nối được backend</h3>
                <p>{loadError}</p>
                <button className="btn btn-primary" onClick={activeTab === 'retry' ? fetchRetryCards : fetchDueCards}>
                  Thử lại
                </button>
              </div>
            ) : cards.length > 0 ? (
              <div className="glass-card">
                <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  {reviewMode === 'retry'
                    ? `Còn ${cards.length} thẻ cần nhai lại trong hôm nay`
                    : `Còn ${cards.length} thẻ cần ôn tập hôm nay`}
                </div>
                {/* Chỉ hiển thị thẻ đầu tiên trong danh sách để học */}
                <ReviewCard
                  key={currentCard._id}
                  card={currentCard}
                  isFlipped={isCardFlipped}
                  setIsFlipped={setIsCardFlipped}
                  isEditing={isCardEditing}
                  setIsEditing={setIsCardEditing}
                  onReview={handleReview}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  reviewMode={reviewMode}
                  currentDeck={currentDeck}
                />
                
                {/* Quote Section */}
                <div className="quote-container">
                  <div className="quote-text">
                    {currentQuote.split(/\s*(?:\\n|\n|\/n)\s*/).map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                  <button
                    className="quote-btn"
                    onClick={handleRandomQuote}
                    title="Đổi câu khác (R)"
                    aria-keyshortcuts="R"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card empty-state">
                <h3>🎉 Chúc mừng!</h3>
                <p>
                  {reviewMode === 'retry'
                    ? 'Bạn đã hoàn thành cả vòng bò nhai cỏ hôm nay.'
                    : 'Bạn đã hoàn thành tất cả các thẻ ôn tập cho ngày hôm nay. Hãy tiếp tục với bò nhai cỏ nếu hôm nay có thẻ chưa thuộc.'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  {reviewMode === 'main' && (
                    <button
                      className="btn btn-primary"
                      onClick={openRetryTab}
                    >
                      Tiếp tục với bò nhai cỏ
                    </button>
                  )}
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('add')}
                  >
                    Thêm thẻ mới
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Preview Import */}
      {showImportPreview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="glass-card" style={{ 
            width: '100%', 
            maxWidth: '1200px', 
            backgroundColor: '#1e293b', 
            padding: '2rem', 
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'white' }}>
              Xem trước ({previewCards.length} thẻ)
            </h3>
            
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.75rem', width: '45%' }}>Từ vựng (Mặt trước)</th>
                    <th style={{ padding: '0.75rem', width: '45%' }}>Nghĩa (Mặt sau)</th>
                    <th style={{ padding: '0.75rem', width: '10%', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {previewCards.map((card, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <textarea
                          className="form-control"
                          value={card.front}
                          onChange={(e) => handlePreviewCardChange(index, 'front', e.target.value)}
                          style={{ width: '100%', resize: 'vertical', minHeight: '60px', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <textarea
                          className="form-control"
                          value={card.back}
                          onChange={(e) => handlePreviewCardChange(index, 'back', e.target.value)}
                          style={{ width: '100%', resize: 'vertical', minHeight: '60px', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#ef4444' }} 
                          onClick={() => setPreviewCards(previewCards.filter((_, i) => i !== index))}
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: '#4b5563' }} 
                onClick={() => setShowImportPreview(false)}
                disabled={importLoading}
              >
                Huỷ
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmImport}
                disabled={importLoading}
              >
                {importLoading ? 'Đang xử lý...' : 'Lưu thẻ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
