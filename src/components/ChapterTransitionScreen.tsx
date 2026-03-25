import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { continueFromChapterTransition } from '../game/engine';

const TYPING_SPEED_MS = 30;

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

  // 화면 열릴 때 초기화
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

  // 나레이션 타이핑
  const narrations = chapterTransition?.narration ?? [];
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

  const finishTyping = useCallback(() => {
    if (currentLine) { setDisplayText(currentLine); setIsTyping(false); }
  }, [currentLine]);

  const handleAdvance = useCallback(() => {
    if (!chapterTransition) return;

    if (phase === 'title') {
      setPhase('narration');
      return;
    }

    if (phase === 'narration') {
      if (isTyping) { finishTyping(); return; }
      // 현재 줄 완료 → linesDone에 추가
      if (currentLine && !linesDone.includes(currentLine)) {
        setLinesDone(prev => [...prev, currentLine]);
      }
      if (narrationIdx < narrations.length - 1) {
        setNarrationIdx(i => i + 1);
        return;
      }
      // 모든 나레이션 완료
      if (alert) {
        setPhase('alert');
      } else {
        continueFromChapterTransition();
      }
      return;
    }

    if (phase === 'alert') {
      continueFromChapterTransition();
      return;
    }
  }, [chapterTransition, phase, isTyping, narrationIdx, narrations.length, alert, currentLine, linesDone, finishTyping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); handleAdvance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAdvance]);

  if (!chapterTransition) return null;

  // 챕터 번호 한글 (1→일, 2→이 ...) or 로마자
  const chapterRoman = ['I', 'II', 'III', 'IV', 'V'][chapterTransition.chapterNumber - 1] ?? chapterTransition.chapterNumber.toString();
  // 챕터 제목에서 "CHAPTER N — " 이후의 부제목만 추출
  const subtitleMatch = chapterTransition.title.match(/—\s*(.+)$/);
  const subtitle = subtitleMatch ? subtitleMatch[1] : chapterTransition.title;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      onClick={handleAdvance}
      style={{
        background: '#050510',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0d35 0%, #050510 70%)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes chap-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes chap-fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chap-title-in {
          0%   { opacity: 0; letter-spacing: 0.5em; transform: scaleX(0.85); }
          100% { opacity: 1; letter-spacing: 0.12em; transform: scaleX(1); }
        }
        @keyframes chap-glow-pulse {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes chap-line-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes chap-hint-pulse {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 0.7; }
        }
        @keyframes chap-stars {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: scale(1.5) rotate(180deg); }
        }
      `}</style>

      {/* 배경 스캔라인 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)',
          animation: 'chap-scanline 6s linear infinite',
        }} />
      </div>

      {/* 배경 파티클 점들 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${(i * 13 + 5) % 100}%`,
          top: `${(i * 17 + 8) % 100}%`,
          width: '2px', height: '2px',
          borderRadius: '50%',
          background: 'rgba(167,139,250,0.4)',
          animation: `chap-stars ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      ))}

      {/* 메인 콘텐츠 */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '720px', padding: '0 2rem' }}>

        {/* 상단 구분선 */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5) 20%, rgba(255,215,0,0.4) 50%, rgba(139,92,246,0.5) 80%, transparent)',
          marginBottom: '2.5rem',
          animation: titleVisible ? 'chap-fadeIn 0.8s ease both' : 'none',
        }} />

        {/* CHAPTER 레이블 */}
        <div style={{
          fontSize: '10px', letterSpacing: '0.35em',
          color: 'rgba(167,139,250,0.7)',
          marginBottom: '0.5rem',
          textAlign: 'center',
          animation: titleVisible ? 'chap-fadeIn 0.6s ease 0.1s both' : 'none',
          opacity: titleVisible ? undefined : 0,
          animationFillMode: 'both',
        }}>
          ◈ CHAPTER {chapterRoman} ◈
        </div>

        {/* 챕터 번호 대형 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem',
          animation: titleVisible ? 'chap-title-in 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s both' : 'none',
          opacity: titleVisible ? undefined : 0,
        }}>
          <span style={{
            fontSize: 'clamp(4rem, 10vw, 7rem)',
            fontFamily: 'GiantsInline, monospace',
            background: 'linear-gradient(135deg, #a78bfa 0%, #FFD700 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            display: 'inline-block',
            filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.4))',
          }}>
            {chapterRoman}
          </span>
        </div>

        {/* 챕터 부제목 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          animation: titleVisible ? 'chap-fadeIn 0.8s ease 0.5s both' : 'none',
          opacity: titleVisible ? undefined : 0,
        }}>
          <div style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
            color: '#FFD700',
            letterSpacing: '0.06em',
            textShadow: '0 0 16px rgba(255,215,0,0.4)',
            fontWeight: 'bold',
          }}>
            {subtitle}
          </div>
        </div>

        {/* 가운데 구분선 */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent)',
          marginBottom: '2rem',
          animation: contentVisible ? 'chap-fadeIn 0.6s ease both' : 'none',
          opacity: contentVisible ? undefined : 0,
        }} />

        {/* 나레이션 영역 */}
        <div style={{
          minHeight: '8rem',
          marginBottom: '1.5rem',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          {/* 이미 완료된 이전 줄들 */}
          {linesDone.map((line, i) => (
            <p key={i} style={{
              color: 'rgba(200,190,255,0.5)',
              fontSize: '0.95rem',
              lineHeight: 1.85,
              marginBottom: '0.6rem',
              fontStyle: 'italic',
              animation: 'chap-line-in 0.4s ease both',
            }}>
              {line}
            </p>
          ))}
          {/* 현재 타이핑 중인 줄 */}
          {phase === 'narration' && currentLine && (
            <p style={{
              color: 'rgba(220,210,255,0.95)',
              fontSize: '0.95rem',
              lineHeight: 1.85,
              marginBottom: '0.6rem',
              fontStyle: 'italic',
              animation: 'chap-line-in 0.3s ease both',
            }}>
              {displayText}
              {isTyping && <span style={{ animation: 'chap-glow-pulse 0.8s ease-in-out infinite' }}>|</span>}
            </p>
          )}
        </div>

        {/* 시스템 알림 */}
        {phase === 'alert' && alert && (
          <div style={{
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.4)',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            color: '#fbbf24',
            fontSize: '0.88rem',
            animation: 'chap-fadeIn 0.5s ease both',
          }}>
            {alert}
          </div>
        )}

        {/* 클릭 힌트 */}
        <div style={{
          textAlign: 'center',
          fontSize: '10px',
          letterSpacing: '0.15em',
          color: 'rgba(167,139,250,0.4)',
          animation: 'chap-hint-pulse 2s ease-in-out infinite',
        }}>
          {isTyping ? '▶ 클릭으로 건너뛰기' : '▶ 클릭하여 계속'}
        </div>

        {/* 하단 구분선 */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5) 20%, rgba(255,215,0,0.4) 50%, rgba(139,92,246,0.5) 80%, transparent)',
          marginTop: '2.5rem',
          animation: contentVisible ? 'chap-fadeIn 0.8s ease 0.2s both' : 'none',
          opacity: contentVisible ? undefined : 0,
        }} />

      </div>
    </div>
  );
}
