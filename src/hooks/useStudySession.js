import { useCallback, useEffect, useReducer } from 'react';
import {
  STUDY_SESSION_STATUS,
  createStudySessionState,
  getStudyProgress,
  isInitialStudyEmpty,
  isStudyCompleted,
  studySessionReducer,
} from '../utils/studySessionUtils';

const useStudySession = ({
  enabled,
  deckId,
  mode,
  cards,
  loading,
}) => {
  const cardCount = cards.length;
  const [session, dispatch] = useReducer(
    studySessionReducer,
    {
      deckId,
      mode,
      cardCount: enabled && !loading ? cardCount : 0,
    },
    createStudySessionState,
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!enabled) {
        dispatch({
          type: 'RESET',
          payload: { deckId, mode, cardCount: 0 },
        });
        return;
      }

      if (!loading) {
        dispatch({
          type: 'SYNC_QUEUE',
          payload: { deckId, mode, cardCount },
        });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cardCount, deckId, enabled, loading, mode]);

  const recordReview = useCallback((quality) => {
    dispatch({ type: 'RECORD_REVIEW', payload: { quality } });
  }, []);

  const resetSession = useCallback((nextState = {}) => {
    dispatch({
      type: 'RESET',
      payload: {
        deckId: nextState.deckId ?? deckId,
        mode: nextState.mode ?? mode,
        cardCount: nextState.cardCount ?? 0,
      },
    });
  }, [deckId, mode]);

  const completedFromQueue = (
    session.status === STUDY_SESSION_STATUS.ACTIVE && cardCount === 0
  );

  return {
    session,
    progress: getStudyProgress(session),
    isInitialEmpty: isInitialStudyEmpty(session, loading, cardCount),
    isCompleted: isStudyCompleted(session) || completedFromQueue,
    recordReview,
    resetSession,
  };
};

export default useStudySession;
