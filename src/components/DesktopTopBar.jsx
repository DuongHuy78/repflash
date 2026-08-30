import { UserRound } from 'lucide-react';
import { getStreakConfig } from '../utils/streakUtils';

const DesktopTopBar = ({
  user,
  profileButtonRef,
  showProfileModal,
  onOpenProfile,
  shouldShowGuidePrompt,
  onOpenHelp,
  onDismissGuide,
}) => {
  const streakConfig = user
    ? getStreakConfig(user.currentStreak || 0)
    : null;

  return (
    <header className="app-header">
      <div className="app-brand">
        <h1>Repflash</h1>
        <p className="subtitle">Học từ vựng hiệu quả vào đúng thời điểm</p>
      </div>

      <div className="app-header-actions">
        {user && (
          <div className="app-header-identity">
            {streakConfig && (
              <div
                className={`streak-badge ${streakConfig.badgeClass}`}
                title={`Danh hiệu: ${streakConfig.title} | Kỷ lục: ${user.longestStreak || 0} ngày`}
              >
                <span className="streak-icon">{streakConfig.icon}</span>
                <span className="streak-count">{user.currentStreak || 0}</span>
                <span className="streak-label">ngày</span>
              </div>
            )}

            <button
              ref={profileButtonRef}
              type="button"
              className="profile-trigger"
              onClick={onOpenProfile}
              title={user.username}
              aria-label={`Tài khoản ${user.username}`}
              aria-haspopup="dialog"
              aria-expanded={showProfileModal}
            >
              <UserRound size={18} aria-hidden="true" />
              <span>{user.username}</span>
            </button>
          </div>
        )}

        <div className="help-btn-wrapper">
          <button
            type="button"
            className={`help-icon-btn ${shouldShowGuidePrompt ? 'help-icon-btn--pulse' : ''}`}
            title="Hướng dẫn sử dụng & Thuật toán SM-2"
            aria-label="Mở hướng dẫn sử dụng"
            onClick={onOpenHelp}
          >
            ?
            {shouldShowGuidePrompt && (
              <span className="help-pulse-ring" aria-hidden="true" />
            )}
          </button>

          {shouldShowGuidePrompt && (
            <div className="help-tooltip-callout" role="tooltip">
              <div className="help-tooltip-callout__arrow" />
              <div className="help-tooltip-callout__body" onClick={onOpenHelp}>
                <span className="help-tooltip-callout__icon">💡</span>
                <div className="help-tooltip-callout__text">
                  <strong>Bạn mới dùng app?</strong>
                  <span>Bấm vào đây để xem cách học & phím tắt nhé!</span>
                </div>
              </div>
              <button
                type="button"
                className="help-tooltip-callout__close"
                onClick={onDismissGuide}
                aria-label="Đóng gợi ý"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopTopBar;
