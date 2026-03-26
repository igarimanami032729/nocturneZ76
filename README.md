🪐# 녹턴 Z76 (Nocturne Z76)

## 프로젝트 소개
**녹턴 Z76**은 선택지 분기형 스토리를 기반으로 진행되는 비주얼 노벨/롤플레잉형 게임입니다.  
플레이어는 챕터를 따라 대사를 읽고 선택을 진행하며, 선택 결과에 따라 스탯(빛 게이지, 기억 조각, 호감도 등)과 플래그가 변화하고 최종 엔딩이 달라집니다.

게임의 제목이자 배경이 되는 ‘녹턴 Z76’에서 ‘녹턴(Nocturne)’은 밤의 서정적이고 고요한 감성을 상징합니다. 겉으로는 아름답고 평온해 보이는 이 행성 안에서는, 각자가 ‘진짜의 나’를 찾기 위해 치열하게 살아가는 인물들이 존재합니다. 특히 아이돌 연습생이라는 설정을 통해, 끊임없이 경쟁하고 스스로를 증명해야 하는 현대 사회의 모습을 은유적으로 담아냈습니다.

본 프로젝트는 바쁘게 흘러가는 일상 속에서 우리가 놓치고 있는 ‘자기 자신’에 대한 질문을 던지며, 플레이어가 결국 가장 중요하게 마주해야 할 대상은 타인이 아닌 ‘나 자신’임을 이야기합니다. 그리고 그 깨달음을 통해, 다시 앞으로 나아갈 수 있는 내적 동기를 전달하고자 합니다.
즐거운 게임 되세요~~~

주요 연출 요소:
- 눈 열림/깜빡임 오버레이
- 챕터 전환 브리핑 화면(`INTEL BRIEFING`)
- 씬별 배경/캐릭터 이미지 교체
- 구간별 BGM 전환

---

## 사용 기술
- **Frontend**: React 19, TypeScript, Vite
- **라우팅**: `react-router-dom`
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS + 컴포넌트 인라인 스타일 + `src/index.css`
- **콘텐츠 구동 방식**: JSON 스크립트(`public/nocturne_z76_script.json`) 기반

---

## 실행 방법
```bash
npm install
npm run dev
```

- 개발 서버: `http://localhost:5173`

빌드/검증:
```bash
npm run build
npm run lint
```

---

## 프로젝트 구조
```text
녹턴Z76/
├─ public/                         # 이미지, BGM, 영상, 게임 스크립트(JSON)
│  └─ nocturne_z76_script.json
├─ src/
│  ├─ components/                  # 화면/연출 컴포넌트
│  │  ├─ TitleScreen.tsx
│  │  ├─ IntroScreen.tsx
│  │  ├─ GameScreen.tsx
│  │  ├─ DialogueScreen.tsx
│  │  ├─ ChoiceScreen.tsx
│  │  ├─ ChoiceResultScreen.tsx
│  │  ├─ ChapterTransitionScreen.tsx
│  │  ├─ NameRevealScreen.tsx
│  │  └─ EndingScreen.tsx
│  ├─ game/
│  │  ├─ engine.ts                 # 스크립트 로드/씬 이동/선택 적용/엔딩 판정
│  │  └─ sceneBackgrounds.ts       # 씬별 배경 매핑
│  ├─ store/
│  │  └─ gameStore.ts              # 전역 게임 상태(Zustand)
│  ├─ types/
│  │  └─ game.ts                   # 게임 데이터 타입 정의
│  ├─ bgm.ts                       # BGM 싱글톤 재생/정지 매니저
│  ├─ App.tsx                      # 라우트 구성
│  ├─ main.tsx                     # 앱 엔트리 포인트
│  └─ index.css                    # 글로벌 스타일/폰트/타이틀 이펙트
├─ package.json
└─ README.md
```

---

## 라우팅 구조
`src/App.tsx` 기준:
- `/` → `TitleScreen`
- `/name` → `NameInputScreen`
- `/intro` → `IntroScreen`
- `/game` → `GameScreen`
- `/ending` → `EndingScreen`

---

## 핵심 기능(중요)
### 1) JSON 스크립트 기반 “씬 구동”
- 게임은 `public/nocturne_z76_script.json`을 `src/game/engine.ts`의 `loadScript()`로 불러옵니다.
- 현재 씬은 `src/store/gameStore.ts`의 `currentSceneId`와 `dialogueIndex`로 추적합니다.
- `GameScreen`은 `currentSceneId`에 따라 화면을 분기하고, 기본적으로 `DialogueScreen`에 `uiVisible` 상태를 내려서 타이핑/표시 타이밍을 제어합니다.

관련 코드:
- `src/game/engine.ts`: `loadScript()`, `getCurrentChapterAndScene()`, `goToScene()`
- `src/components/GameScreen.tsx`: 씬 분기 + 오버레이/BGM 제어
- `src/components/DialogueScreen.tsx`: `dialogueIndex`에 해당하는 라인 타이핑 렌더링

### 2) 선택지 → 스탯/플래그 반영 → 결과 대사까지 “연결”
- `ChoiceScreen`에서 사용자가 옵션 버튼을 누르면 `engine.applyChoice(optionId)`가 호출됩니다.
- `applyChoice()`는 선택 결과의 `stat_changes`를 스토어의 `stats`에 반영하고, `flags_added`를 `flags`에 추가하며, `choiceResultContent`를 세팅한 뒤 `isShowingChoiceResult=true`로 바꿉니다.
- 이어서 `GameScreen`이 `ChoiceResultScreen`을 보여주고, `ChoiceResultScreen`은
  - `phase='result'`: 결과 발표(스탯 변화)
  - `phase='dialogue'`: 결과에 포함된 `dialogues`를 타이핑으로 출력
  - 끝나면 `confirmChoiceResultAndContinue()`로 `scene.next_scene`으로 이동합니다.

관련 코드:
- `src/game/engine.ts`: `applyChoice()`, `confirmChoiceResultAndContinue()`
- `src/components/ChoiceScreen.tsx`: 옵션 UI + `applyChoice()`
- `src/components/ChoiceResultScreen.tsx`: phase 전환 + 결과 후 다음 씬 이동

### 3) 챕터 전환 “브리핑 연출” (챕터 경계 처리)
- `goToScene(sceneId)`에서 “챕터 인덱스가 증가하는지”를 검사합니다.
- 챕터 경계를 넘으면 `chapterTransition` 상태를 만들고, `GameScreen`은 `ChapterTransitionScreen`을 렌더링합니다.
- `ChapterTransitionScreen`은 `chapterTransition.narration`을 문장 단위로 분리해 순서대로 타이핑하고(`narrationIdx`),
  - 모든 줄이 끝나면 `continueFromChapterTransition()`으로
  - `pendingSceneId`의 실제 씬으로 진입합니다.

관련 코드:
- `src/game/engine.ts`: `goToScene()`, `continueFromChapterTransition()`
- `src/components/ChapterTransitionScreen.tsx`: `INTEL BRIEFING` UI + 타이핑 진행

### 4) 이름 공개(연출 단계) + 엔딩 판정
- 특정 씬에서 `GameScreen`은 `NameRevealScreen`을 보여줍니다.
- `NameRevealScreen`은 씬 데이터의 `name_reveal_sequence`를 단계적으로 진행하며(스팟라이트/변환 연출),
  모든 단계가 끝나면 `scene.next_scene`으로 이동합니다.
- 엔딩에서는 `engine.checkEnding()`이 현재 `stats`/`flags`를 기반으로 `script.endings` 조건을 평가해 최종 엔딩을 결정합니다.

관련 코드:
- `src/components/NameRevealScreen.tsx`: `name_reveal_sequence` 단계 연출
- `src/game/engine.ts`: `checkEnding()`, `checkEndingConditions()`
- `src/components/EndingScreen.tsx`: 크레딧/엔딩 UI 및 엔딩 BGM

### 5) 연출 오버레이 + BGM 구간 제어(“씬/타이밍” 맞춤)
- 눈을 뜨는 연출(`EyeOpenOverlay`)이 끝나기 전에는 `GameScreen`에서 모든 게임 BGM을 정지합니다.
- 눈이 완전히 열려(`eyeDone=true`) 캐릭터가 표시되는 시점부터 씬별 BGM이 시작되고,
  씬이 바뀌면 해당 구간에 맞춰 다른 트랙을 stop/start 합니다.

관련 코드:
- `src/components/GameScreen.tsx`: `eyeDone` 게이트 + `currentSceneId` 기반 BGM 분기
- `src/bgm.ts`: BGM 싱글톤 생성/loop/volume 및 stop 함수

### 6) 시작 화면 & 플레이어 이름 입력
- 앱 진입 시 `src/App.tsx` 라우팅에 따라 `/`( `TitleScreen` ) 또는 `/name`( `NameInputScreen` )에서 플레이어 이름을 입력합니다.
- 입력이 확정되면 `src/store/gameStore.ts`의 `setPlayerName()`이
  - Zustand 상태(`playerName`)를 업데이트하고
  - 브라우저 `localStorage`의 키 `nocturne_player_name`에 이름을 저장합니다.
- `TitleScreen`에서는 이름 입력 후 `navigate('/intro')`로 넘어가고, `NameInputScreen`에서도 동일하게 이름 저장 후 인트로로 이동합니다.
- 게임 중 대사 표기에서 `DialogueScreen`은 `resolvedName`(스토어의 `playerName` 또는 `localStorage`)을 사용해 발화자 라벨/표시를 결정하고, 일부 대사에는 `[진짜 이름]` 플레이스홀더를 실제 이름으로 치환합니다.

관련 코드:
- `src/components/TitleScreen.tsx`: `/` 시작 화면 + 이름 입력(확정 시 `/intro` 이동)
- `src/components/NameInputScreen.tsx`: `/name` 이름 입력 화면
- `src/store/gameStore.ts`: `setPlayerName()` 및 `localStorage('nocturne_player_name')`
- `src/components/DialogueScreen.tsx`: `resolvedName` 및 대사 표시/치환 처리

---

## 데이터/콘텐츠 수정 포인트
### 1) 스토리/선택/엔딩
- 파일: `public/nocturne_z76_script.json`
- 수정 항목:
  - `chapters[].scenes[].dialogues`
  - `chapters[].scenes[].choice`
  - `chapters[].scenes[].next_scene`
  - `endings[]` 조건

### 2) 씬별 배경
- 파일: `src/game/sceneBackgrounds.ts`
- `sceneId -> 이미지 경로` 매핑 수정

### 3) BGM 구간
- 파일: `src/bgm.ts`, `src/components/GameScreen.tsx`
- 오디오 소스 추가 및 씬/구간 조건 분기 조정

---

## 스타일 가이드 포인트
- 기본 폰트: `Mulmaru` (`src/index.css`)
- 타이틀 전용 폰트: `GiantsInline` (`/public/fonts/Giants-Inline.woff2`)
- 대사 박스/브리핑 박스는 컴포넌트별 인라인 스타일 중심으로 커스터마이즈됨

---

## 참고
- 정적 리소스(이미지/오디오/영상)는 `public/` 하위에 두고 코드에서는 `/파일명`으로 참조합니다.
- 대사/선택 텍스트만 바꾸는 경우, 대부분 `public/nocturne_z76_script.json` 수정만으로 반영됩니다.
