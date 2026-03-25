import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSpeakerDisplayName } from '../game/engine';
import { confirmChoiceResultAndContinue } from '../game/engine';
import { SCENE_BACKGROUNDS } from '../game/sceneBackgrounds';

const TYPING_SPEED_MS = 28;

const statLabels: Record<string, string> = {
  light_gauge: '빛 게이지',
  memory_fragments: '기억 조각',
  vocal: '보컬',
  dance: '댄스',
  emotion: '감성',
  teamwork: '팀워크',
  affinity_jade: 'Z314 호감도',
  affinity_Z314: 'Z314 호감도',
  affinity_crystal: 'N042 호감도',
  friendship_gauge: '우정 게이지',
};

export function ChoiceResultScreen() {
  const playerName = useGameStore((s) => s.playerName);
  const choiceResultContent = useGameStore((s) => s.choiceResultContent);
  const currentSceneId = useGameStore((s) => s.currentSceneId);
  const stats = useGameStore((s) => s.stats);

  // phase: 'result' = 결과 발표, 'dialogue' = 대사
  const [phase, setPhase] = useState<'result' | 'dialogue'>('result');
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [statVisible, setStatVisible] = useState(false);

  if (!choiceResultContent) return null;

  const sceneBg = SCENE_BACKGROUNDS[currentSceneId];
  const dialogues = choiceResultContent.dialogues ?? [];
  const currentLine = dialogues[dialogueIdx];

  const changes: { key: string; label: string; value: number }[] = [];
  for (const [key, value] of Object.entries(choiceResultContent.stat_changes)) {
    if (key === 'crystal_light_gauge') continue;
    changes.push({ key, label: statLabels[key] ?? key, value: value === 999 ? 999 : value });
  }

  function getAffinityHearts(key: string): { filled: number; total: number } {
    const total = 10;
    if (key === 'affinity_jade' || key === 'affinity_Z314') return { filled: Math.min(total, Math.floor(stats.affinityJade / 5)), total };
    if (key === 'affinity_crystal') return { filled: Math.min(total, Math.floor(stats.affinityCrystal / 5)), total };
    return { filled: 0, total: 0 };
  }

  // 스탯 뱃지 등장 딜레이
  useEffect(() => {
    if (phase === 'result') {
      const t = setTimeout(() => setStatVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // 대사 타이핑
  useEffect(() => {
    if (phase !== 'dialogue' || !currentLine) return;
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayText(currentLine.line.slice(0, i));
      if (i >= currentLine.line.length) { clearInterval(id); setIsTyping(false); }
    }, TYPING_SPEED_MS);
    return () => clearInterval(id);
  }, [phase, dialogueIdx, currentLine?.line]);

  const finishTyping = useCallback(() => {
    if (currentLine) { setDisplayText(currentLine.line); setIsTyping(false); }
  }, [currentLine?.line]);

  const handleAdvance = useCallback(() => {
    if (phase === 'result') {
      if (dialogues.length > 0) { setPhase('dialogue'); setDialogueIdx(0); }
      else confirmChoiceResultAndContinue();
      return;
    }
    if (isTyping) { finishTyping(); return; }
    if (dialogueIdx < dialogues.length - 1) { setDialogueIdx(i => i + 1); return; }
    confirmChoiceResultAndContinue();
  }, [phase, isTyping, dialogueIdx, dialogues.length, finishTyping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); handleAdvance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAdvance]);

  const isLetterScene = choiceResultContent.title === 'N042 신뢰 플래그 / N042 호감도 +12';
  const bgStyle = isLetterScene
    ? { background: '#0A0A1E' }
    : sceneBg
    ? { backgroundImage: `url(${sceneBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: '#0A0A1E', backgroundImage: 'radial-gradient(ellipse at 50% 30%, #1A1A6E 0%, #0A0A1E 60%)' };

  const letterBgLayers = isLetterScene ? (
    <>
      {/* 블러 처리된 보컬룸 배경 */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/background3_vocalroom.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(12px)',
        transform: 'scale(1.1)',
      }} />
      {/* 편지 이미지 (앞) */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/background5_letter.png)',
        backgroundSize: '75%', backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />
    </>
  ) : null;

  // ── Phase 1: 결과 발표 ──────────────────────────────────────────────────────
  if (phase === 'result') {
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
          @keyframes scanline    { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
          @keyframes fadeInUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes glowPulse   { 0%,100%{opacity:0.6} 50%{opacity:1} }
          @keyframes statPop     { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
          @keyframes cr-slidein  { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
          @keyframes cr-slideright { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
          @keyframes cr-pulse    { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
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
            animation: 'scanline 8s linear infinite',
          }} />
        </div>

        {/* 최상단 시스템 상태바 */}
        <div style={{
          position: 'relative', zIndex: 2, flexShrink: 0,
          borderBottom: '1px solid rgba(139,92,246,0.25)',
          background: 'linear-gradient(90deg, rgba(10,4,30,0.95) 0%, rgba(6,2,18,0.9) 100%)',
          padding: '8px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'fadeInUp 0.4s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#a78bfa', boxShadow: '0 0 6px #a78bfa',
                animation: 'cr-pulse 1.8s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '9px', color: 'rgba(167,139,250,0.7)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
                NOCTURNE Z76
              </span>
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(139,92,246,0.4)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              SYS.CHOICE_RESULT
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,215,0,0.5)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
              {currentSceneId ?? 'SCENE'}
            </span>
          </div>
        </div>

        {/* 상단 금색 그라디언트 선 */}
        <div style={{
          height: '2px', flexShrink: 0,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7) 30%, rgba(255,215,0,0.5) 50%, rgba(139,92,246,0.7) 70%, transparent)',
        }} />

        {/* 메인 2단 레이아웃 */}
        <div style={{
          flex: 1, display: 'flex', position: 'relative', zIndex: 1, minHeight: 0,
        }}>

          {/* 좌측 패널 (42%) */}
          <div style={{
            width: '42%', flexShrink: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '2.5rem 2.5rem',
            borderRight: '1px solid rgba(139,92,246,0.2)',
            background: 'linear-gradient(135deg, rgba(10,4,30,0.6) 0%, transparent 100%)',
            animation: 'cr-slidein 0.5s ease 0.1s both',
          }}>
            {/* CHOICE RESULT 레이블 */}
            <div style={{
              fontSize: '9px', letterSpacing: '0.35em',
              color: 'rgba(167,139,250,0.65)', fontFamily: 'monospace',
              marginBottom: '1.25rem',
              animation: 'glowPulse 2.2s ease-in-out infinite',
            }}>
              ◈ CHOICE RESULT ◈
            </div>

            {/* 제목 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{
                fontSize: 'clamp(1.05rem, 2.2vw, 1.35rem)',
                color: '#FFD700',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1.35,
                textShadow: '0 0 16px rgba(255,215,0,0.45)',
                margin: 0,
              }}>
                {choiceResultContent.title}
              </h2>
            </div>

            {/* 구분선 */}
            <div style={{ height: '1px', background: 'rgba(139,92,246,0.3)', marginBottom: '1.25rem' }} />

            {/* 나레이션 */}
            {choiceResultContent.narration && (
              <p style={{
                color: 'rgba(220,210,255,0.88)',
                lineHeight: 1.8,
                marginBottom: '1.25rem',
                fontStyle: 'italic',
                fontSize: '0.95rem',
                borderLeft: '3px solid rgba(139,92,246,0.45)',
                paddingLeft: '14px',
              }}>
                {choiceResultContent.narration}
              </p>
            )}

            {/* 시스템 알림 */}
            {choiceResultContent.system_alert && (
              <div style={{
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.35)',
                borderLeft: '3px solid #fbbf24',
                borderRadius: '0 4px 4px 0',
                padding: '10px 14px',
                marginBottom: '1.25rem',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <span style={{ color: '#fbbf24', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>⚠</span>
                <span style={{ color: 'rgba(251,191,36,0.9)', fontSize: '0.88rem', lineHeight: 1.6, fontFamily: 'monospace' }}>
                  {choiceResultContent.system_alert}
                </span>
              </div>
            )}

            {/* 하단 힌트 */}
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{
                fontSize: '10px', letterSpacing: '0.2em',
                color: 'rgba(167,139,250,0.5)',
                fontFamily: 'monospace',
                animation: 'glowPulse 1.8s ease-in-out infinite',
              }}>
                클릭하여 계속 ▶
              </span>
            </div>
          </div>

          {/* 우측 패널 — 스탯 변화 */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '2.5rem 2rem',
            animation: 'cr-slideright 0.55s ease 0.15s both',
          }}>

            {/* STAT CHANGES 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '1rem',
            }}>
              <div style={{ width: '3px', height: '14px', background: '#FFD700', borderRadius: '2px', boxShadow: '0 0 6px rgba(255,215,0,0.6)' }} />
              <span style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,215,0,0.75)', fontFamily: 'monospace' }}>
                ◈ STAT CHANGES ◈
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,215,0,0.15)' }} />
            </div>

            {changes.length > 0 ? (
              <div style={{
                border: '1px solid rgba(139,92,246,0.28)',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(10,4,30,0.72) 0%, rgba(6,2,18,0.88) 100%)',
              }}>
                {changes.map(({ key, label, value }, i) => {
                  const isAffinity = key === 'affinity_jade' || key === 'affinity_Z314' || key === 'affinity_crystal';
                  const hearts = isAffinity ? getAffinityHearts(key) : null;
                  const isPositive = value >= 0;
                  const isMax = value === 999;
                  const accentColor = isPositive ? '#a78bfa' : '#f87171';
                  const accentDim = isPositive ? 'rgba(139,92,246,0.22)' : 'rgba(239,68,68,0.22)';
                  return (
                    <div key={label} style={{
                      display: 'flex', flexDirection: 'column',
                      borderBottom: i < changes.length - 1 ? '1px solid rgba(139,92,246,0.12)' : 'none',
                      ...(statVisible ? { animation: `statPop 0.4s ease ${i * 0.1}s both` } : { opacity: 0 }),
                    }}>
                      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '66px' }}>
                        {/* 값 뱃지 */}
                        <div style={{
                          width: '74px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `linear-gradient(135deg, ${accentDim} 0%, rgba(8,4,24,0.7) 100%)`,
                          borderRight: '1px solid rgba(139,92,246,0.15)',
                          position: 'relative',
                        }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                          <span style={{
                            fontSize: '24px', fontFamily: 'monospace', fontWeight: 800,
                            lineHeight: 1, color: accentColor,
                            textShadow: `0 0 14px ${accentColor}88`,
                          }}>
                            {isPositive ? '+' : ''}{isMax ? 'MAX' : value}
                          </span>
                        </div>
                        {/* 레이블 + 증감 */}
                        <div style={{
                          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          padding: '0 14px',
                          background: 'linear-gradient(90deg, rgba(14,6,38,0.72) 0%, rgba(6,2,18,0.88) 100%)',
                          gap: '3px',
                        }}>
                          <span style={{ fontSize: '13px', color: 'rgba(230,220,255,0.92)', fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
                          <span style={{ fontSize: '9px', color: `${accentColor}99`, letterSpacing: '0.1em', fontWeight: 500 }}>
                            {isPositive ? '▲ INCREASE' : '▼ DECREASE'}
                          </span>
                        </div>
                      </div>
                      {isAffinity && hearts && hearts.total > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '8px 12px',
                          background: 'linear-gradient(90deg, rgba(30,6,40,0.85) 0%, rgba(10,2,20,0.92) 100%)',
                          borderTop: '1px solid rgba(244,114,182,0.18)',
                        }}>
                          <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(244,114,182,0.6)', fontWeight: 600, marginRight: '4px', fontFamily: 'monospace' }}>AFFINITY</span>
                          {Array.from({ length: hearts.total }).map((_, hi) => (
                            <span key={hi} style={{
                              fontSize: '13px',
                              color: hi < hearts.filled ? '#f472b6' : 'rgba(255,255,255,0.18)',
                              textShadow: hi < hearts.filled ? '0 0 6px rgba(244,114,182,0.7)' : 'none',
                              transition: 'color 0.3s',
                            }}>
                              {hi < hearts.filled ? '♥' : '♡'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                fontSize: '11px', color: 'rgba(167,139,250,0.35)',
                textAlign: 'center', padding: '2rem 0', fontFamily: 'monospace',
                letterSpacing: '0.15em',
              }}>
                — NO STAT CHANGES —
              </div>
            )}
          </div>
        </div>

        {/* 최하단 상태바 */}
        <div style={{
          position: 'relative', zIndex: 2, flexShrink: 0,
          borderTop: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(4,4,15,0.9)',
          padding: '6px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '8px', color: 'rgba(139,92,246,0.3)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
            {currentSceneId ?? 'SCENE_ID'}
          </span>
          <span style={{ fontSize: '8px', color: 'rgba(139,92,246,0.3)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
            RESULT LOG
          </span>
        </div>
      </div>
    );
  }

  // ── Phase 2: 대사 (DialogueScreen 스타일 + 우측 스탯 패널) ──────────────────
  const resolvedName = playerName || localStorage.getItem('nocturne_player_name') || '플레이어';
  const speakerName = currentLine
    ? (currentLine.speaker_label ?? getSpeakerDisplayName(currentLine.speaker, resolvedName))
        .replace('[진짜 이름]', resolvedName)
    : '';
  const isGuardian = currentLine?.speaker === 'guardian';

  return (
    <div className="flex flex-col" style={{ ...bgStyle, height: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes arrowBounce { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(3px)} }
        @keyframes charSlideRight {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes statPanelSlideIn {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes statBarGrow {
          from { width: 0%; }
        }
        @keyframes rs-glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes rs-fadeInUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes guardianRise {
          from { opacity: 0; transform: translateX(-50%) translateY(40px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes guardianGlow {
          0%,100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
          50%     { opacity: 0.75; transform: translateX(-50%) scale(1.05); }
        }
        @keyframes cr2-scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes cr2-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        @keyframes cr2-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {letterBgLayers}

      {/* 배경 오버레이 */}
      {sceneBg && !isLetterScene && (
        <div style={{
          position: 'fixed', inset: 0,
          background: isGuardian ? 'rgba(0,0,0,0.70)' : 'rgba(0,0,0,0.5)',
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* HUD — SF 터미널 스타일 */}
      <header style={{
        position: 'relative', zIndex: 2,
        background: 'linear-gradient(180deg, rgba(4,2,18,0.97) 0%, rgba(6,2,20,0.90) 100%)',
        borderBottom: '1px solid rgba(139,92,246,0.3)',
        padding: 0, flexShrink: 0,
      }}>
        {/* 상단 금색 그라디언트 선 */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7) 30%, rgba(255,215,0,0.5) 50%, rgba(139,92,246,0.7) 70%, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 20px' }}>
          {/* 좌: 씬 레이블 + 제목 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#a78bfa', boxShadow: '0 0 5px #a78bfa',
                animation: 'cr2-pulse 1.8s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '9px', color: 'rgba(167,139,250,0.65)', letterSpacing: '0.25em', fontFamily: 'monospace' }}>
                ◈ RESULT SCENE
              </span>
            </div>
            <span style={{
              fontSize: '11px', color: '#FFD700', letterSpacing: '0.05em', fontWeight: 600,
              textShadow: '0 0 8px rgba(255,215,0,0.3)',
            }}>
              {choiceResultContent.title}
            </span>
          </div>
          {/* 우: 대사 카운터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(167,139,250,0.45)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              COMM LOG
            </span>
            <span style={{
              fontSize: '11px', color: 'rgba(255,215,0,0.7)', letterSpacing: '0.08em',
              fontFamily: 'monospace', fontWeight: 600,
            }}>
              {String(dialogueIdx + 1).padStart(2, '0')} / {String(dialogues.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* ── 메인 영역 ── */}
      {isGuardian ? (
        /* 수호신 레이아웃: 캐릭터 중앙 포컬 (원래 배치) + 우측 큰 스탯 패널 */
        <div style={{ flex: 1, position: 'relative', zIndex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>

          {/* 수호신 글로우 배경 */}
          <div style={{
            position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            width: '340px', height: '340px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, rgba(180,120,0,0.08) 50%, transparent 75%)',
            animation: 'guardianGlow 3s ease-in-out infinite', zIndex: 1, pointerEvents: 'none',
          }} />

          {/* 수호신 캐릭터 — 원래 배치 유지 (중앙, 전체 높이) */}
          <img
            src={currentSceneId === 'scene_4_1' ? '/guardian2.png' : '/guardian.png'}
            alt="수호신"
            style={{
              width: 'auto', height: '100%', maxHeight: '100%',
              objectFit: 'contain', objectPosition: 'bottom',
              zIndex: 2, flexShrink: 0,
              animation: 'guardianRise 0.65s cubic-bezier(0.22,1,0.36,1) both',
              filter: [
                'drop-shadow(0px 0px 32px rgba(255,215,0,0.55))',
                'drop-shadow(0px 0px 12px rgba(255,180,0,0.35))',
                'drop-shadow(0px 4px 8px rgba(0,0,0,0.95))',
              ].join(' '),
            }}
          />

          {/* 우측 큰 스탯 패널 (절대 위치) */}
          {changes.length > 0 && (
            <div style={{
              position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
              width: '300px', zIndex: 3,
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              overflow: 'hidden', borderRadius: '6px',
              border: '1px solid rgba(255,215,0,0.28)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              animation: 'statPanelSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s both',
            }}>
              <div style={{ background: 'linear-gradient(90deg, rgba(100,60,0,0.7) 0%, rgba(20,8,0,0.9) 100%)', borderBottom: '1px solid rgba(255,215,0,0.25)', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '3px', height: '16px', background: '#FFD700', borderRadius: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(255,215,0,0.92)', fontWeight: 700 }}>STAT CHANGES</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {changes.map(({ key, label, value }, i) => {
                  const isPositive = value >= 0;
                  const isMax = value === 999;
                  const accentColor = isPositive ? '#a78bfa' : '#f87171';
                  const accentDim = isPositive ? 'rgba(139,92,246,0.22)' : 'rgba(239,68,68,0.22)';
                  const isAffinity = key === 'affinity_jade' || key === 'affinity_Z314' || key === 'affinity_crystal';
                  const hearts = isAffinity ? getAffinityHearts(key) : null;
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', borderBottom: i < changes.length - 1 ? '1px solid rgba(255,215,0,0.12)' : 'none', animation: `rs-fadeInUp 0.35s ease ${0.12 + i * 0.08}s both` }}>
                      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '66px' }}>
                        <div style={{ width: '74px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accentDim} 0%, rgba(8,4,24,0.7) 100%)`, borderRight: '1px solid rgba(255,215,0,0.15)', position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                          <span style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: '800', lineHeight: 1, color: accentColor, textShadow: `0 0 14px ${accentColor}88` }}>
                            {isPositive ? '+' : ''}{isMax ? 'MAX' : value}
                          </span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px', background: 'linear-gradient(90deg, rgba(14,6,38,0.72) 0%, rgba(6,2,18,0.88) 100%)', gap: '3px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(230,220,255,0.92)', fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
                          <span style={{ fontSize: '9px', color: `${accentColor}99`, letterSpacing: '0.1em', fontWeight: 500 }}>{isPositive ? '▲ INCREASE' : '▼ DECREASE'}</span>
                        </div>
                      </div>
                      {isAffinity && hearts && hearts.total > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', background: 'linear-gradient(90deg, rgba(30,6,40,0.85) 0%, rgba(10,2,20,0.92) 100%)', borderTop: '1px solid rgba(244,114,182,0.18)' }}>
                          <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(244,114,182,0.6)', fontWeight: 600, marginRight: '4px' }}>AFFINITY</span>
                          {Array.from({ length: hearts.total }).map((_, hi) => (
                            <span key={hi} style={{ fontSize: '16px', color: hi < hearts.filled ? '#f472b6' : 'rgba(255,255,255,0.12)', textShadow: hi < hearts.filled ? '0 0 8px rgba(244,114,182,0.9)' : 'none', lineHeight: 1 }}>
                              {hi < hearts.filled ? '♥' : '♡'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 일반 캐릭터 레이아웃: 3:2 분할 */
        <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 1, minHeight: 0 }}>

          {/* 왼쪽 3/5 — 캐릭터 */}
          <div style={{
            flex: 3,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '0.5rem',
            paddingRight: '0',
            animation: 'charSlideRight 0.55s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {choiceResultContent.title === 'Z314 우정 게이지 MAX / 팀워크 플래그 해금' ? (
              <img src="/jade_littleprince1.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'Z314 공감 이벤트 / 감성 스탯 +10' ? (
              <img src="/jade_littleprince2.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'N042 공통 이벤트 트리거 / 기억 조각 +6%' ? (
              <img src="/jade_littleprince3.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'Z314 호감도 +10 / N042 관련 정보 획득' ? (
              <img src="/jade_opening.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '신뢰의 첫 걸음' ? (
              <img src="/jade_choice1.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '조심스러운 시작' ? (
              <img src="/jade_choice2.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '고독의 시작' ? (
              <img src="/jade_opening.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'N042 철학 공감 이벤트 / 기억 조각 +10%' ? (
              <img src="/crystal_name1.png" alt="크리스탈" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '3인 공동 거울 이벤트 해금 (Z314·N042·E527)' && currentLine?.speaker === 'jade' ? (
              <img src="/jade_littleprince2.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '3인 공동 거울 이벤트 해금 (Z314·N042·E527)' ? (
              <img src="/crystal_name3.png" alt="크리스탈" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'N042 빛 게이지 회복 / N042 호감도 MAX' ? (
              <img src="/crystal_name2.png" alt="크리스탈" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '빛 게이지 안전 / 기억 조각 정체 / N042 실망 이벤트' ? (
              <img src="/crystal_chance.png" alt="크리스탈" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'N042 호감도 +15 / 용기 플래그 획득' ? (
              <img src="/crystal_choice1.png" alt="크리스탈" style={{ width: '320px', height: '480px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === 'N042 호감도 +8 / 공감 플래그 획득' && currentLine?.speaker !== 'player' ? (
              <img src="/crystal_choice2.png" alt="크리스탈" style={{ width: '320px', height: '480px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '수호 엔딩 / 우정 중심 연출' ? (
              <img src="/crystal_name1.png" alt="크리스탈" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '자기 확신 엔딩 / 최고 무대 연출 해금' && currentLine?.speaker === 'jade' ? (
              <img src="/jade_littleprince2.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '자기 확신 엔딩 / 최고 무대 연출 해금' ? (
              <img src="/crystal_choice4.png" alt="크리스탈" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '안정적 진행 / 팀워크 스탯 MAX' ? (
              <img src="/jade_littleprince2.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : choiceResultContent.title === '사명 엔딩 / 가장 웅장한 무대 연출' ? (
              <img src="/jade_littleprince3.png" alt="제이드" style={{ width: '320px', height: '420px', objectFit: 'contain', objectPosition: 'bottom', flexShrink: 0, filter: 'drop-shadow(0px 8px 24px rgba(80,60,180,0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))' }} />
            ) : isLetterScene ? null : (
              <div style={{ width: '220px', height: '320px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }} />
            )}
          </div>

          {/* 오른쪽 2/5 — 스탯 패널 */}
          <div style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '1rem 1rem 1rem 0',
            animation: 'statPanelSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }}>
            <div style={{
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              overflow: 'hidden', borderRadius: '6px',
              border: '1px solid rgba(139,92,246,0.28)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.03)',
            }}>
              <div style={{ background: 'linear-gradient(90deg, rgba(88,28,235,0.55) 0%, rgba(20,8,50,0.85) 100%)', borderBottom: '1px solid rgba(167,139,250,0.25)', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '3px', height: '16px', background: '#FFD700', borderRadius: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(255,215,0,0.92)', fontWeight: 700 }}>STAT CHANGES</span>
              </div>
              {changes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {changes.map(({ key, label, value }, i) => {
                    const isPositive = value >= 0;
                    const isMax = value === 999;
                    const accentColor = isPositive ? '#a78bfa' : '#f87171';
                    const accentDim = isPositive ? 'rgba(139,92,246,0.22)' : 'rgba(239,68,68,0.22)';
                    const isAffinity = key === 'affinity_jade' || key === 'affinity_Z314' || key === 'affinity_crystal';
                    const hearts = isAffinity ? getAffinityHearts(key) : null;
                    return (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', borderBottom: i < changes.length - 1 ? '1px solid rgba(139,92,246,0.12)' : 'none', animation: `rs-fadeInUp 0.35s ease ${0.12 + i * 0.08}s both` }}>
                        {/* 스탯 행 */}
                        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '66px' }}>
                          <div style={{ width: '74px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accentDim} 0%, rgba(8,4,24,0.7) 100%)`, borderRight: '1px solid rgba(139,92,246,0.15)', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                            <span style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: '800', lineHeight: 1, color: accentColor, letterSpacing: '-0.02em', textShadow: `0 0 14px ${accentColor}88` }}>
                              {isPositive ? '+' : ''}{isMax ? 'MAX' : value}
                            </span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px', background: 'linear-gradient(90deg, rgba(14,6,38,0.72) 0%, rgba(6,2,18,0.88) 100%)', gap: '3px' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(230,220,255,0.92)', fontWeight: 600, letterSpacing: '0.03em', lineHeight: 1.2 }}>{label}</span>
                            <span style={{ fontSize: '9px', color: `${accentColor}99`, letterSpacing: '0.12em', fontWeight: 500 }}>{isPositive ? '▲ INCREASE' : '▼ DECREASE'}</span>
                          </div>
                        </div>
                        {/* 호감도 하트 칸 (별도 행) */}
                        {isAffinity && hearts && hearts.total > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '10px 14px',
                            background: 'linear-gradient(90deg, rgba(30,6,40,0.85) 0%, rgba(10,2,20,0.92) 100%)',
                            borderTop: '1px solid rgba(244,114,182,0.18)',
                          }}>
                            <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(244,114,182,0.6)', fontWeight: 600, marginRight: '4px' }}>AFFINITY</span>
                            {Array.from({ length: hearts.total }).map((_, hi) => (
                              <span key={hi} style={{
                                fontSize: '20px',
                                color: hi < hearts.filled ? '#f472b6' : 'rgba(255,255,255,0.12)',
                                textShadow: hi < hearts.filled ? '0 0 8px rgba(244,114,182,0.9)' : 'none',
                                lineHeight: 1,
                              }}>
                                {hi < hearts.filled ? '♥' : '♡'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'rgba(167,139,250,0.4)', textAlign: 'center', padding: '1.5rem 0', background: 'rgba(6,2,18,0.85)' }}>—</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 대사창 — SF 터미널 스타일 (DialogueScreen과 통일) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleAdvance}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAdvance()}
        style={{
          position: 'relative', zIndex: 1,
          margin: '0 16px 16px',
          minHeight: '130px',
          cursor: 'pointer',
          outline: 'none',
          background: sceneBg
            ? 'linear-gradient(135deg, rgba(2,6,20,0.93) 0%, rgba(4,10,28,0.90) 100%)'
            : 'linear-gradient(135deg, rgba(4,8,26,0.82) 0%, rgba(2,4,18,0.78) 100%)',
          border: '1px solid rgba(0,180,255,0.28)',
          boxShadow: '0 0 20px rgba(0,100,255,0.08), 0 4px 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,60,140,0.04)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* SF 코너 데코레이터 */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: '14px', height: '14px', borderTop: '2px solid rgba(0,200,255,0.85)', borderLeft: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'rs-glowPulse 2.5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: -1, right: -1, width: '14px', height: '14px', borderTop: '2px solid rgba(0,200,255,0.85)', borderRight: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'rs-glowPulse 2.5s ease-in-out infinite 0.6s' }} />
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: '14px', height: '14px', borderBottom: '2px solid rgba(0,200,255,0.85)', borderLeft: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'rs-glowPulse 2.5s ease-in-out infinite 1.2s' }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: '14px', height: '14px', borderBottom: '2px solid rgba(0,200,255,0.85)', borderRight: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'rs-glowPulse 2.5s ease-in-out infinite 1.8s' }} />

        {/* 스캔라인 효과 */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '30%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,180,255,0.025) 50%, transparent 100%)',
            animation: 'cr2-scan 5s linear infinite',
          }} />
        </div>

        {/* 발화자 이름 바 */}
        {currentLine && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px 7px',
            borderBottom: '1px solid rgba(0,160,255,0.18)',
            background: isGuardian
              ? 'linear-gradient(90deg, rgba(120,80,0,0.18), rgba(80,50,0,0.08), transparent)'
              : 'linear-gradient(90deg, rgba(0,100,200,0.14), rgba(0,60,140,0.06), transparent)',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: '3px', height: '14px', background: isGuardian ? 'rgba(255,215,0,0.9)' : 'rgba(0,210,255,0.9)', boxShadow: isGuardian ? '0 0 6px rgba(255,215,0,0.8)' : '0 0 6px rgba(0,210,255,0.8)' }} />
              <div style={{ width: '2px', height: '9px', background: isGuardian ? 'rgba(255,215,0,0.4)' : 'rgba(0,210,255,0.4)' }} />
            </div>
            <span style={{
              fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.18em',
              color: isGuardian ? 'rgba(255,220,100,0.95)' : 'rgba(0,220,255,0.95)',
              textShadow: isGuardian ? '0 0 8px rgba(255,200,0,0.5)' : '0 0 8px rgba(0,200,255,0.5)',
              visibility: speakerName ? 'visible' : 'hidden',
            }}>
              {speakerName || 'SYSTEM'}
            </span>
            <div style={{ marginLeft: 'auto', fontSize: '8px', color: 'rgba(139,92,246,0.4)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>
              VOICE LOG
            </div>
          </div>
        )}

        {/* 대사 텍스트 */}
        <div style={{ padding: '12px 16px 40px', position: 'relative', zIndex: 1 }}>
          <p style={{
            color: isGuardian ? 'rgba(255,235,160,0.95)' : 'rgba(205,228,255,0.95)',
            lineHeight: 1.85,
            fontSize: '0.96rem',
            letterSpacing: '0.025em',
            margin: 0,
          }}>
            {displayText}
            {isTyping && <span style={{ opacity: 0.6, animation: 'cr2-blink 0.8s step-end infinite' }}>|</span>}
          </p>
        </div>

        {/* 다음 화살표 */}
        {!isTyping && (
          <div style={{
            position: 'absolute', bottom: '11px', right: '14px',
            display: 'flex', alignItems: 'center', gap: '6px',
            opacity: 0.55,
            animation: 'arrowBounce 1.3s ease-in-out infinite',
            zIndex: 2,
          }}>
            <span style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(0,200,255,0.8)', letterSpacing: '0.15em' }}>NEXT</span>
            <svg width="14" height="11" viewBox="0 0 20 16" fill="none">
              <polygon points="2,2 18,2 10,14" fill="rgba(0,200,255,0.75)" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
