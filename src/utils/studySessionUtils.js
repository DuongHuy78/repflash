export const STUDY_MODE = {
  MAIN: 'main',
  RETRY: 'retry',
  NEW: 'new',
};

export const STUDY_SESSION_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

export const createStudySessionState = ({
  deckId = '',
  mode = STUDY_MODE.MAIN,
  cardCount = 0,
} = {}) => ({
  key: `${deckId}:${mode}`,
  deckId,
  mode,
  status: cardCount > 0
    ? STUDY_SESSION_STATUS.ACTIVE
    : STUDY_SESSION_STATUS.IDLE,
  initialCardCount: Math.max(0, cardCount),
  completedCardCount: 0,
  attemptCount: 0,
  rememberedCount: 0,
  againCount: 0,
});

const syncQueue = (state, payload = {}) => {
  const deckId = payload.deckId || '';
  const mode = payload.mode || STUDY_MODE.MAIN;
  const cardCount = Math.max(0, payload.cardCount || 0);
  const nextKey = `${deckId}:${mode}`;

  if (state.key !== nextKey) {
    return createStudySessionState({ deckId, mode, cardCount });
  }

  if (state.status === STUDY_SESSION_STATUS.IDLE && cardCount > 0) {
    return {
      ...state,
      status: STUDY_SESSION_STATUS.ACTIVE,
      initialCardCount: cardCount,
    };
  }

  if (state.status === STUDY_SESSION_STATUS.ACTIVE && cardCount === 0) {
    return {
      ...state,
      status: STUDY_SESSION_STATUS.COMPLETED,
    };
  }

  if (state.status === STUDY_SESSION_STATUS.COMPLETED && cardCount > 0) {
    return createStudySessionState({ deckId, mode, cardCount });
  }

  return state;
};

const recordReview = (state, payload = {}) => {
  if (state.status !== STUDY_SESSION_STATUS.ACTIVE) return state;

  const quality = Number(payload.quality);
  const isAgain = quality === 1;
  const isRetry = state.mode === STUDY_MODE.RETRY;
  const isRemembered = isRetry ? quality === 3 : quality >= 2 && quality <= 4;
  const isCompletedCard = isRetry ? quality === 3 : quality >= 1 && quality <= 4;

  if (!isAgain && !isRemembered) return state;

  return {
    ...state,
    completedCardCount: state.completedCardCount + (isCompletedCard ? 1 : 0),
    attemptCount: state.attemptCount + 1,
    rememberedCount: state.rememberedCount + (isRemembered ? 1 : 0),
    againCount: state.againCount + (isAgain ? 1 : 0),
  };
};

export const studySessionReducer = (state, action = {}) => {
  switch (action.type) {
    case 'SYNC_QUEUE':
      return syncQueue(state, action.payload);
    case 'RECORD_REVIEW':
      return recordReview(state, action.payload);
    case 'RESET':
      return createStudySessionState(action.payload);
    default:
      return state;
  }
};

export const isInitialStudyEmpty = (session, loading, cardCount) => (
  !loading &&
  session.status === STUDY_SESSION_STATUS.IDLE &&
  cardCount === 0
);

export const isStudyCompleted = (session) => (
  session.status === STUDY_SESSION_STATUS.COMPLETED
);

export const getStudyProgress = (session) => {
  if (!session.initialCardCount) {
    return { current: 0, total: 0, percentage: 0 };
  }

  const completed = Math.min(
    session.completedCardCount,
    session.initialCardCount,
  );

  return {
    current: Math.min(completed + 1, session.initialCardCount),
    total: session.initialCardCount,
    percentage: Math.round((completed / session.initialCardCount) * 100),
  };
};

export const getStudyCompletionAction = ({ mode, retryCardsCount = 0 }) => {
  if (mode === STUDY_MODE.RETRY) return 'finish';
  // Ôn tập và Từ mới: Again đã vào bò nhai cỏ thì ưu tiên tiếp tục nhai.
  return retryCardsCount > 0 ? 'continue-retry' : 'choose-deck';
};
