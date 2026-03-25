import { useEffect, useLayoutEffect, useState, useCallback, useRef, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { loadScript } from '../game/engine';
import { DialogueScreen } from './DialogueScreen';
import { ChoiceScreen } from './ChoiceScreen';
import { ChoiceResultScreen } from './ChoiceResultScreen';
import { NameRevealScreen } from './NameRevealScreen';
import { ChapterTransitionScreen } from './ChapterTransitionScreen';

// ─── 눈을 뜨는 오버레이 (SVG bezier + RAF 기반) ───────────────────────────────

function EyeOpenOverlay({
  onDone,
  contentRef,
}: {
  onDone: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}) {
  const svgPathRef = useRef<SVGPathElement>(null);
  const blurRef    = useRef<HTMLDivElement>(null);
  const bloomRef   = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx  = vw / 2;
    const cy  = vh / 2;
    const rw  = vw / 2;
    const cpX = rw * 0.20;

    // 초기 콘텐츠 블러 설정
    if (contentRef.current) {
      contentRef.current.style.filter = 'blur(18px)';
    }

    function makePath(rh: number): string {
      if (rh <= 0) return `M 0 0 H ${vw} V ${vh} H 0 Z`;
      const eye = [
        `M ${cx - rw} ${cy}`,
        `C ${cx - rw + cpX} ${cy - rh} ${cx - cpX} ${cy - rh} ${cx} ${cy - rh}`,
        `C ${cx + cpX} ${cy - rh} ${cx + rw - cpX} ${cy - rh} ${cx + rw} ${cy}`,
        `C ${cx + rw - cpX} ${cy + rh} ${cx + cpX} ${cy + rh} ${cx} ${cy + rh}`,
        `C ${cx - cpX} ${cy + rh} ${cx - rw + cpX} ${cy + rh} ${cx - rw} ${cy}`,
        'Z',
      ].join(' ');
      return `M 0 0 H ${vw} V ${vh} H 0 Z ${eye}`;
    }

    // ── 키프레임 ─────────────────────────────────────────────────────────
    // rh            = 눈 반높이(px)
    // blur          = 오버레이 backdrop-filter 블러(px)
    // dark          = 어두운 틴트 0-1
    // bloom         = 빛 번짐 opacity 0-1
    // overlayOpacity= 오버레이 전체 투명도
    // contentBlur   = 게임 콘텐츠 CSS filter blur(px) — 눈이 열릴수록 선명해짐
    type KF = {
      t: number; rh: number; blur: number; dark: number;
      bloom: number; overlayOpacity: number; contentBlur: number;
    };
    const KFs: KF[] = [
      { t: 0,    rh: 0,         blur: 22, dark: 1.00, bloom: 0,    overlayOpacity: 1, contentBlur: 18 },
      { t: 400,  rh: 0,         blur: 22, dark: 1.00, bloom: 0,    overlayOpacity: 1, contentBlur: 18 }, // 정지
      { t: 2800, rh: vh * 0.12, blur: 15, dark: 0.78, bloom: 0.07, overlayOpacity: 1, contentBlur: 16 }, // 서서히 열림
      { t: 3300, rh: vh * 0.07, blur: 19, dark: 0.88, bloom: 0.02, overlayOpacity: 1, contentBlur: 17 }, // 힘 빠져 처짐
      { t: 3700, rh: vh * 0.07, blur: 19, dark: 0.88, bloom: 0.02, overlayOpacity: 1, contentBlur: 17 }, // 드룹 유지
      { t: 5600, rh: vh * 0.22, blur:  3, dark: 0.03, bloom: 0.04, overlayOpacity: 1, contentBlur: 14 }, // 완전히 열림, 아직 뿌연
      { t: 6300, rh: vh * 0.22, blur:  0, dark: 0,    bloom: 0,    overlayOpacity: 1, contentBlur:  0 }, // 콘텐츠 선명해짐
      { t: 7000, rh: vh * 0.60, blur:  0, dark: 0,    bloom: 0,    overlayOpacity: 1, contentBlur:  0 }, // 오버레이 팽창
      { t: 7500, rh: vh * 0.60, blur:  0, dark: 0,    bloom: 0,    overlayOpacity: 0, contentBlur:  0 }, // 전체 페이드아웃
    ];
    const DONE_AT = 7700;

    function easeOut3(t: number) { return 1 - (1 - t) ** 3; }

    function getState(elapsed: number): KF {
      const last = KFs[KFs.length - 1];
      if (elapsed >= last.t) return last;
      for (let i = 0; i < KFs.length - 1; i++) {
        const a = KFs[i], b = KFs[i + 1];
        if (elapsed >= a.t && elapsed <= b.t) {
          const raw = (elapsed - a.t) / (b.t - a.t);
          const t   = easeOut3(raw);
          return {
            t:              elapsed,
            rh:             a.rh             + (b.rh             - a.rh)             * t,
            blur:           a.blur           + (b.blur           - a.blur)           * t,
            dark:           a.dark           + (b.dark           - a.dark)           * t,
            bloom:          a.bloom          + (b.bloom          - a.bloom)          * t,
            overlayOpacity: a.overlayOpacity + (b.overlayOpacity - a.overlayOpacity) * t,
            contentBlur:    a.contentBlur    + (b.contentBlur    - a.contentBlur)    * t,
          };
        }
      }
      return KFs[0];
    }

    let start: number | null = null;
    let rafId: number;

    function frame(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const st = getState(elapsed);

      if (svgPathRef.current) {
        svgPathRef.current.setAttribute('d', makePath(st.rh));
      }
      if (blurRef.current) {
        const b = st.blur.toFixed(1);
        blurRef.current.style.setProperty('backdrop-filter', `blur(${b}px)`);
        blurRef.current.style.setProperty('-webkit-backdrop-filter', `blur(${b}px)`);
        blurRef.current.style.background = `rgba(0,0,0,${(st.dark * 0.36).toFixed(3)})`;
      }
      if (bloomRef.current) {
        bloomRef.current.style.opacity = st.bloom.toFixed(3);
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = st.overlayOpacity.toFixed(3);
      }
      // 게임 콘텐츠 블러 — 눈이 완전히 열릴 때 선명해짐
      if (contentRef.current) {
        contentRef.current.style.filter = `blur(${st.contentBlur.toFixed(1)}px)`;
      }

      if (elapsed < DONE_AT) {
        rafId = requestAnimationFrame(frame);
      } else {
        // 언마운트 전 콘텐츠 블러 완전 제거
        if (contentRef.current) contentRef.current.style.filter = 'none';
        onDone();
      }
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [onDone, contentRef]);

  return (
    <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
      {/* 블러 + 어두운 틴트 레이어 */}
      <div ref={blurRef} style={{
        position: 'absolute', inset: 0,
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        background: 'rgba(0,0,0,0.36)',
      }} />

      {/* 눈꺼풀 틈새 따뜻한 빛 번짐 */}
      <div ref={bloomRef} style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 52% 8% at 50% 50%, rgba(255,238,198,0.9) 0%, rgba(220,185,130,0.18) 58%, transparent 80%)',
        opacity: 0,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />

      {/* 아몬드형 눈 구멍이 뚫린 검은 오버레이 */}
      <svg
        width="100%" height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <path
          ref={svgPathRef}
          fillRule="evenodd"
          fill="black"
          d={`M 0 0 H ${vw} V ${vh} H 0 Z`}
        />
      </svg>
    </div>
  );
}

// ─── 씬 전환 눈 깜빡임 오버레이 ────────────────────────────────────────────
const SceneBlinkOverlay = memo(function SceneBlinkOverlay({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 즉시 검정으로 (눈 닫힘)
    el.style.opacity = '1';
    el.style.transition = 'none';

    // 200ms 유지 후 열리기 시작
    const t1 = setTimeout(() => {
      el.style.transition = 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.opacity = '0';
    }, 200);

    // 완전히 열린 후 onDone
    const t2 = setTimeout(onDone, 780);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', inset: 0, zIndex: 48,
        background: '#000',
        opacity: 1,
        pointerEvents: 'none',
      }}
    />
  );
});

export function GameScreen() {
  const [loaded, setLoaded] = useState(false);
  const [eyeDone, setEyeDone] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const script                = useGameStore((s) => s.script);
  const currentSceneId        = useGameStore((s) => s.currentSceneId);
  const isChoiceVisible       = useGameStore((s) => s.isChoiceVisible);
  const isShowingChoiceResult = useGameStore((s) => s.isShowingChoiceResult);
  const chapterTransition     = useGameStore((s) => s.chapterTransition);
  const setScript             = useGameStore((s) => s.setScript);

  const contentBlurRef      = useRef<HTMLDivElement>(null);
  const prevSceneRef        = useRef<string | null>(null);
  const prevRenderedSceneRef = useRef<string>(currentSceneId);
  const [isSceneBlinking, setIsSceneBlinking] = useState(false);

  const handleEyeDone = useCallback(() => setEyeDone(true), []);

  const handleSceneBlinkDone = useCallback(() => {
    setIsSceneBlinking(false);
    const t = setTimeout(() => setUiVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // 최초 눈 뜨기 완료 후 1초 뒤 UI 등장
  useEffect(() => {
    if (!eyeDone) return;
    const timer = setTimeout(() => setUiVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [eyeDone]);

  // 씬 전환 감지 → 깜빡임 + 배경 선노출
  // useLayoutEffect: 브라우저 페인트 전에 동기 실행 → 캐릭터 플래시 방지
  useLayoutEffect(() => {
    if (!eyeDone) return;
    // 첫 씬은 초기 눈 애니메이션이 담당
    if (prevSceneRef.current === null) {
      prevSceneRef.current = currentSceneId;
      return;
    }
    if (prevSceneRef.current !== currentSceneId) {
      prevSceneRef.current = currentSceneId;
      setUiVisible(false);
      setIsSceneBlinking(true);
    }
  }, [currentSceneId, eyeDone]);

  useEffect(() => {
    if (script) { setLoaded(true); return; }
    loadScript()
      .then((s) => { setScript(s); setLoaded(true); })
      .catch((e) => setError(e?.message ?? '스크립트 로드 실패'));
  }, [script, setScript]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        로딩 중...
      </div>
    );
  }

  // 렌더 타임에 씬 변경 즉시 감지 → 한 프레임 플래시 방지
  const sceneChangedNow = eyeDone && prevRenderedSceneRef.current !== currentSceneId;
  if (sceneChangedNow) prevRenderedSceneRef.current = currentSceneId;
  const effectiveUiVisible = uiVisible && !sceneChangedNow && !isSceneBlinking;

  let content: React.ReactNode;
  if (chapterTransition) {
    content = <ChapterTransitionScreen />;
  } else if (isShowingChoiceResult) {
    content = <ChoiceResultScreen />;
  } else if (isChoiceVisible) {
    content = <ChoiceScreen />;
  } else if (currentSceneId === 'scene_5_star') {
    content = <NameRevealScreen />;
  } else {
    content = <DialogueScreen uiVisible={effectiveUiVisible} />;
  }

  return (
    <>
      {/* contentBlurRef: 눈 애니메이션 동안 게임 화면을 뿌옇게 처리 */}
      <div ref={contentBlurRef}>
        {content}
      </div>
      {/* 씬 전환 깜빡임 */}
      {isSceneBlinking && (
        <SceneBlinkOverlay onDone={handleSceneBlinkDone} />
      )}
      {/* 최초 눈 뜨기 */}
      {!eyeDone && (
        <EyeOpenOverlay onDone={handleEyeDone} contentRef={contentBlurRef} />
      )}
    </>
  );
}
