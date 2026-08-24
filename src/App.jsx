import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import ReviewCard from './components/ReviewCard';
import DesktopAppShell from './components/DesktopAppShell';
import StudyCompletion from './components/StudyCompletion';
import StudySessionHeader from './components/StudySessionHeader';
import './index.css'; // Premium CSS
import ManageCards from './components/ManageCards';
import AddCardsPanel from './components/AddCardsPanel';
import AuthPage from './components/AuthPage'; // <--- Import trang Đăng nhập
import QUOTES from './quotes.json';
import { speakText, getAvailableLanguages } from './utils/speechUtils';
import { getCardSpeechText } from './utils/cardContentUtils';
import useStudySession from './hooks/useStudySession';
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
  const [isFullscreenFlow, setIsFullscreenFlow] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [decksLoaded, setDecksLoaded] = useState(false);
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCardsCount, setRetryCardsCount] = useState(0);
  const [sessionMilestone, setSessionMilestone] = useState(null);
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
    setIsFullscreenFlow(false);
    setGuideDismissed(false);
    setDecksLoaded(false);
    setCards([]);
    setRetryCardsCount(0);
    setSessionMilestone(null);
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
    if (!isAuthenticated) return undefined;

    const timeoutId = window.setTimeout(fetchUserProfile, 0);
    return () => window.clearTimeout(timeoutId);
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
    } finally {
      setDecksLoaded(true);
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
      console.error('Lỗi tạo học phần:', error);
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
    if (!isAuthenticated) return undefined;

    const timeoutId = window.setTimeout(fetchDecks, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, fetchDecks]);
  
  // Quote state
  const [currentQuote, setCurrentQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const [cardUiState, setCardUiState] = useState({
    cardId: null,
    isFlipped: false,
    isEditing: false,
    isPronunciationVisible: false,
  });

  const currentCard = cards[0];
  const currentCardId = currentCard?._id;
  const reviewMode = activeTab === 'retry' ? 'retry' : 'main';
  const isStudyTab = ['review', 'retry'].includes(activeTab);
  const {
    session: studySession,
    progress: sessionProgress,
    isInitialEmpty: isInitialStudyEmpty,
    isCompleted: isStudyCompleted,
    recordReview: recordStudyReview,
  } = useStudySession({
    enabled: isStudyTab,
    deckId: currentDeck,
    mode: reviewMode,
    cards,
    loading,
  });
  const studyProgress = sessionProgress.total > 0
    ? sessionProgress
    : {
        current: cards.length > 0 ? 1 : 0,
        total: cards.length,
        percentage: 0,
      };
  const isFocusedStudy = Boolean(
    isStudyTab &&
    !loading &&
    !loadError &&
    (cards.length > 0 || isStudyCompleted)
  );
  const isCurrentCardUiState = cardUiState.cardId === currentCardId;
  const isCardFlipped = isCurrentCardUiState ? cardUiState.isFlipped : false;
  const isCardEditing = isCurrentCardUiState ? cardUiState.isEditing : false;
  const isPronunciationVisible = isCurrentCardUiState
    ? cardUiState.isPronunciationVisible
    : false;

  const setIsCardFlipped = useCallback((nextValue) => {
    setCardUiState((state) => {
      const isCurrent = state.cardId === currentCardId;
      const currentFlipped = isCurrent ? state.isFlipped : false;

      return {
        cardId: currentCardId,
        isFlipped: resolveStateUpdate(nextValue, currentFlipped),
        isEditing: isCurrent ? state.isEditing : false,
        isPronunciationVisible: isCurrent ? state.isPronunciationVisible : false,
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
        isPronunciationVisible: isCurrent ? state.isPronunciationVisible : false,
      };
    });
  }, [currentCardId]);

  const toggleCurrentCardPronunciation = useCallback(() => {
    setCardUiState((state) => {
      const isCurrent = state.cardId === currentCardId;

      return {
        cardId: currentCardId,
        isFlipped: isCurrent ? state.isFlipped : false,
        isEditing: isCurrent ? state.isEditing : false,
        isPronunciationVisible: isCurrent ? !state.isPronunciationVisible : true,
      };
    });
  }, [currentCardId]);

  const fetchRetryCount = useCallback(async () => {
    if (!currentDeck) {
      setRetryCardsCount(0);
      return 0;
    }

    try {
      const response = await axios.get(RETRY_API_URL, {
        params: { deckId: currentDeck },
      });
      const count = Array.isArray(response.data) ? response.data.length : 0;
      setRetryCardsCount(count);
      return count;
    } catch (error) {
      console.warn('Không tải được số thẻ bò nhai cỏ:', error);
      setRetryCardsCount(0);
      return 0;
    }
  }, [currentDeck]);

  const fetchDueCards = useCallback(async () => {
    if (!currentDeck) {
      setCards([]);
      setRetryCardsCount(0);
      setSessionMilestone(null);
      setLoading(false); 
      return;
    }
    setLoading(true);
    setLoadError('');
    setSessionMilestone(null);
    try {
      const res = await axios.get(API_URL, {
        params: { deckId: currentDeck },
      });
      setCards(res.data);
      await fetchRetryCount();
    } catch (error) {
      console.error("Error fetching cards:", error.messanger);
      setLoadError('Không kết nối được backend. Hãy kiểm tra backend đang chạy ở cổng 6000.');
    } finally {
      setLoading(false);
    }
  }, [currentDeck, fetchRetryCount]);

  const fetchRetryCards = useCallback(async () => {
    if (!currentDeck) {
      setCards([]);
      setRetryCardsCount(0);
      setSessionMilestone(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    setSessionMilestone(null);
    try {
      const res = await axios.get(RETRY_API_URL, {
        params: { deckId: currentDeck },
      });
      setCards(res.data);
      setRetryCardsCount(Array.isArray(res.data) ? res.data.length : 0);
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
  }, [setCurrentQuote]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (activeTab === 'review') fetchDueCards();
      else if (activeTab === 'retry') fetchRetryCards();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDueCards, fetchRetryCards, activeTab, currentDeck]);

  const openReviewTab = useCallback(() => {
    setIsFullscreenFlow(false);
    if (activeTab === 'review') fetchDueCards();
    else {
      setCards([]);
      setLoading(true);
      setLoadError('');
      setIsDeckDrawerOpen(false);
      setActiveTab('review');
    }
  }, [activeTab, fetchDueCards]);

  const openRetryTab = useCallback(() => {
    setIsFullscreenFlow(false);
    if (activeTab === 'retry') fetchRetryCards();
    else {
      setCards([]);
      setLoading(true);
      setLoadError('');
      setIsDeckDrawerOpen(false);
      setActiveTab('retry');
    }
  }, [activeTab, fetchRetryCards]);

  const openManageTab = useCallback(() => {
    setIsFullscreenFlow(false);
    setIsDeckDrawerOpen(false);
    setActiveTab('manage');
  }, []);

  const handleChooseDeck = useCallback(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsDeckDrawerOpen(true);
    } else {
      setActiveTab('manage');
    }
  }, []);

  const openAddTab = useCallback((mode = 'manual') => {
    setIsFullscreenFlow(false);
    setIsDeckDrawerOpen(false);
    setAddMode(mode);
    setActiveTab('add');
  }, []);

  const handleSelectDeck = useCallback((deckId) => {
    if (isStudyTab) {
      setCards([]);
      setLoading(true);
      setLoadError('');
    }
    setCurrentDeck(deckId);
    setIsDeckDrawerOpen(false);
  }, [isStudyTab]);

  const handleReview = useCallback(async (id, quality) => {
    try {
      const res = await axios.put(`${API_URL}/${id}/review`, { quality });
      const updatedCard = res.data.card || (res.data._id ? res.data : null);
      const { newMilestone, currentStreak } = res.data;
      recordStudyReview(quality);

      setCards((currentCards) => {
        const reviewedCard = currentCards.find(card => card._id === id);
        const remainingCards = currentCards.filter(card => card._id !== id);

        if (reviewMode === 'retry' && quality === 1 && (updatedCard || reviewedCard)) {
          return [...remainingCards, updatedCard || reviewedCard];
        }

        return remainingCards;
      });

      if (reviewMode === 'main' && quality === 1) {
        setRetryCardsCount((count) => count + 1);
      } else if (reviewMode === 'retry' && quality === 3) {
        setRetryCardsCount((count) => Math.max(0, count - 1));
      }
      setIsCardFlipped(false);

      // Cập nhật streak trực tiếp lên UI (KHÔNG cần gọi fetchUserProfile thừa)
      if (currentStreak !== undefined) {
        setUser((prev) => (prev ? { ...prev, currentStreak } : prev));
      }

      if (newMilestone) {
        setSessionMilestone(newMilestone);
      }
    } catch (error) {
      console.error("Error reviewing card:", error);
    }
  }, [recordStudyReview, reviewMode, setIsCardFlipped]);

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

      if (key === 'h' && !isCardFlipped && currentCard.pronunciation?.trim()) {
        event.preventDefault();
        toggleCurrentCardPronunciation();
        return;
      }

      if (key === 'v' && currentCard && !isCardEditing) {
        event.preventDefault();
        const currentDeckObj = decks.find(d => d._id === currentDeck);
        const deckLang = currentDeckObj?.language || 'ja-JP';
        speakText(getCardSpeechText(currentCard, deckLang), deckLang);
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
    decks,
    handleRandomQuote,
    handleReview,
    isCardEditing,
    isCardFlipped,
    loadError,
    loading,
    setIsCardEditing,
    setIsCardFlipped,
    reviewMode,
    toggleCurrentCardPronunciation,
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
      setCards((currentCards) => currentCards.filter(card => card._id !== id));
      if (reviewMode === 'retry') {
        setRetryCardsCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Có lỗi xảy ra khi xóa thẻ");
    }
  };

  // Quản lý Spotlight hướng dẫn cho người dùng mới (chưa có học phần)
  const hasSeenGuide = user?._id
    ? localStorage.getItem(`has_seen_guide_${user._id}`) === 'true'
    : false;

  const shouldShowGuidePrompt = Boolean(
    isAuthenticated &&
    decksLoaded &&
    decks.length === 0 &&
    !hasSeenGuide &&
    !guideDismissed
  );

  const handleOpenHelp = useCallback(() => {
    setShowHelpModal(true);
    if (user?._id) {
      localStorage.setItem(`has_seen_guide_${user._id}`, 'true');
    }
    setGuideDismissed(true);
  }, [user]);

  const handleDismissGuide = useCallback((e) => {
    e.stopPropagation();
    if (user?._id) {
      localStorage.setItem(`has_seen_guide_${user._id}`, 'true');
    }
    setGuideDismissed(true);
  }, [user]);

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
    <DesktopAppShell
      topBarProps={{
        user,
        profileButtonRef,
        showProfileModal,
        onOpenProfile: () => setShowProfileModal(true),
        shouldShowGuidePrompt,
        onOpenHelp: handleOpenHelp,
        onDismissGuide: handleDismissGuide,
      }}
      sidebarProps={{
        decks,
        currentDeck,
        sidebarCollapsed,
        isDeckDrawerOpen,
        onToggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
        onCloseDrawer: () => setIsDeckDrawerOpen(false),
        showAddDeck,
        onToggleAddDeck: () => setShowAddDeck(!showAddDeck),
        newDeckName,
        onNewDeckNameChange: setNewDeckName,
        newDeckLanguage,
        onNewDeckLanguageChange: setNewDeckLanguage,
        availableLanguages,
        onCreateDeck: handleCreateDeck,
        editingDeckId,
        editingDeckName,
        onEditingDeckNameChange: setEditingDeckName,
        onCancelRenameDeck: () => setEditingDeckId(null),
        onSaveRenameDeck: handleSaveRenameDeck,
        onStartRenameDeck: handleStartRenameDeck,
        onDeleteDeck: handleDeleteDeck,
        onSelectDeck: handleSelectDeck,
      }}
      decks={decks}
      currentDeck={currentDeck}
      isDeckDrawerOpen={isDeckDrawerOpen}
      onOpenDeckDrawer={() => setIsDeckDrawerOpen(true)}
      onCloseDeckDrawer={() => setIsDeckDrawerOpen(false)}
      activeTab={activeTab}
      cardsCount={cards.length}
      isFocusedStudy={isFocusedStudy}
      isFullscreenFlow={isFullscreenFlow}
      onOpenReview={openReviewTab}
      onOpenRetry={openRetryTab}
      onOpenManage={openManageTab}
      onOpenAdd={() => openAddTab('manual')}
      overlays={(
        <>
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
        </>
      )}
    >
        {activeTab === 'add' && (
          <AddCardsPanel
            currentDeck={currentDeck}
            mode={addMode}
            onModeChange={setAddMode}
            onManualCreated={fetchDueCards}
            onBulkImported={openReviewTab}
            onFullscreenChange={setIsFullscreenFlow}
          />
        )}

        {activeTab === 'manage' && (
          <ManageCards
            currentDeck={currentDeck}
            onOpenImport={() => openAddTab('bulk')}
            onFullscreenChange={setIsFullscreenFlow}
          />
        )}

        {isStudyTab && (
          <div className={`study-page${isFocusedStudy ? ' study-page--focused' : ''}${isStudyCompleted ? ' study-page--completed' : ''}`}>
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
              <>
                <StudySessionHeader
                  mode={reviewMode}
                  progress={studyProgress}
                  onExit={openManageTab}
                />
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
                    isPronunciationVisible={isPronunciationVisible}
                    onTogglePronunciation={toggleCurrentCardPronunciation}
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
              </>
            ) : isStudyCompleted ? (
              <StudyCompletion
                mode={reviewMode}
                session={studySession}
                retryCardsCount={retryCardsCount}
                currentStreak={user?.currentStreak || 0}
                newMilestone={sessionMilestone}
                onContinueRetry={openRetryTab}
                onChooseDeck={handleChooseDeck}
                onOpenManage={openManageTab}
              />
            ) : (
              <div className="glass-card empty-state study-initial-empty" data-empty={isInitialStudyEmpty || undefined}>
                <h3>
                  {!currentDeck
                    ? 'Chưa chọn học phần'
                    : reviewMode === 'retry'
                      ? 'Chưa có thẻ cần nhai lại'
                      : 'Hôm nay không còn thẻ đến hạn'}
                </h3>
                <p>
                  {!currentDeck
                    ? 'Hãy chọn hoặc tạo học phần để bắt đầu học.'
                    : reviewMode === 'retry'
                      ? 'Các thẻ bạn trả lời sai trong hôm nay sẽ xuất hiện ở đây.'
                      : 'Bạn có thể chọn học phần khác hoặc thêm thẻ mới.'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  {reviewMode === 'main' && retryCardsCount > 0 ? (
                    <button
                      className="btn btn-primary"
                      onClick={openRetryTab}
                    >
                      Tiếp tục với bò nhai cỏ ({retryCardsCount})
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleChooseDeck}>
                      Chọn học phần
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => openAddTab('manual')}
                  >
                    Thêm thẻ mới
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </DesktopAppShell>
  );
}

export default App;
