import type { GameScript, Scene, Chapter, Ending } from '../types/game';
import { useGameStore } from '../store/gameStore';

const SCRIPT_URL = '/nocturne_z76_script.json';
const MAX_STAT = 999;

let cachedScript: GameScript | null = null;

export async function loadScript(): Promise<GameScript> {
  if (cachedScript) return cachedScript;
  const res = await fetch(SCRIPT_URL);
  if (!res.ok) throw new Error('Failed to load game script');
  const data = await res.json();
  cachedScript = data as GameScript;
  return cachedScript;
}

export function getChapterIndexBySceneId(script: GameScript, sceneId: string): number {
  for (let i = 0; i < script.chapters.length; i++) {
    if (script.chapters[i].scenes.some((s) => s.id === sceneId)) return i;
  }
  return 0;
}

export function getScene(script: GameScript, sceneId: string): { chapter: Chapter; scene: Scene } | null {
  for (const chapter of script.chapters) {
    const scene = chapter.scenes.find((s) => s.id === sceneId);
    if (scene) return { chapter, scene };
  }
  return null;
}

export function getCurrentChapterAndScene(script: GameScript, chapterIndex: number, sceneId: string) {
  const chapter = script.chapters[chapterIndex];
  if (!chapter) return null;
  const scene = chapter.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;
  return { chapter, scene };
}

export function goToScene(sceneId: string): void {
  const script = useGameStore.getState().script;
  if (!script) return;
  const found = getScene(script, sceneId);
  if (!found) return;
  const newChapterIndex = script.chapters.indexOf(found.chapter);
  const currentChapterIndex = useGameStore.getState().currentChapterIndex;

  // 챕터 경계를 넘어갈 때 전환 연출을 표시
  if (newChapterIndex > currentChapterIndex) {
    const newChapter = found.chapter;
    useGameStore.getState().setChapterTransition({
      chapterNumber: newChapterIndex + 1,
      title: newChapter.title,
      narration: newChapter.opening_narration ?? [],
      alert: newChapter.opening_alert,
      pendingSceneId: sceneId,
    });
    return;
  }

  useGameStore.getState().setCurrentScene(newChapterIndex, sceneId);
}

export function continueFromChapterTransition(): void {
  const { chapterTransition, script } = useGameStore.getState();
  if (!chapterTransition || !script) return;
  const found = getScene(script, chapterTransition.pendingSceneId);
  if (!found) return;
  const chapterIndex = script.chapters.indexOf(found.chapter);
  useGameStore.getState().clearChapterTransition();
  useGameStore.getState().setCurrentScene(chapterIndex, chapterTransition.pendingSceneId);
}

export function applyChoice(optionId: string): boolean {
  const { script, currentChapterIndex, currentSceneId } = useGameStore.getState();
  if (!script) return false;

  const { scene } = getCurrentChapterAndScene(script, currentChapterIndex, currentSceneId) ?? {};
  if (!scene?.choice) return false;

  const option = scene.choice.options.find((o) => o.id === optionId);
  if (!option) return false;

  const { result } = option;
  const store = useGameStore.getState();

  // crystal_light_gauge는 별도 필드로 먼저 적용
  if (result.stat_changes.crystal_light_gauge != null) {
    useGameStore.setState((s) => ({
      crystalLightGauge: s.crystalLightGauge + result.stat_changes.crystal_light_gauge!,
    }));
  }

  // 스탯 변경 (999 = MAX)
  const changes: Record<string, number> = { ...result.stat_changes };
  delete changes.crystal_light_gauge;
  for (const key of Object.keys(changes)) {
    if (changes[key] === 999) {
      if (key === 'affinity_crystal') store.applyStatChanges({ affinity_crystal: MAX_STAT - store.stats.affinityCrystal });
      else if (key === 'teamwork') store.applyStatChanges({ teamwork: MAX_STAT - store.stats.teamwork });
      else if (key === 'memory_fragments') store.applyStatChanges({ memory_fragments: 100 - store.stats.memoryFragments });
      delete changes[key];
    }
  }
  if (Object.keys(changes).length > 0) {
    store.applyStatChanges(changes);
  }

  store.addFlags(result.flags_added ?? []);
  store.setChoiceResult(result);
  store.setShowingChoiceResult(true);
  store.setChoiceVisible(false);
  return true;
}

export function confirmChoiceResultAndContinue(): void {
  const { script, currentChapterIndex, currentSceneId } = useGameStore.getState();
  useGameStore.getState().setChoiceResult(null);
  useGameStore.getState().setShowingChoiceResult(false);

  if (!script) return;
  const { scene } = getCurrentChapterAndScene(script, currentChapterIndex, currentSceneId) ?? {};
  const nextSceneId = scene?.next_scene;
  if (nextSceneId) {
    goToScene(nextSceneId);
  }
}

export function checkEnding(): string | null {
  const { script, stats, flags } = useGameStore.getState();
  if (!script?.endings?.length) return null;

  const memory = stats.memoryFragments;
  const jade = stats.affinityJade;
  const crystal = stats.affinityCrystal;
  const friendship = stats.friendshipGauge;
  const crystalLight = useGameStore.getState().crystalLightGauge;

  // 히든 엔딩 먼저
  const trueEnding = script.endings.find((e) => e.id === 'ending_true');
  if (trueEnding && checkEndingConditions(trueEnding, { memory, jade, crystal, friendship, crystalLight }, flags))
    return trueEnding.id;

  // 5장 선택지에 따른 엔딩 (choice_5A)
  const choice5A = getLastChoice5A();
  for (const ending of script.endings) {
    if (ending.id === 'ending_true') continue;
    if (checkEndingConditions(ending, { memory, jade, crystal, friendship, crystalLight }, flags, choice5A))
      return ending.id;
  }
  return null;
}

function getLastChoice5A(): string | undefined {
  if (useGameStore.getState().flags.includes('self_confidence_ending_unlocked')) return '5A_A';
  if (useGameStore.getState().flags.includes('guardian_ending_unlocked')) return '5A_B';
  if (useGameStore.getState().flags.includes('mission_ending_unlocked')) return '5A_C';
  return undefined;
}

function checkEndingConditions(
  ending: Ending,
  ctx: { memory: number; jade: number; crystal: number; friendship: number; crystalLight: number },
  flags: string[],
  choice5A?: string
): boolean {
  const c = ending.conditions;
  if (c.all_chapters_A_route === true) {
    // 히든: 간단화 — 플래그 + memory 100
    if (c.flag_required && !flags.includes(c.flag_required)) return false;
    if (c.memory_fragments !== undefined && ctx.memory < (c.memory_fragments as number)) return false;
    return true;
  }
  if (c.choice_5A) {
    const current = choice5A ?? getLastChoice5A();
    if (current !== c.choice_5A) return false;
  }
  if (c.min_memory_fragments != null && ctx.memory < c.min_memory_fragments) return false;
  if (c.affinity_jade === 'HIGH' && ctx.jade < 50) return false;
  if (c.affinity_crystal === 'HIGH' && ctx.crystal < 50) return false;
  if (c.crystal_light_gauge === 'FULL' && ctx.crystalLight < 30) return false;
  if (c.friendship_gauge === 'MAX' && ctx.friendship < 80) return false;
  if (c.min_vocal != null && useGameStore.getState().stats.vocal < c.min_vocal) return false;
  if (c.min_dance != null && useGameStore.getState().stats.dance < c.min_dance) return false;
  if (c.min_emotion != null && useGameStore.getState().stats.emotion < c.min_emotion) return false;
  if (c.min_teamwork != null && useGameStore.getState().stats.teamwork < c.min_teamwork) return false;
  return true;
}

export function checkLightGaugeReset(): boolean {
  const { stats, script } = useGameStore.getState();
  if (stats.lightGauge <= 0 && script) {
    const chapterIndex = getChapterIndexBySceneId(script, useGameStore.getState().currentSceneId);
    useGameStore.getState().resetToChapterStart(chapterIndex);
    return true;
  }
  return false;
}

export function getSpeakerDisplayName(speakerId: string, _playerName: string): string {
  if (speakerId === 'player') return 'E527 (플레이어)';
  const script = useGameStore.getState().script;
  const char = script?.characters.find((c) => c.id === speakerId);
  return char?.codename ?? char?.true_name ?? speakerId;
}
