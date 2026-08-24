import { X } from 'lucide-react';

const StudySessionHeader = ({ mode, progress, onExit }) => {
  const title = mode === 'retry' ? 'Bò nhai cỏ' : 'Ôn tập';
  const progressLabel = progress.total > 0
    ? `${progress.current} / ${progress.total}`
    : '0 / 0';

  return (
    <header className="study-session-header">
      <button
        type="button"
        className="study-session-header__exit"
        onClick={onExit}
        aria-label={`Thoát phiên ${title}`}
      >
        <X size={23} aria-hidden="true" />
        <span>Thoát</span>
      </button>

      <div className="study-session-header__title">
        <strong>{title}</strong>
        <span>{progressLabel}</span>
      </div>

      <div
        className="study-session-progress"
        role="progressbar"
        aria-label={`Tiến độ phiên ${title}`}
        aria-valuemin="0"
        aria-valuemax={progress.total}
        aria-valuenow={Math.min(
          progress.total,
          Math.max(0, progress.current - 1),
        )}
      >
        <span style={{ width: `${progress.percentage}%` }} />
      </div>
    </header>
  );
};

export default StudySessionHeader;
