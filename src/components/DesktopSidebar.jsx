import { BookOpen, Folder, LibraryBig, Plus, RotateCcw, X } from 'lucide-react';
import { FALLBACK_DECK_LANGUAGES } from '../constants/deckLanguages';

const DesktopSidebar = ({
  decks,
  currentDeck,
  sidebarCollapsed,
  isDeckDrawerOpen,
  onToggleSidebar,
  onCloseDrawer,
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
  activeTab,
  cardsCount,
  onOpenReview,
  onOpenRetry,
  onOpenManage,
  onOpenAdd,
}) => {
  const languages = availableLanguages.length > 0
    ? availableLanguages
    : FALLBACK_DECK_LANGUAGES;

  return (
    <aside
      id="deck-drawer"
      className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}${
        isDeckDrawerOpen ? ' sidebar--drawer-open' : ''
      }`}
      aria-label="Danh sách học phần"
    >
      <button
        className="sidebar-toggle-btn-top"
        title={sidebarCollapsed ? 'Mở rộng danh sách' : 'Thu nhỏ danh sách'}
        onClick={onToggleSidebar}
      >
        <span className={`sidebar-toggle-icon${sidebarCollapsed ? ' rotated' : ''}`}>‹</span>
      </button>

      <div className="sidebar-inner">
        <div className="sidebar-brand">Flashcard App</div>

        <nav className="sidebar-primary-nav" aria-label="Điều hướng nội dung">
          <button
            type="button"
            className={`sidebar-nav-item${activeTab === 'review' ? ' active' : ''}`}
            onClick={onOpenReview}
            aria-current={activeTab === 'review' ? 'page' : undefined}
          >
            <BookOpen size={17} aria-hidden="true" />
            <span>Ôn tập</span>
            {activeTab === 'review' && cardsCount > 0 && (
              <span className="sidebar-nav-count">{cardsCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`sidebar-nav-item${activeTab === 'retry' ? ' active' : ''}`}
            onClick={onOpenRetry}
            aria-current={activeTab === 'retry' ? 'page' : undefined}
          >
            <RotateCcw size={17} aria-hidden="true" />
            <span>Bò nhai cỏ</span>
            {activeTab === 'retry' && cardsCount > 0 && (
              <span className="sidebar-nav-count">{cardsCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`sidebar-nav-item${activeTab === 'manage' ? ' active' : ''}`}
            onClick={onOpenManage}
            aria-current={activeTab === 'manage' ? 'page' : undefined}
          >
            <LibraryBig size={17} aria-hidden="true" />
            <span>Thẻ</span>
          </button>
          <button
            type="button"
            className={`sidebar-nav-item${activeTab === 'add' ? ' active' : ''}`}
            onClick={onOpenAdd}
            aria-current={activeTab === 'add' ? 'page' : undefined}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Thêm</span>
          </button>
        </nav>

        <div className="sidebar-header">
          <span className="sidebar-title">Học phần</span>
          <div className="sidebar-header-actions">
            <button
              type="button"
              className="sidebar-add-btn"
              title="Thêm học phần mới"
              aria-label="Thêm học phần mới"
              onClick={onToggleAddDeck}
            >
              <Plus size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={onCloseDrawer}
              aria-label="Đóng danh sách học phần"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {showAddDeck && (
          <form onSubmit={onCreateDeck} className="sidebar-add-form">
            <input
              type="text"
              className="form-control"
              placeholder="Tên học phần (VD: IELTS)..."
              value={newDeckName}
              onChange={(event) => onNewDeckNameChange(event.target.value)}
            />
            <select
              className="form-control"
              value={newDeckLanguage}
              onChange={(event) => onNewDeckLanguageChange(event.target.value)}
              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', padding: '0.5rem' }}
            >
              Lưu
            </button>
          </form>
        )}

        <div className="deck-list">
          {decks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem' }}>
              Chưa có học phần nào
            </p>
          ) : (
            decks.map((deck) => (
              editingDeckId === deck._id ? (
                <div
                  key={deck._id}
                  className="deck-item-container active"
                  style={{ padding: '0.3rem 0.4rem' }}
                >
                  <input
                    type="text"
                    className="form-control deck-rename-input"
                    value={editingDeckName}
                    onChange={(event) => onEditingDeckNameChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                      if (event.key === 'Escape') onCancelRenameDeck();
                    }}
                    onBlur={() => onSaveRenameDeck(deck._id, deck.deckName)}
                    autoFocus
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </div>
              ) : (
                <div
                  key={deck._id}
                  className={`deck-item-container ${currentDeck === deck._id ? 'active' : ''}`}
                >
                  <button
                    className="deck-item-btn"
                    onClick={() => onSelectDeck(deck._id)}
                  >
                    <Folder size={15} aria-hidden="true" />
                    {deck.deckName}
                  </button>
                  <div className="deck-actions">
                    <button
                      className="deck-action-btn"
                      title="Sửa học phần"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartRenameDeck(deck);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      className="deck-action-btn delete"
                      title="Xóa học phần (kèm xóa tất cả thẻ)"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDeck(deck._id, deck.deckName);
                      }}
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
  );
};

export default DesktopSidebar;
