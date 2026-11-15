import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { loadProgress, progressReducer, saveProgress } from './progress.js';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [state, dispatch] = useReducer(progressReducer, undefined, () => loadProgress());

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress harus dipakai di dalam <ProgressProvider>');
  return ctx;
}
