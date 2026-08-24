import { BookOpen, LibraryBig, Plus, RotateCcw } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'review', label: 'Ôn tập', icon: BookOpen, callback: 'onOpenReview' },
  { key: 'retry', label: 'Bò nhai cỏ', icon: RotateCcw, callback: 'onOpenRetry' },
  { key: 'manage', label: 'Thẻ', icon: LibraryBig, callback: 'onOpenManage' },
  { key: 'add', label: 'Thêm', icon: Plus, callback: 'onOpenAdd' },
];

const MobileBottomNav = ({
  activeTab,
  hidden = false,
  onOpenReview,
  onOpenRetry,
  onOpenManage,
  onOpenAdd,
}) => {
  const callbacks = {
    onOpenReview,
    onOpenRetry,
    onOpenManage,
    onOpenAdd,
  };

  if (hidden) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng chính">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={isActive ? 'active' : ''}
            onClick={callbacks[item.callback]}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
          >
            <Icon size={21} aria-hidden="true" />
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
