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
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ ...bgStyle, position: 'relative', cursor: 'pointer' }} onClick={handleAdvance}>
        <style>{`
          @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes glowPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
          @keyframes statPop { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        `}</style>

        {/* 배경 오버레이 */}
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 0 }} />

        {/* 스캔라인 효과 */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)',
            animation: 'scanline 4s linear infinite',
          }} />
        </div>

        {/* 메인 결과 패널 */}
        <div style={{
          position: 'relative', zIndex: 2,
          width: '90%', maxWidth: '560px',
          animation: 'fadeInUp 0.6s ease both',
        }}>
          {/* 상단 강조선 */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #a78bfa 30%, #FFD700 50%, #a78bfa 70%, transparent)', marginBottom: '0' }} />

          <div style={{
            background: 'linear-gradient(180deg, rgba(10,4,30,0.92) 0%, rgba(6,2,20,0.88) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(139,92,246,0.35)',
            borderTop: 'none',
            padding: '2rem 2.5rem 2.5rem',
          }}>
            {/* RESULT 레이블 */}
            <div style={{
              fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(167,139,250,0.7)',
              marginBottom: '0.5rem', animation: 'glowPulse 2s ease-in-out infinite',
            }}>
              ◈ CHOICE RESULT ◈
            </div>

            {/* 제목 */}
            <h2 style={{
              fontSize: '1.4rem', color: '#FFD700', marginBottom: '1.2rem',
              fontWeight: 'bold', letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(255,215,0,0.5)',
            }}>
              {choiceResultContent.title}
            </h2>

            {/* 구분선 */}
            <div style={{ height: '1px', background: 'rgba(139,92,246,0.3)', marginBottom: '1.2rem' }} />

            {/* 나레이션 */}
            {choiceResultContent.narration && (
              <p style={{
                color: 'rgba(220,210,255,0.9)', lineHeight: 1.75, marginBottom: '1.5rem',
                fontStyle: 'italic', fontSize: '0.97rem',
              }}>
                {choiceResultContent.narration}
              </p>
            )}

            {/* 시스템 알림 */}
            {choiceResultContent.system_alert && (
              <div style={{
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)',
                borderRadius: '6px', padding: '10px 14px', marginBottom: '1.2rem',
                color: '#fbbf24', fontSize: '0.88rem',
              }}>
                ⚠ {choiceResultContent.system_alert}
              </div>
            )}

            {/* 스탯 변화 */}
            {changes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '9px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>
                  STAT CHANGES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {changes.map(({ key, label, value }, i) => {
                    const isAffinity = key === 'affinity_jade' || key === 'affinity_Z314' || key === 'affinity_crystal';
                    const hearts = isAffinity ? getAffinityHearts(key) : null;
                    return (
                    <div key={label} style={{
                      display: 'flex', flexDirection: 'column', gap: '4px',
                      opacity: statVisible ? 1 : 0,
                      animation: statVisible ? `statPop 0.4s ease ${i * 0.1}s both` : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(200,190,255,0.7)', minWidth: '90px' }}>{label}</span>
                        {/* 바 */}
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: value === 999 ? '100%' : `${Math.min(100, Math.abs(value) * 10)}%`,
                            background: value >= 0
                              ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                              : 'linear-gradient(90deg, #ef4444, #f87171)',
                            borderRadius: '3px',
                            boxShadow: value >= 0 ? '0 0 6px rgba(139,92,246,0.7)' : '0 0 6px rgba(239,68,68,0.7)',
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '12px', fontFamily: 'monospace', minWidth: '42px', textAlign: 'right',
                          color: value >= 0 ? '#c4b5fd' : '#f87171',
                          fontWeight: 'bold',
                        }}>
                          {value >= 0 ? '+' : ''}{value === 999 ? 'MAX' : value}
                        </span>
                      </div>
                      {isAffinity && hearts && hearts.total > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', paddingLeft: '90px' }}>
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
              </div>
            )}

            {/* 계속 힌트 */}
            <div style={{
              textAlign: 'right', fontSize: '10px', color: 'rgba(167,139,250,0.5)',
              letterSpacing: '0.1em', animation: 'glowPulse 1.8s ease-in-out infinite',
            }}>
              클릭하여 계속 ▶
            </div>
          </div>

          {/* 하단 강조선 */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #a78bfa 30%, #FFD700 50%, #a78bfa 70%, transparent)' }} />
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
  const isLast = dialogueIdx >= dialogues.length - 1;
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

      {/* HUD */}
      <header style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(6,2,20,0.80) 100%)',
        borderBottom: '1px solid rgba(139,92,246,0.35)',
        padding: 0, flexShrink: 0,
      }}>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7) 30%, rgba(255,215,0,0.5) 50%, rgba(139,92,246,0.7) 70%, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.15em' }}>◈ RESULT SCENE</div>
          <div style={{ fontSize: '11px', color: '#FFD700', letterSpacing: '0.06em' }}>{choiceResultContent.title}</div>
          <div style={{ fontSize: '10px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.1em' }}>
            {dialogueIdx + 1} / {dialogues.length}
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
              width: '220px', zIndex: 3,
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
                      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '60px' }}>
                        <div style={{ width: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accentDim} 0%, rgba(8,4,24,0.7) 100%)`, borderRight: '1px solid rgba(255,215,0,0.15)', position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                          <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: '800', lineHeight: 1, color: accentColor, textShadow: `0 0 14px ${accentColor}88` }}>
                            {isPositive ? '+' : ''}{isMax ? 'MAX' : value}
                          </span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px', background: 'linear-gradient(90deg, rgba(14,6,38,0.72) 0%, rgba(6,2,18,0.88) 100%)', gap: '3px' }}>
                          <span style={{ fontSize: '12px', color: 'rgba(230,220,255,0.92)', fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
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

      {/* 대사창 (전체 너비) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleAdvance}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAdvance()}
        style={{
          margin: '0 0.75rem 0.75rem',
          padding: '1rem 1.25rem',
          paddingBottom: '2.5rem',
          borderRadius: '10px',
          border: '1px solid rgba(139,92,246,0.2)',
          minHeight: '110px',
          cursor: 'pointer',
          background: sceneBg ? 'rgba(0,0,0,0.68)' : 'rgba(0,0,0,0.45)',
          position: 'relative', zIndex: 1,
          outline: 'none',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: '0.8rem', color: 'rgba(167,139,250,0.85)', marginBottom: '0.3rem' }}>{speakerName}</p>
        <p style={{ color: '#fff', lineHeight: 1.7, fontSize: '0.97rem' }}>
          {displayText}
          {isTyping && <span style={{ animation: 'rs-glowPulse 0.6s ease-in-out infinite' }}>|</span>}
        </p>
        {!isTyping && (
          <div style={{
            position: 'absolute', bottom: '12px', right: '16px',
            opacity: 0.55, animation: 'arrowBounce 1.2s ease-in-out infinite',
          }}>
            {isLast
              ? <svg width="20" height="16" viewBox="0 0 20 16" fill="none"><polygon points="2,2 18,2 10,14" fill="rgba(255,215,0,0.9)"/></svg>
              : <svg width="20" height="16" viewBox="0 0 20 16" fill="none"><polygon points="2,2 18,2 10,14" fill="rgba(255,255,255,0.75)"/></svg>
            }
          </div>
        )}
      </div>
    </div>
  );
}
