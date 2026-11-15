import { DIAG } from '../lib/diagnose.js';

// Progres siswa disimpan di localStorage HP ini saja.
const STORAGE_KEY = 'bkk:v1';
const VERSION = 1;

export const INITIAL_PROGRESS = Object.freeze({
  version: VERSION,
  pretestScore: null,
  modules: {},
  missions: {},
  errorCounts: {},
  settings: { reducedMotion: false, showQuadrantLabels: true },
  trial: null,
  quest: { best: {}, cleared: {} },
});

export const ACTIONS = Object.freeze({
  SET_PRETEST: 'SET_PRETEST',
  SET_MODULE_STEP: 'SET_MODULE_STEP',
  COMPLETE_MODULE: 'COMPLETE_MODULE',
  SET_MISSION_STARS: 'SET_MISSION_STARS',
  RECORD_DIAGNOSIS: 'RECORD_DIAGNOSIS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_TRIAL: 'SET_TRIAL',
  QUEST_RESULT: 'QUEST_RESULT',
  RESET: 'RESET',
});

export function progressReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PRETEST:
      return { ...state, pretestScore: action.score };

    case ACTIONS.SET_MODULE_STEP: {
      const mod = state.modules[action.moduleId] ?? {};
      return { ...state, modules: { ...state.modules, [action.moduleId]: { ...mod, step: action.step } } };
    }

    case ACTIONS.COMPLETE_MODULE: {
      const mod = state.modules[action.moduleId] ?? {};
      return { ...state, modules: { ...state.modules, [action.moduleId]: { ...mod, done: true } } };
    }

    case ACTIONS.SET_MISSION_STARS: {
      const prev = state.missions[action.missionId]?.stars ?? 0;
      const stars = Math.max(prev, action.stars);
      return { ...state, missions: { ...state.missions, [action.missionId]: { stars } } };
    }

    case ACTIONS.RECORD_DIAGNOSIS: {
      if (action.diagnosis === DIAG.CORRECT) return state;
      const count = state.errorCounts[action.diagnosis] ?? 0;
      return { ...state, errorCounts: { ...state.errorCounts, [action.diagnosis]: count + 1 } };
    }

    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case ACTIONS.SET_TRIAL:
      return { ...state, trial: action.trial };

    case ACTIONS.QUEST_RESULT: {
      const quest = state.quest ?? INITIAL_PROGRESS.quest;
      const prevBest = quest.best[action.levelId] ?? 0;
      return {
        ...state,
        quest: {
          best: { ...quest.best, [action.levelId]: Math.max(prevBest, action.score) },
          cleared: action.cleared ? { ...quest.cleared, [action.levelId]: true } : quest.cleared,
        },
      };
    }

    case ACTIONS.RESET:
      return { ...INITIAL_PROGRESS, settings: state.settings };

    default:
      return state;
  }
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_PROGRESS };
    const data = JSON.parse(raw);
    if (data?.version !== VERSION) return { ...INITIAL_PROGRESS };
    return {
      ...INITIAL_PROGRESS,
      ...data,
      settings: { ...INITIAL_PROGRESS.settings, ...data.settings },
    };
  } catch {
    return { ...INITIAL_PROGRESS };
  }
}

export function saveProgress(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
