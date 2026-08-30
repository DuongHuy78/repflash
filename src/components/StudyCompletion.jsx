import {
  CheckCircle2,
  Flame,
  FolderOpen,
  LibraryBig,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { getStudyCompletionAction } from '../utils/studySessionUtils';

const StudyCompletion = ({
  mode,
  session,
  retryCardsCount,
  currentStreak = 0,
  newMilestone,
  moreNewRemaining = false,
  onContinueRetry,
  onChooseDeck,
  onOpenManage,
}) => {
  const action = getStudyCompletionAction({ mode, retryCardsCount });
  const isRetry = mode === 'retry';
  const isNew = mode === 'new';

  const primaryAction = {
    'continue-retry': {
      label: `Tiếp tục bò nhai cỏ (${retryCardsCount})`,
      icon: RotateCcw,
      onClick: onContinueRetry,
    },
    'choose-deck': {
      label: 'Chọn học phần khác',
      icon: FolderOpen,
      onClick: onChooseDeck,
    },
    finish: {
      label: 'Kết thúc phiên',
      icon: CheckCircle2,
      onClick: onOpenManage,
    },
  }[action];
  const PrimaryIcon = primaryAction.icon;

  return (
    <section className="glass-card study-completion" aria-live="polite">
      <div className="study-completion__hero" aria-hidden="true">
        <Trophy size={34} />
      </div>
      <div className="study-completion__heading">
        <h2>
          {isRetry
            ? 'Đã hoàn thành bò nhai cỏ!'
            : isNew
              ? 'Đã học xong suất từ mới hôm nay!'
              : 'Hoàn thành phiên ôn tập!'}
        </h2>
        <p>
          {isRetry
            ? 'Bạn đã xử lý xong các thẻ cần học lại trong hôm nay.'
            : retryCardsCount > 0
              ? `Còn ${retryCardsCount} thẻ cần nhai lại trong hôm nay.`
              : isNew
                ? moreNewRemaining
                  ? 'Suất hôm nay đã hết. Còn thẻ mới, ngày mai học tiếp.'
                  : 'Bạn đã học xong suất từ mới hôm nay.'
                : 'Bạn đã hoàn thành tất cả thẻ cần học hôm nay.'}
        </p>
      </div>

      <div className="study-completion__streak">
        <span className="study-completion__stat-icon study-completion__stat-icon--fire">
          <Flame size={22} aria-hidden="true" />
        </span>
        <span>Chuỗi ngày học</span>
        <strong>{currentStreak} ngày</strong>
      </div>

      {newMilestone && (
        <div className="study-completion__milestone" role="status">
          <span className="study-completion__stat-icon">
            <Trophy size={22} aria-hidden="true" />
          </span>
          <span>Cột mốc mới</span>
          <strong>Bạn đã học liên tiếp {newMilestone} ngày!</strong>
        </div>
      )}

      <div className="study-completion__stats">
        <div>
          <strong>{session.attemptCount}</strong>
          <span>Lượt trả lời</span>
        </div>
        <div>
          <strong>{session.rememberedCount}</strong>
          <span>Đã nhớ</span>
        </div>
        <div>
          <strong>{session.againCount}</strong>
          <span>Chưa nhớ</span>
        </div>
      </div>

      <div className="study-completion__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={primaryAction.onClick}
        >
          <PrimaryIcon size={20} aria-hidden="true" />
          {primaryAction.label}
        </button>
        {!isRetry && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenManage}
          >
            <LibraryBig size={20} aria-hidden="true" />
            Quản lý thẻ
          </button>
        )}
      </div>
    </section>
  );
};

export default StudyCompletion;
