import { BookOpen, LibraryBig, Plus, RotateCcw, Sprout } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'review', label: 'Ôn tập', icon: BookOpen, callback: 'onOpenReview' },
  { key: 'new', label: 'Từ mới', icon: Sprout, callback: 'onOpenNew' },
  { key: 'add', label: 'Thêm', icon: Plus, callback: 'onOpenAdd', prominent: true },
  { key: 'retry', label: 'Bò nhai cỏ', icon: RotateCcw, callback: 'onOpenRetry' },
  { key: 'manage', label: 'Thẻ', icon: LibraryBig, callback: 'onOpenManage' },
];

const MobileBottomNav = ({
  activeTab,
  hidden = false,
  onOpenReview,
  onOpenNew,
  onOpenRetry,
  onOpenManage,
  onOpenAdd,
}) => {
  const callbacks = {
    onOpenReview,
    onOpenNew,
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
        const itemClassName = [
          item.prominent ? 'mobile-bottom-nav__item--add' : '',
          isActive ? 'active' : '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={item.key}
            type="button"
            className={itemClassName}
            onClick={callbacks[item.callback]}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
          >
            {item.prominent ? (
              <span className="mobile-bottom-nav__fab" aria-hidden="true">
                <Icon size={20} />
              </span>
            ) : (
              <Icon size={18} aria-hidden="true" />
            )}
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
