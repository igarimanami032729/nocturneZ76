/** JSON 스크립트 기반 게임 타입 정의 */

export interface GameMeta {
  title: string;
  subtitle: string;
  genre: string;
  type: string;
  total_chapters: number;
}

export interface World {
  name: string;
  description: string;
  inner_truth: string;
  secret: {
    title: string;
    description: string;
    mirror_rule: string;
    core_message: string;
  };
}

export interface Character {
  id: string;
  codename: string | null;
  true_name: string;
  role: string;
  type: string;
  description: string;
}

export interface Stats {
  lightGauge: number;
  lightGaugeMax: number;
  memoryFragments: number;
  vocal: number;
  dance: number;
  emotion: number;
  teamwork: number;
  affinityJade: number;
  affinityCrystal: number;
  friendshipGauge: number;
}

export interface DialogueLine {
  speaker: string;
  line: string;
  speaker_label?: string;
}

export interface ChoiceOptionResult {
  title: string;
  narration: string;
  dialogues: DialogueLine[];
  system_alert?: string;
  stat_changes: Record<string, number>;
  flags_added: string[];
  stage_narration?: string[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  note?: string;
  ending_route?: string;
  result: ChoiceOptionResult;
}

export interface Choice {
  id: string;
  prompt: string;
  options: ChoiceOption[];
}

export interface Scene {
  id: string;
  title: string;
  location?: string;
  location_description?: string;
  narration?: string | string[];
  dialogues: DialogueLine[];
  choice?: Choice;
  chapter_clear_message?: string;
  chapter_theme?: string;
  next_scene?: string;
  name_reveal_sequence?: NameRevealStep[];
  finale?: SceneFinale;
  codename_dissolution?: CodenameDissolution;
  closing_theme?: ClosingTheme;
}

export interface NameRevealStep {
  order: number;
  label: string;
  codename: string;
  true_name: string;
  spotlight_narration: string;
  screen_narration?: string;
  dialogue: DialogueLine;
}

export interface SceneFinale {
  narration: string;
  display_names: { codename: string; true_name: string }[];
  core_message: string;
  closing_line: string;
}

export interface CodenameDissolution {
  title: string;
  narration: string;
  guardian_final: string;
  name_lights: { order: number; codename: string; true_name: string; narration: string }[];
  all_lights_on_narration: string;
  final_dialogues: DialogueLine[];
}

export interface ClosingTheme {
  message: string;
  lines: string[];
}

export interface Chapter {
  id: string;
  title: string;
  opening_narration: string[];
  opening_status?: Record<string, string>;
  opening_alert?: string;
  clear_conditions?: { description: string; min_memory_fragments?: number };
  required_memory_fragments?: number;
  scenes: Scene[];
}

export interface EndingCondition {
  choice_5A?: string;
  min_memory_fragments?: number;
  affinity_jade?: string;
  affinity_crystal?: string;
  crystal_light_gauge?: string;
  friendship_gauge?: string;
  min_vocal?: number;
  min_dance?: number;
  min_emotion?: number;
  min_teamwork?: number;
  all_chapters_A_route?: boolean;
  memory_fragments?: number;
  flag_required?: string;
}

export interface Ending {
  id: string;
  title: string;
  english_title: string;
  conditions: EndingCondition;
  description: string;
  theme: string;
}

export interface GameScript {
  game: GameMeta;
  world: World;
  characters: Character[];
  initial_stats: {
    light_gauge: number;
    light_gauge_max: number;
    memory_fragments: number;
    vocal: number;
    dance: number;
    emotion: number;
    teamwork: number;
    affinity_jade: number;
    affinity_crystal: number;
    friendship_gauge: number;
    flags: string[];
  };
  chapters: Chapter[];
  endings: Ending[];
  closing_message: { lines: string[] };
}

/** 챕터 전환 오버레이 데이터 */
export interface ChapterTransitionData {
  chapterNumber: number;
  title: string;
  narration: string[];
  alert?: string;
  pendingSceneId: string;
}

/** 게임 상태 (Zustand) */
export interface GameState {
  currentChapterIndex: number;
  currentSceneId: string;
  stats: Stats;
  flags: string[];
  playerName: string;
  dialogueIndex: number;
  isChoiceVisible: boolean;
  /** 선택지 결과 표시 후 다음 씬으로 넘어가기 전 대기 */
  isShowingChoiceResult: boolean;
  /** 현재 표시 중인 선택지 결과 (있을 때만) */
  choiceResultContent: ChoiceOptionResult | null;
  /** crystal_light_gauge (스크립트에서 별도 사용) */
  crystalLightGauge: number;
  /** 로드된 스크립트 */
  script: GameScript | null;
  /** 현재 엔딩 ID (엔딩 도달 시) */
  currentEndingId: string | null;
  /** 챕터 전환 연출 데이터 */
  chapterTransition: ChapterTransitionData | null;
}

export type EndingId = 'ending_self_confidence' | 'ending_guardian' | 'ending_mission' | 'ending_true';
