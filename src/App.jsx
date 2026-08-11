import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BookOpen, LibraryBig, Plus, RefreshCw, RotateCcw, UserRound, X } from 'lucide-react';
import ReviewCard from './components/ReviewCard';
import './index.css'; // Premium CSS
import ManageCards from './components/ManageCards';
import AddCardsPanel from './components/AddCardsPanel';
import AuthPage from './components/AuthPage'; // <--- Import trang Đăng nhập
import QUOTES from './quotes.json';
import { speakText, getAvailableLanguages } from './utils/speechUtils';
import { getStreakConfig } from './utils/streakUtils';
import HelpModal from './components/HelpModal';
import ProfileModal from './components/ProfileModal';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/cards';
const RETRY_API_URL = `${API_URL}/retry`;
const DECK_API_URL = (import.meta.env.VITE_API_URL || '') + '/api/decks';
const USER_API_URL = (import.meta.env.VITE_API_URL || '') + '/api/user';

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
};

const resolveStateUpdate = (nextValue, currentValue) =>
  typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;

function App() {
  // --- PHẦN LOGIC ĐĂNG NHẬP ---
  // B1: Đọc Token từ localStorage khi vừa mở app
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [authMessage, setAuthMessage] = useState('');
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(() => {
    return localStorage.getItem('currentDeck') || '';
  });
  
  // Biến này trả về true nếu có token, false nếu chưa có
  const isAuthenticated = !!token; 

  // Tự động gán token vào Header nếu mở app mà đã có token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Hàm này được gọi khi bên file AuthPage chạy thành công
  const handleLoginSuccess = (newToken) => {
    // 1. Lưu token vào state để App render lại trang học
    setToken(newToken);
    // 2. Lưu token vào localStorage
    localStorage.setItem('token', newToken);
    // 3. Gắn token vào axios defaults header
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setAuthMessage('');
    setAuthErrorMessage('');
  };

  // Xóa toàn bộ dữ liệu phụ thuộc vào phiên đăng nhập.
  const clearSession = useCallback(() => {
    // Xóa token khỏi state, localStorage và Axios header
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];

    setUser(null);
    setShowProfileModal(false);
    setShowHelpModal(false);
    setCards([]);
    setDecks([]);
    setCurrentDeck('');
    localStorage.removeItem('currentDeck');
  }, []);

  // Hàm Đăng xuất do người dùng chủ động bấm.
  const handleLogout = useCallback(() => {
    setAuthMessage('');
    setAuthErrorMessage('');
    clearSession();
  }, [clearSession]);

  // Nếu backend từ chối JWT (hết hạn, sai tokenVersion hoặc user không còn),
  // tự xóa phiên để App render lại AuthPage thay vì giữ giao diện bị kẹt.
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const hasStoredToken = Boolean(localStorage.getItem('token'));

        if (hasStoredToken && (status === 401 || status === 403)) {
          const responseData = error.response?.data;
          const message = typeof responseData === 'string'
            ? responseData
            : responseData?.message || 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.';

          clearSession();
          setAuthMessage('');
          setAuthErrorMessage(message);
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(responseInterceptor);
  }, [clearSession]);
  // -----------------------------

  // Biến lưu thông tin User (gồm currentStreak, longestStreak...)
  const profileButtonRef = useRef(null);

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleProfileSave = async (profileData) => {
    // 1. Gọi PUT `${USER_API_URL}/me` với body là profileData.
    // 2. Gộp user trả về vào state bằng setUser.
    // 3. Return user đã cập nhật để ProfileModal hiển thị trạng thái thành công.

    try {
      const res = await axios.put(`${USER_API_URL}/me`, profileData);
      const updatedUser = res.data.user;
      setUser((currentUser) => ({
        ...currentUser,
        ...updatedUser,
      }));
      return updatedUser
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
      throw new Error(
        'Không thể cập nhật thông tin tài khoản.',
        { cause: error }
      );
    }
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      await axios.put(`${USER_API_URL}/me/password`, passwordData);
      clearSession();
      setAuthErrorMessage('');
      setAuthMessage('Mật khẩu đã được cập nhật. Hãy đăng nhập lại.');
    } catch (error) {
      const responseData = error.response?.data;
      const message = typeof responseData === 'string'
        ? responseData
        : responseData?.message || error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      throw new Error(message, { cause: error });
    }
  };

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${USER_API_URL}/me`);
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile]);

  const [activeTab, setActiveTab] = useState('review'); // 'review', 'retry', 'manage', 'add'
  const [addMode, setAddMode] = useState('manual');
  
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLanguage, setNewDeckLanguage] = useState('ja-JP');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDeckDrawerOpen, setIsDeckDrawerOpen] = useState(false);

  // States cho tính năng đổi tên Học phần trực tiếp (Inline Rename)
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [editingDeckName, setEditingDeckName] = useState('');

  useEffect(() => {
    const updateLangs = () => {
      const langs = getAvailableLanguages();
      if (langs.length > 0) {
        setAvailableLanguages(langs);
      }
    };
    updateLangs();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateLangs;
    }
  }, []);

  useEffect(() => {
    if (currentDeck) {
      localStorage.setItem('currentDeck', currentDeck);
    }
  }, [currentDeck]);

  const fetchDecks = useCallback(async () => {
    try {

      // BẠN SẼ CODE Ở ĐÂY:
      // 1. Gọi axios.get('/api/decks')
      const res = await axios.get(`${DECK_API_URL}`);      
      // 2. Lưu kết quả vào state `decks` bằng hàm setDecks()
      setDecks(res.data);
      if (res.data.length > 0) {
        const isCurrentDeckValid = res.data.some(deck => deck._id === currentDeck);
        if (!currentDeck || !isCurrentDeckValid) {
          setCurrentDeck(res.data[0]._id);
        }
      } else {
        // Nếu tài khoản mới chưa có học phần nào
        setCurrentDeck('');
        setLoading(false); // Tắt loading để giao diện hiển thị trạng thái rỗng
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách học phần", error);
    }
  }, [currentDeck]);

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    try {
      // 1. Gọi API để tạo Deck mới kèm theo language
      await axios.post(DECK_API_URL, { deckName: newDeckName, description: '', language: newDeckLanguage });
      
      // 2. Tải lại danh sách ngay lập tức để Deck mới hiện lên thanh Sidebar
      fetchDecks();
      
      // 3. Xóa chữ trong ô input và Đóng form lại cho gọn
      setNewDeckName('');
      setShowAddDeck(false);
    } catch (error) {
      alert("Có lỗi khi tạo học phần");
    }
  };

  const handleStartRenameDeck = (deck) => {
    setEditingDeckId(deck._id);
    setEditingDeckName(deck.deckName);
  };

  const handleSaveRenameDeck = async (deckId, originalName) => {
    if (!editingDeckName.trim() || editingDeckName.trim() === originalName) {
      setEditingDeckId(null);
      return;
    }

    try {
      await axios.put(`${DECK_API_URL}/${deckId}`, { deckName: editingDeckName.trim() });
      fetchDecks();
    } catch (error) {
      console.error("Lỗi sửa học phần:", error);
      alert("Có lỗi khi đổi tên học phần");
    } finally {
      setEditingDeckId(null);
    }
  };

  const handleDeleteDeck = async (deckId, deckName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học phần "${deckName}"?\n\n⚠️ TẤT CẢ các thẻ thuộc học phần này cũng sẽ bị xóa vĩnh viễn!`)) {
      return;
    }

    try {
      await axios.delete(`${DECK_API_URL}/${deckId}`);
      if (currentDeck === deckId) {
        setCurrentDeck('');
      }
      fetchDecks();
      if (activeTab === 'review') fetchDueCards();
      else if (activeTab === 'retry') fetchRetryCards();
    } catch (error) {
      console.error("Lỗi xóa học phần:", error);
      alert("Có lỗi khi xóa học phần");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDecks();
    }
  }, [isAuthenticated, fetchDecks]);
  
  // Quote state
  const [currentQuote, setCurrentQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

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
    if (!currentDeck) {
      setCards([]);
      setLoading(false); 
      return;
    }
    setLoading(true);
    setLoadError('');
    setReviewMode('main');
    try {
      const res = await axios.get(`${API_URL}?deck=${currentDeck}`);
      setCards(res.data);
    } catch (error) {
      console.error("Error fetching cards:", error.messanger);
      setLoadError('Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 6000.');
    } finally {
      setLoading(false);
    }
  }, [currentDeck]);

  const fetchRetryCards = useCallback(async () => {
    if (!currentDeck) return;
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
  }, [currentDeck]);

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

  const openAddTab = useCallback((mode = 'manual') => {
    setAddMode(mode);
    setActiveTab('add');
  }, []);

  const handleReview = useCallback(async (id, quality) => {
    try {
      const res = await axios.put(`${API_URL}/${id}/review`, { quality });
      const updatedCard = res.data.card || (res.data._id ? res.data : null);
      const { newMilestone, currentStreak } = res.data;

      setCards((currentCards) => {
        const reviewedCard = currentCards.find(card => card._id === id);
        const remainingCards = currentCards.filter(card => card._id !== id);

        if (reviewMode === 'retry' && quality === 1 && (updatedCard || reviewedCard)) {
          return [...remainingCards, updatedCard || reviewedCard];
        }

        return remainingCards;
      });
      setIsCardFlipped(false);

      // Cập nhật streak trực tiếp lên UI (KHÔNG cần gọi fetchUserProfile thừa)
      if (currentStreak !== undefined) {
        setUser((prev) => (prev ? { ...prev, currentStreak } : prev));
      }

      if (newMilestone) {
        console.log("🎉 Bạn vừa mở khóa mốc Streak mới:", newMilestone);
      }
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
        const currentDeckObj = decks.find(d => d._id === currentDeck);
        const deckLang = currentDeckObj?.language || 'ja-JP';
        speakText(currentCard.front, deckLang);
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

  // MÀN HÌNH CHƯA ĐĂNG NHẬP
  if (!isAuthenticated) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        initialSuccessMessage={authMessage}
        initialErrorMessage={authErrorMessage}
      />
    );
  }

  return (
    <div className="app-wrapper app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1>Flashcard App</h1>
          <p className="subtitle">Học từ vựng hiệu quả vào đúng thời điểm</p>
        </div>
        <div className="app-header-actions">
          {user && (() => {
            const streakConfig = getStreakConfig(user.currentStreak || 0);
            return (
              <div 
                className={`streak-badge ${streakConfig.badgeClass}`}
                title={`Danh hiệu: ${streakConfig.title} | Kỷ lục: ${user.longestStreak || 0} ngày`}
              >
                <span className="streak-icon">{streakConfig.icon}</span>
                <span className="streak-count">{user.currentStreak || 0}</span>
                <span className="streak-label">ngày</span>
              </div>
            );
          })()}
          {user && (
            <button
              ref={profileButtonRef}
              type="button"
              className="profile-trigger"
              onClick={() => setShowProfileModal(true)}
              aria-haspopup="dialog"
              aria-expanded={showProfileModal}
            >
              <UserRound size={18} aria-hidden="true" />
              <span>{user.username}</span>
            </button>
          )}
          <button 
            type="button"
            className="help-icon-btn" 
            title="Hướng dẫn sử dụng & Thuật toán SM-2"
            aria-label="Mở hướng dẫn sử dụng"
            onClick={() => setShowHelpModal(true)}
          >
            ?
          </button>
        </div>
      </header>

      <button
        type="button"
        className="mobile-deck-trigger"
        onClick={() => setIsDeckDrawerOpen(true)}
        aria-controls="deck-drawer"
        aria-expanded={isDeckDrawerOpen}
      >
        <span className="mobile-deck-trigger__label">Học phần hiện tại</span>
        <span className="mobile-deck-trigger__value">
          {decks.find((deck) => deck._id === currentDeck)?.deckName || 'Chọn học phần'}
        </span>
        <span className="mobile-deck-trigger__hint" aria-hidden="true">Chọn</span>
      </button>

      {isDeckDrawerOpen && (
        <button
          type="button"
          className="deck-drawer-backdrop"
          onClick={() => setIsDeckDrawerOpen(false)}
          aria-label="Đóng danh sách học phần"
        />
      )}

      <div className="app-layout">
        <aside
          id="deck-drawer"
          className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}${
            isDeckDrawerOpen ? ' sidebar--drawer-open' : ''
          }`}
          aria-label="Danh sách học phần"
        >
          {/* Nút toggle ở trên cùng bên trái */}
          <button
            className="sidebar-toggle-btn-top"
            title={sidebarCollapsed ? 'Mở rộng danh sách' : 'Thu nhỏ danh sách'}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className={`sidebar-toggle-icon${sidebarCollapsed ? ' rotated' : ''}`}>‹</span>
          </button>

          <div className="sidebar-inner">
            <div className="sidebar-header">
              <span className="sidebar-title">Học phần</span>
              <div className="sidebar-header-actions">
                <button
                  type="button"
                  className="sidebar-add-btn"
                  title="Thêm học phần mới"
                  aria-label="Thêm học phần mới"
                  onClick={() => setShowAddDeck(!showAddDeck)}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setIsDeckDrawerOpen(false)}
                  aria-label="Đóng danh sách học phần"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Form tạo học phần mới */}
            {showAddDeck && (
              <form onSubmit={handleCreateDeck} className="sidebar-add-form">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tên học phần (VD: IELTS)..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                />
                <select
                  className="form-control"
                  value={newDeckLanguage}
                  onChange={(e) => setNewDeckLanguage(e.target.value)}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  {availableLanguages.length > 0 ? (
                    availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ja-JP">ja-JP (Tiếng Nhật)</option>
                      <option value="en-US">en-US (Tiếng Anh)</option>
                      <option value="zh-CN">zh-CN (Tiếng Trung)</option>
                      <option value="vi-VN">vi-VN (Tiếng Việt)</option>
                      <option value="ko-KR">ko-KR (Tiếng Hàn)</option>
                    </>
                  )}
                </select>
                <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '0.5rem' }}>Lưu</button>
              </form>
            )}

            {/* Danh sách Học phần */}
            <div className="deck-list">
              {decks.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem' }}>Chưa có học phần nào</p>
              ) : (
                decks.map((deck) => (
                  editingDeckId === deck._id ? (
                    <div key={deck._id} className="deck-item-container active" style={{ padding: '0.3rem 0.4rem' }}>
                      <input
                        type="text"
                        className="form-control deck-rename-input"
                        value={editingDeckName}
                        onChange={(e) => setEditingDeckName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                          if (e.key === 'Escape') {
                            setEditingDeckId(null);
                          }
                        }}
                        onBlur={() => handleSaveRenameDeck(deck._id, deck.deckName)}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  ) : (
                    <div 
                      key={deck._id} 
                      className={`deck-item-container ${currentDeck === deck._id ? 'active' : ''}`}
                    >
                      <button 
                        className="deck-item-btn"
                        onClick={() => {
                          setCurrentDeck(deck._id);
                          setIsDeckDrawerOpen(false);
                        }}
                      >
                        {deck.deckName}
                      </button>
                      <div className="deck-actions">
                        <button 
                          className="deck-action-btn"
                          title="Sửa học phần"
                          onClick={(e) => { e.stopPropagation(); handleStartRenameDeck(deck); }}
                        >
                          ✎
                        </button>
                        <button 
                          className="deck-action-btn delete"
                          title="Xóa học phần (kèm xóa tất cả thẻ)"
                          onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck._id, deck.deckName); }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ================= CỘT PHẢI (MAIN CONTENT) ================= */}
        <div className="main-content">

      <nav className="nav-tabs" aria-label="Điều hướng nội dung">
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
          onClick={() => openAddTab('manual')}
        >
          Thêm thẻ
        </button>
      </nav>

      <main className="tab-content">
        {activeTab === 'add' && (
          <AddCardsPanel
            currentDeck={currentDeck}
            mode={addMode}
            onModeChange={setAddMode}
            onManualCreated={fetchDueCards}
            onBulkImported={openReviewTab}
          />
        )}

        {activeTab === 'manage' && (
          <ManageCards
            currentDeck={currentDeck}
            onOpenImport={() => openAddTab('bulk')}
          />
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
              <div className="glass-card review-panel">
                <div className="review-progress">
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
                  currentDeckLanguage={decks.find(d => d._id === currentDeck)?.language || 'ja-JP'}
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
                    onClick={() => openAddTab('manual')}
                  >
                    Thêm thẻ mới
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

        </div> {/* Đóng main-content */}
      </div> {/* Đóng app-layout */}

      <nav className="mobile-bottom-nav" aria-label="Điều hướng trên điện thoại">
        <button
          type="button"
          className={activeTab === 'review' ? 'active' : ''}
          onClick={openReviewTab}
          aria-current={activeTab === 'review' ? 'page' : undefined}
          aria-label="Ôn tập"
          title="Ôn tập"
        >
          <BookOpen size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={activeTab === 'retry' ? 'active' : ''}
          onClick={openRetryTab}
          aria-current={activeTab === 'retry' ? 'page' : undefined}
          aria-label="Học lại"
          title="Học lại"
        >
          <RotateCcw size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={activeTab === 'manage' ? 'active' : ''}
          onClick={() => setActiveTab('manage')}
          aria-current={activeTab === 'manage' ? 'page' : undefined}
          aria-label="Quản lý thẻ"
          title="Quản lý thẻ"
        >
          <LibraryBig size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => openAddTab('manual')}
          aria-current={activeTab === 'add' ? 'page' : undefined}
          aria-label="Thêm từ"
          title="Thêm từ"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </nav>

      {/* Popup Hướng dẫn sử dụng & Thuật toán SM-2 */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={closeProfileModal}
          onSave={handleProfileSave}
          onChangePassword={handlePasswordChange}
          onLogout={handleLogout}
          returnFocusRef={profileButtonRef}
        />
      )}
    </div> // Đóng app-wrapper
  );
}

export default App;
