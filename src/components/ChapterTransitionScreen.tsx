import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { continueFromChapterTransition } from '../game/engine';

const TYPING_SPEED_MS = 28;

export function ChapterTransitionScreen() {
  const chapterTransition = useGameStore((s) => s.chapterTransition);

  const [phase, setPhase] = useState<'title' | 'narration' | 'alert'>('title');
  const [narrationIdx, setNarrationIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [linesDone, setLinesDone] = useState<string[]>([]);

  const dataRef = useRef(chapterTransition);
  dataRef.current = chapterTransition;

  useEffect(() => {
    if (!chapterTransition) return;
    setPhase('title');
    setNarrationIdx(0);
    setDisplayText('');
    setIsTyping(false);
    setTitleVisible(false);
    setContentVisible(false);
    setLinesDone([]);

    const t1 = setTimeout(() => setTitleVisible(true), 300);
    const t2 = setTimeout(() => {
      setContentVisible(true);
      setPhase('narration');
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [chapterTransition?.chapterNumber]);

  // 마침표 기준으로 문장을 개별 줄로 분리
  const narrations = (chapterTransition?.narration ?? []).flatMap(line =>
    line.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
  );
  const alert = chapterTransition?.alert;
  const currentLine = narrations[narrationIdx];

  useEffect(() => {
    if (phase !== 'narration' || !currentLine) return;
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayText(currentLine.slice(0, i));
      if (i >= currentLine.length) { clearInterval(id); setIsTyping(false); }
    }, TYPING_SPEED_MS);
    return () => clearInterval(id);
  }, [phase, narrationIdx, currentLine]);

  // 타이핑 완료 시 자동으로 다음 줄로 진행
  useEffect(() => {
    if (phase !== 'narration' || isTyping || !currentLine) return;
    const timer = setTimeout(() => {
      setLinesDone(prev => prev.includes(currentLine) ? prev : [...prev, currentLine]);
      if (narrationIdx < narrations.length - 1) {
        setNarrationIdx(i => i + 1);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isTyping, phase, currentLine, narrationIdx, narrations.length]);

  const allNarrationDone = linesDone.length >= narrations.length && narrations.length > 0;

  const finishTyping = useCallback(() => {
    if (currentLine) { setDisplayText(currentLine); setIsTyping(false); }
  }, [currentLine]);

  const handleAdvance = useCallback(() => {
    if (!chapterTransition) return;
    if (phase === 'title') { setPhase('narration'); return; }
    if (phase === 'narration') {
      if (isTyping) { finishTyping(); return; }
      if (!allNarrationDone) return; // 아직 자동 진행 중
      if (alert) { setPhase('alert'); } else { continueFromChapterTransition(); }
      return;
    }
    if (phase === 'alert') { continueFromChapterTransition(); return; }
  }, [chapterTransition, phase, isTyping, allNarrationDone, alert, finishTyping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); handleAdvance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAdvance]);

  if (!chapterTransition) return null;

  const chapterRoman = ['I', 'II', 'III', 'IV', 'V'][chapterTransition.chapterNumber - 1] ?? chapterTransition.chapterNumber.toString();
  const subtitleMatch = chapterTransition.title.match(/—\s*(.+)$/);
  const subtitle = subtitleMatch ? subtitleMatch[1] : chapterTransition.title;
  const totalChapters = 5;
  const isChapter3 = chapterTransition.chapterNumber === 3;

  return (
    <div
      onClick={handleAdvance}
      style={{
        position: 'fixed', inset: 0,
        background: '#04040F',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @keyframes ct-fadein   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ct-slidein  { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ct-slideright { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ct-pulse    { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        @keyframes ct-scan     { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes ct-blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ct-bar-grow { from{width:0} }
        @keyframes ct-glitch {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-2px)} 40%{transform:translateX(2px)} 60%{transform:translateX(-1px)}
        }
        @keyframes ct-shatter-glint {
          0%, 88%, 100% { opacity: 0; transform: translateX(-40%) rotate(-10deg); }
          92%           { opacity: 0.45; transform: translateX(120%) rotate(-10deg); }
        }
        @keyframes crack-draw {
          from { stroke-dashoffset: 300; opacity: 0; }
          4%   { opacity: 1; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes crack-flash {
          0%   { opacity: 0; }
          8%   { opacity: 0.9; }
          30%  { opacity: 0.35; }
          100% { opacity: 0; }
        }
        @keyframes crack-box-shake {
          0%,100% { transform: none; }
          12%     { transform: translateX(-5px) translateY(2px) rotate(-0.5deg); }
          25%     { transform: translateX(4px) translateY(-2px) rotate(0.4deg); }
          38%     { transform: translateX(-3px) translateY(1px) rotate(-0.2deg); }
          52%     { transform: translateX(2px) translateY(-1px); }
          66%     { transform: translateX(-1px) translateY(1px); }
          80%     { transform: translateX(1px); }
        }
        @keyframes crack-center-glow {
          0%   { opacity: 0; transform: scale(0.4); }
          12%  { opacity: 1;   transform: scale(1); }
          55%  { opacity: 0.55; transform: scale(1.15); }
          100% { opacity: 0;   transform: scale(1.6); }
        }
        @keyframes crack-line-pulse {
          0%, 100% { opacity: 0.62; }
          50%      { opacity: 0.95; }
        }
        @keyframes crack-border-flicker {
          0%,100%  { box-shadow: none; border-color: rgba(139,92,246,0.18); }
          10%      { box-shadow: 0 0 12px rgba(200,220,255,0.25), inset 0 0 10px rgba(200,220,255,0.06); border-color: rgba(200,220,255,0.45); }
          22%      { box-shadow: none; border-color: rgba(139,92,246,0.18); }
          45%      { box-shadow: 0 0 6px rgba(200,220,255,0.12); border-color: rgba(180,205,255,0.28); }
          60%      { box-shadow: none; border-color: rgba(139,92,246,0.18); }
          80%      { box-shadow: 0 0 4px rgba(200,220,255,0.08); border-color: rgba(160,190,255,0.22); }
        }
      `}</style>

      {/* 배경 그리드 */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: [
          'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
        ].join(','),
        backgroundSize: '48px 48px',
      }} />

      {/* 스캔라인 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.35), rgba(255,215,0,0.2), transparent)',
          animation: 'ct-scan 8s linear infinite',
        }} />
      </div>

      {/* ── 최상단 시스템 상태바 ── */}
      <div style={{
        position: 'relative', zIndex: 2, flexShrink: 0,
        borderBottom: '1px solid rgba(139,92,246,0.25)',
        background: 'linear-gradient(90deg, rgba(10,4,30,0.95) 0%, rgba(6,2,18,0.9) 100%)',
        padding: '8px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        ...(titleVisible ? { animation: 'ct-fadein 0.5s ease both' } : { opacity: 0 }),
      }}>
        {/* 좌: 시스템 ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#a78bfa',
              boxShadow: '0 0 6px #a78bfa',
              animation: 'ct-pulse 1.8s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '9px', color: 'rgba(167,139,250,0.7)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
              NOCTURNE Z76
            </span>
          </div>
          <span style={{ fontSize: '9px', color: 'rgba(139,92,246,0.4)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            SYS.CHAPTER_TRANSITION
          </span>
        </div>
        {/* 우: 챕터 진행 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,215,0,0.5)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
            CHAPTER
          </span>
          {Array.from({ length: totalChapters }).map((_, i) => (
            <div key={i} style={{
              width: i === chapterTransition.chapterNumber - 1 ? '18px' : '6px',
              height: '6px',
              borderRadius: '2px',
              background: i < chapterTransition.chapterNumber
                ? (i === chapterTransition.chapterNumber - 1 ? '#FFD700' : 'rgba(167,139,250,0.5)')
                : 'rgba(255,255,255,0.08)',
              transition: 'width 0.3s ease',
            }} />
          ))}
          <span style={{ fontSize: '9px', color: 'rgba(255,215,0,0.6)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            {chapterTransition.chapterNumber}/{totalChapters}
          </span>
        </div>
      </div>

      {/* ── 메인 콘텐츠: 2단 레이아웃 ── */}
      <div style={{
        flex: 1, display: 'flex', position: 'relative', zIndex: 1,
        minHeight: 0,
      }}>

        {/* 좌측 패널: 챕터 헤더 */}
        <div style={{
          width: '38%', flexShrink: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '3rem 2.5rem',
          borderRight: '1px solid rgba(139,92,246,0.2)',
          background: 'linear-gradient(135deg, rgba(10,4,30,0.6) 0%, transparent 100%)',
        }}>
          {/* CHAPTER 레이블 */}
          <div style={{
            fontSize: '9px', letterSpacing: '0.4em',
            color: 'rgba(167,139,250,0.55)', fontFamily: 'monospace',
            marginBottom: '1rem',
            ...(titleVisible ? { animation: 'ct-slidein 0.5s ease 0.1s both' } : { opacity: 0 }),
          }}>
            ◈ CHAPTER {chapterRoman} ◈
          </div>

          {/* 로마 숫자 대형 */}
          <div style={{
            lineHeight: 1,
            marginBottom: '1.5rem',
            ...(titleVisible ? { animation: 'ct-slidein 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' } : { opacity: 0 }),
          }}>
            <span style={{
              fontSize: 'clamp(5rem, 10vw, 8rem)',
              fontFamily: 'GiantsInline, monospace',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #c4b5fd 0%, #FFD700 60%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.5))',
              ...(titleVisible ? { animation: 'ct-glitch 0.4s ease 0.8s 1' } : {}),
            }}>
              {chapterRoman}
            </span>
          </div>

          {/* 챕터 부제목 */}
          <div style={{
            ...(titleVisible ? { animation: 'ct-slidein 0.6s ease 0.4s both' } : { opacity: 0 }),
            marginBottom: '2rem',
          }}>
            <div style={{
              fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
              color: '#FFD700',
              letterSpacing: '0.06em',
              fontWeight: 700,
              textShadow: '0 0 12px rgba(255,215,0,0.35)',
              lineHeight: 1.4,
            }}>
              {subtitle}
            </div>
          </div>

          {/* 구분선 + 진행 바 */}
          <div style={{
            ...(titleVisible ? { animation: 'ct-fadein 0.5s ease 0.6s both' } : { opacity: 0 }),
          }}>
            <div style={{ height: '1px', background: 'rgba(139,92,246,0.3)', marginBottom: '12px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '8px', color: 'rgba(167,139,250,0.45)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
                PROGRESS
              </span>
              <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(chapterTransition.chapterNumber / totalChapters) * 100}%`,
                  background: 'linear-gradient(90deg, #a78bfa, #FFD700)',
                  borderRadius: '2px',
                  animation: 'ct-bar-grow 1s cubic-bezier(0.22,1,0.36,1) 0.8s both',
                }} />
              </div>
              <span style={{ fontSize: '8px', color: 'rgba(255,215,0,0.5)', fontFamily: 'monospace' }}>
                {Math.round((chapterTransition.chapterNumber / totalChapters) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* 우측 패널: 인텔 브리핑 */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '3rem 2.5rem',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>

          {/* 브리핑 패널 헤더 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '1rem',
            ...(contentVisible ? { animation: 'ct-slideright 0.5s ease both' } : {}),
          }}>
            <div style={{ width: '3px', height: '14px', background: '#a78bfa', borderRadius: '2px', boxShadow: '0 0 6px #a78bfa' }} />
            <span style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(167,139,250,0.65)', fontFamily: 'monospace' }}>
              INTEL BRIEFING
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(139,92,246,0.2)' }} />
          </div>

          {/* 나레이션 박스 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(10,4,30,0.7) 0%, rgba(6,2,20,0.85) 100%)',
            border: '1px solid rgba(139,92,246,0.18)',
            borderLeft: '3px solid rgba(139,92,246,0.5)',
            borderRadius: '0 6px 6px 0',
            padding: '1.5rem 1.75rem',
            minHeight: '12rem',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            ...(contentVisible ? {
              animation: isChapter3
                ? 'ct-slideright 0.6s ease 0.1s both, crack-box-shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) 0.85s both, crack-border-flicker 3.5s ease 1.5s infinite'
                : 'ct-slideright 0.6s ease 0.1s both',
            } : {}),
          }}>
            {isChapter3 && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
                {/* 충격 플래시 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 55% 70% at 64% 40%, rgba(255,255,255,0.32) 0%, rgba(200,220,255,0.14) 30%, transparent 65%)',
                  animation: 'crack-flash 1.8s ease-out 0.85s both',
                }} />

                {/* SVG 균열 레이어 */}
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  viewBox="0 0 200 100"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {/* ── 글로우 레이어 (넓은 선) ── */}
                  {/* 좌상단 주균열 글로우 */}
                  <path d="M128,38 L110,26 L88,15 L62,6 L30,1" stroke="rgba(180,205,255,0.9)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="300" style={{ animation: 'crack-draw 0.5s ease-out 0.9s both' }} />
                  {/* 우상단 주균열 글로우 */}
                  <path d="M128,38 L148,20 L168,8 L185,2" stroke="rgba(180,205,255,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" style={{ animation: 'crack-draw 0.4s ease-out 0.92s both' }} />
                  {/* 좌하단 주균열 글로우 */}
                  <path d="M128,38 L112,52 L94,65 L72,78 L48,90 L22,100" stroke="rgba(180,205,255,0.9)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="300" style={{ animation: 'crack-draw 0.55s ease-out 0.88s both' }} />
                  {/* 우하단 주균열 글로우 */}
                  <path d="M128,38 L146,54 L162,68 L176,82 L188,96" stroke="rgba(180,205,255,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" style={{ animation: 'crack-draw 0.45s ease-out 0.9s both' }} />
                  {/* 오른쪽 수평 균열 글로우 */}
                  <path d="M128,38 L155,40 L180,43 L200,45" stroke="rgba(180,205,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" style={{ animation: 'crack-draw 0.3s ease-out 0.94s both' }} />

                  {/* ── 주 균열선 ── */}
                  {/* 좌상단 주균열 */}
                  <path d="M128,38 L110,26 L88,15 L62,6 L30,1" stroke="rgba(215,228,255,0.72)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="300" style={{ animation: 'crack-draw 0.5s ease-out 0.9s both, crack-line-pulse 2.8s ease-in-out 1.5s infinite' }} />
                  {/* 분기 1a — 110,26에서 위로 */}
                  <path d="M110,26 L116,13 L112,3" stroke="rgba(215,228,255,0.52)" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" style={{ animation: 'crack-draw 0.22s ease-out 1.35s both' }} />
                  {/* 분기 1b — 88,15에서 아래로 */}
                  <path d="M88,15 L82,24 L76,34" stroke="rgba(215,228,255,0.46)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" style={{ animation: 'crack-draw 0.2s ease-out 1.4s both' }} />

                  {/* 우상단 주균열 */}
                  <path d="M128,38 L148,20 L168,8 L185,2" stroke="rgba(215,228,255,0.66)" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" style={{ animation: 'crack-draw 0.4s ease-out 0.92s both, crack-line-pulse 2.8s ease-in-out 1.6s infinite' }} />
                  {/* 분기 2a — 148,20에서 오른쪽 아래로 */}
                  <path d="M148,20 L155,28 L162,36 L168,43" stroke="rgba(215,228,255,0.44)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" style={{ animation: 'crack-draw 0.22s ease-out 1.28s both' }} />
                  {/* 분기 2b — 168,8에서 약간 위로 */}
                  <path d="M168,8 L172,3 L176,0" stroke="rgba(215,228,255,0.36)" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.15s ease-out 1.32s both' }} />

                  {/* 좌하단 주균열 */}
                  <path d="M128,38 L112,52 L94,65 L72,78 L48,90 L22,100" stroke="rgba(215,228,255,0.70)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="300" style={{ animation: 'crack-draw 0.55s ease-out 0.88s both, crack-line-pulse 2.8s ease-in-out 1.55s infinite' }} />
                  {/* 분기 3a — 112,52에서 오른쪽으로 */}
                  <path d="M112,52 L120,62 L118,74" stroke="rgba(215,228,255,0.46)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" style={{ animation: 'crack-draw 0.22s ease-out 1.38s both' }} />
                  {/* 분기 3b — 94,65에서 왼쪽으로 */}
                  <path d="M94,65 L84,73 L76,83" stroke="rgba(215,228,255,0.42)" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" style={{ animation: 'crack-draw 0.2s ease-out 1.43s both' }} />
                  {/* 분기 3c — 72,78에서 분기 */}
                  <path d="M72,78 L65,85 L60,94" stroke="rgba(215,228,255,0.35)" strokeWidth="0.42" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.18s ease-out 1.5s both' }} />

                  {/* 우하단 주균열 */}
                  <path d="M128,38 L146,54 L162,68 L176,82 L188,96" stroke="rgba(215,228,255,0.64)" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" style={{ animation: 'crack-draw 0.45s ease-out 0.9s both, crack-line-pulse 2.8s ease-in-out 1.58s infinite' }} />
                  {/* 분기 4a — 146,54에서 왼쪽으로 */}
                  <path d="M146,54 L140,64 L142,75" stroke="rgba(215,228,255,0.42)" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="70" style={{ animation: 'crack-draw 0.2s ease-out 1.3s both' }} />
                  {/* 분기 4b — 162,68 에서 */}
                  <path d="M162,68 L170,72 L175,80" stroke="rgba(215,228,255,0.35)" strokeWidth="0.42" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.18s ease-out 1.38s both' }} />

                  {/* 오른쪽 수평 균열 */}
                  <path d="M128,38 L155,40 L180,43 L200,45" stroke="rgba(215,228,255,0.58)" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" style={{ animation: 'crack-draw 0.3s ease-out 0.94s both' }} />

                  {/* 충격점 근처 소파편 균열들 */}
                  <path d="M128,38 L122,32 L118,25" stroke="rgba(215,228,255,0.40)" strokeWidth="0.48" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.15s ease-out 0.87s both' }} />
                  <path d="M128,38 L135,31 L140,24" stroke="rgba(215,228,255,0.38)" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.15s ease-out 0.89s both' }} />
                  <path d="M128,38 L122,44 L118,53" stroke="rgba(215,228,255,0.38)" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.15s ease-out 0.91s both' }} />
                  <path d="M128,38 L134,45 L136,54" stroke="rgba(215,228,255,0.36)" strokeWidth="0.42" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" style={{ animation: 'crack-draw 0.15s ease-out 0.93s both' }} />

                  {/* 충격점 원형 */}
                  <circle cx="128" cy="38" r="3" fill="rgba(230,240,255,0.75)" style={{ animation: 'crack-center-glow 1.8s ease-out 0.85s both' }} />
                  <circle cx="128" cy="38" r="6" fill="none" stroke="rgba(200,220,255,0.35)" strokeWidth="0.6" strokeDasharray="40" style={{ animation: 'crack-draw 0.2s ease-out 0.85s both' }} />
                </svg>

                {/* 광택 스위프 */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: '-25%', width: '50%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(230,238,255,0.14) 48%, transparent 100%)',
                  mixBlendMode: 'screen',
                  animation: 'ct-shatter-glint 6s ease-in-out 2.2s infinite',
                }} />
              </div>
            )}
            {/* 완료된 이전 줄들 */}
            {linesDone.map((line, i) => (
              <p key={i} style={{
                color: 'rgba(200,190,255,0.55)',
                fontSize: '0.93rem',
                lineHeight: 1.9,
                marginBottom: '0.75rem',
                letterSpacing: '0.01em',
              }}>
                {line}
              </p>
            ))}
            {/* 현재 타이핑 중인 줄 */}
            {phase === 'narration' && currentLine && !allNarrationDone && (
              <p style={{
                color: 'rgba(235,228,255,0.95)',
                fontSize: '0.93rem',
                lineHeight: 1.9,
                marginBottom: 0,
                letterSpacing: '0.01em',
              }}>
                {displayText}
                {isTyping && (
                  <span style={{
                    display: 'inline-block', width: '2px', height: '1em',
                    background: '#a78bfa', marginLeft: '2px', verticalAlign: 'text-bottom',
                    animation: 'ct-blink 0.7s step-end infinite',
                  }} />
                )}
              </p>
            )}
          </div>

          {/* 시스템 알림 */}
          {phase === 'alert' && alert && (
            <div style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.35)',
              borderLeft: '3px solid #fbbf24',
              borderRadius: '0 6px 6px 0',
              padding: '12px 16px',
              marginBottom: '1.5rem',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              animation: 'ct-fadein 0.5s ease both',
            }}>
              <span style={{ color: '#fbbf24', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>⚠</span>
              <span style={{ color: 'rgba(251,191,36,0.9)', fontSize: '0.88rem', lineHeight: 1.6 }}>{alert}</span>
            </div>
          )}

          {/* 하단: 힌트 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
            ...(contentVisible ? { animation: 'ct-fadein 0.5s ease 0.4s both' } : {}),
          }}>
            <span style={{
              fontSize: '9px', letterSpacing: '0.2em',
              color: 'rgba(167,139,250,0.4)',
              fontFamily: 'monospace',
              animation: 'ct-pulse 2s ease-in-out infinite',
            }}>
              {isTyping ? 'SKIP ▶' : allNarrationDone ? 'CONTINUE ▶' : ''}
            </span>
          </div>

        </div>
      </div>

      {/* ── 최하단 상태바 ── */}
      <div style={{
        position: 'relative', zIndex: 2, flexShrink: 0,
        borderTop: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(4,4,15,0.9)',
        padding: '6px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        opacity: contentVisible ? 1 : 0,
        transition: 'opacity 0.5s ease 0.3s',
      }}>
        <span style={{ fontSize: '8px', color: 'rgba(139,92,246,0.3)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
          E527 / MEMORY_STATUS: FRAGMENTED
        </span>
        <span style={{ fontSize: '8px', color: 'rgba(139,92,246,0.3)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
          {phase === 'narration'
            ? `LOG ${narrationIdx + 1}/${narrations.length}`
            : phase === 'alert' ? 'SYSTEM ALERT' : 'STANDBY'}
        </span>
      </div>

    </div>
  );
}
