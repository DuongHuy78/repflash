import { useRef } from 'react';
import DesktopSidebar from './DesktopSidebar';
import DesktopTopBar from './DesktopTopBar';
import MobileBottomNav from './MobileBottomNav';
import MobileDeckSheet from './MobileDeckSheet';

const DesktopAppShell = ({
  topBarProps,
  sidebarProps,
  decks,
  currentDeck,
  isDeckDrawerOpen,
  onOpenDeckDrawer,
  onCloseDeckDrawer,
  activeTab,
  cardsCount,
  onOpenReview,
  onOpenRetry,
  onOpenManage,
  onOpenAdd,
  isFocusedStudy = false,
  isFullscreenFlow = false,
  children,
  overlays,
}) => {
  const mobileDeckTriggerRef = useRef(null);
  const currentDeckName = decks.find((deck) => deck._id === currentDeck)?.deckName;
  const hideMobileChrome = isFocusedStudy || isFullscreenFlow;

  return (
    <div className={`app-wrapper app-shell${sidebarProps.sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}${isFocusedStudy ? ' app-shell--focused-study' : ''}${isFullscreenFlow ? ' app-shell--fullscreen-flow' : ''}`}>
      <DesktopTopBar {...topBarProps} />

      <button
        ref={mobileDeckTriggerRef}
        type="button"
        className="mobile-deck-trigger"
        onClick={onOpenDeckDrawer}
        aria-controls="mobile-deck-sheet"
        aria-expanded={isDeckDrawerOpen}
      >
        <span className="mobile-deck-trigger__label">Học phần hiện tại</span>
        <span className="mobile-deck-trigger__value">
          {currentDeckName || 'Chọn học phần'}
        </span>
        <span className="mobile-deck-trigger__hint" aria-hidden="true">Chọn</span>
      </button>

      <div className="app-layout">
        <DesktopSidebar
          {...sidebarProps}
          activeTab={activeTab}
          cardsCount={cardsCount}
          onOpenReview={onOpenReview}
          onOpenRetry={onOpenRetry}
          onOpenManage={onOpenManage}
          onOpenAdd={onOpenAdd}
        />

        <div className="main-content">
          <main className="tab-content">{children}</main>
        </div>
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        hidden={hideMobileChrome}
        onOpenReview={onOpenReview}
        onOpenRetry={onOpenRetry}
        onOpenManage={onOpenManage}
        onOpenAdd={onOpenAdd}
      />

      <MobileDeckSheet
        {...sidebarProps}
        open={isDeckDrawerOpen}
        returnFocusRef={mobileDeckTriggerRef}
        onClose={onCloseDeckDrawer}
      />

      {overlays}
    </div>
  );
};

export default DesktopAppShell;
