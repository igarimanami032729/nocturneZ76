import { create } from 'zustand';
import type { GameState, Stats, GameScript, ChoiceOptionResult, ChapterTransitionData } from '../types/game';

const initialStats: Stats = {
  lightGauge: 100,
  lightGaugeMax: 100,
  memoryFragments: 0,
  vocal: 0,
  dance: 0,
  emotion: 0,
  teamwork: 0,
  affinityJade: 0,
  affinityCrystal: 0,
  friendshipGauge: 0,
};

interface GameStore extends GameState {
  setPlayerName: (name: string) => void;
  setScript: (script: GameScript) => void;
  setCurrentScene: (chapterIndex: number, sceneId: string) => void;
  setDialogueIndex: (index: number) => void;
  setChoiceVisible: (visible: boolean) => void;
  setChoiceResult: (result: ChoiceOptionResult | null) => void;
  setShowingChoiceResult: (showing: boolean) => void;
  applyStatChanges: (changes: Record<string, number>) => void;
  addFlags: (newFlags: string[]) => void;
  setCurrentEnding: (endingId: string | null) => void;
  resetToChapterStart: (chapterIndex: number) => void;
  resetGame: () => void;
  nextDialogue: () => void;
  setChapterTransition: (data: ChapterTransitionData) => void;
  clearChapterTransition: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentChapterIndex: 0,
  currentSceneId: 'scene_1_1',
  stats: { ...initialStats },
  flags: [],
  playerName: localStorage.getItem('nocturne_player_name') ?? '',
  dialogueIndex: 0,
  isChoiceVisible: false,
  isShowingChoiceResult: false,
  choiceResultContent: null,
  crystalLightGauge: 0,
  script: null,
  currentEndingId: null,
  chapterTransition: null,

  setPlayerName: (name) => {
    const trimmed = name.trim() || '플레이어';
    localStorage.setItem('nocturne_player_name', trimmed);
    set({ playerName: trimmed });
  },

  setScript: (script) => set({ script }),

  setCurrentScene: (chapterIndex, sceneId) =>
    set({
      currentChapterIndex: chapterIndex,
      currentSceneId: sceneId,
      dialogueIndex: 0,
      isChoiceVisible: false,
      isShowingChoiceResult: false,
      choiceResultContent: null,
    }),

  setDialogueIndex: (index) => set({ dialogueIndex: index }),

  setChoiceVisible: (visible) => set({ isChoiceVisible: visible }),

  setChoiceResult: (content) => set({ choiceResultContent: content }),

  setShowingChoiceResult: (showing) => set({ isShowingChoiceResult: showing }),

  applyStatChanges: (changes) => {
    const MAX = 999;
    set((state) => {
      const next = { ...state.stats };
      for (const [key, value] of Object.entries(changes)) {
        const k = statKeyToStore(key);
        if (k in next) {
          (next as Record<string, number>)[k] = Math.min(
            Math.max((next as Record<string, number>)[k] + value, 0),
            key === 'light_gauge' ? state.stats.lightGaugeMax : MAX
          );
        }
        if (key === 'crystal_light_gauge') {
          return { stats: next, crystalLightGauge: state.crystalLightGauge + value };
        }
      }
      return { stats: next };
    });
  },

  addFlags: (newFlags) =>
    set((state) => ({
      flags: [...new Set([...state.flags, ...newFlags])],
    })),

  setCurrentEnding: (endingId) => set({ currentEndingId: endingId }),

  resetToChapterStart: (chapterIndex) => {
    const { script } = get();
    if (!script?.chapters[chapterIndex]) return;
    const firstScene = script.chapters[chapterIndex].scenes[0];
    set({
      currentChapterIndex: chapterIndex,
      currentSceneId: firstScene.id,
      dialogueIndex: 0,
      isChoiceVisible: false,
      stats: {
        ...get().stats,
        lightGauge: Math.min(get().stats.lightGauge + 50, 100),
      },
    });
  },

  resetGame: () =>
    set({
      currentChapterIndex: 0,
      currentSceneId: 'scene_1_1',
      stats: { ...initialStats },
      flags: [],
      dialogueIndex: 0,
      isChoiceVisible: false,
      isShowingChoiceResult: false,
      choiceResultContent: null,
      crystalLightGauge: 0,
      currentEndingId: null,
      chapterTransition: null,
    }),

  nextDialogue: () => set((s) => ({ dialogueIndex: s.dialogueIndex + 1 })),

  setChapterTransition: (data) => set({ chapterTransition: data }),
  clearChapterTransition: () => set({ chapterTransition: null }),
}));

function statKeyToStore(key: string): string {
  const map: Record<string, string> = {
    light_gauge: 'lightGauge',
    memory_fragments: 'memoryFragments',
    vocal: 'vocal',
    dance: 'dance',
    emotion: 'emotion',
    teamwork: 'teamwork',
    affinity_jade: 'affinityJade',
    affinity_Z314: 'affinityJade',
    affinity_crystal: 'affinityCrystal',
    friendship_gauge: 'friendshipGauge',
  };
  return map[key] ?? key;
}
