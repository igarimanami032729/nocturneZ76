import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getCurrentChapterAndScene, getSpeakerDisplayName, goToScene, checkEnding, checkLightGaugeReset } from '../game/engine';
import { SCENE_BACKGROUNDS } from '../game/sceneBackgrounds';
import type { DialogueLine } from '../types/game';

const TYPING_SPEED_MS = 25;

export function DialogueScreen({ uiVisible = true }: { uiVisible?: boolean }) {
  const navigate = useNavigate();
  const script = useGameStore((s) => s.script);
  const currentChapterIndex = useGameStore((s) => s.currentChapterIndex);
  const currentSceneId = useGameStore((s) => s.currentSceneId);
  const dialogueIndex = useGameStore((s) => s.dialogueIndex);
  const playerName = useGameStore((s) => s.playerName);
  const setChoiceVisible = useGameStore((s) => s.setChoiceVisible);
  const nextDialogue = useGameStore((s) => s.nextDialogue);
  const stats = useGameStore((s) => s.stats);
  const setCurrentEnding = useGameStore((s) => s.setCurrentEnding);

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { chapter, scene } = getCurrentChapterAndScene(script!, currentChapterIndex, currentSceneId) ?? { chapter: null, scene: null };

  const dialogues: DialogueLine[] = scene?.dialogues ?? [];
  const currentLine = dialogues[dialogueIndex];
  const isNarration = currentLine?.speaker === 'narration';
  const isGuardian = currentLine?.speaker === 'guardian';

  const finishTyping = useCallback(() => {
    if (!currentLine) return;
    setDisplayText(currentLine.line);
    setIsTyping(false);
  }, [currentLine?.line]);

  useEffect(() => {
    // uiVisible이 false면 타이핑 시작하지 않음 (박스 등장 후 텍스트 시작)
    if (!currentLine || !uiVisible) {
      setDisplayText('');
      setIsTyping(false);
      return;
    }
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayText(currentLine.line.slice(0, i));
      if (i >= currentLine.line.length) {
        clearInterval(id);
        setIsTyping(false);
      }
    }, TYPING_SPEED_MS);
    return () => clearInterval(id);
  }, [currentChapterIndex, currentSceneId, dialogueIndex, currentLine?.line, uiVisible]);

  const handleAdvance = useCallback(() => {
    if (!script || !scene) return;
    if (isTyping) {
      finishTyping();
      return;
    }
    if (dialogueIndex < dialogues.length - 1) {
      nextDialogue();
      return;
    }
    if (scene.choice) {
      setChoiceVisible(true);
      return;
    }
    if (scene.next_scene) {
      goToScene(scene.next_scene);
      return;
    }
    if (currentSceneId === 'scene_5_2') {
      const endingId = checkEnding();
      setCurrentEnding(endingId);
      navigate('/ending');
      return;
    }
    if (scene.next_scene) goToScene(scene.next_scene);
  }, [script, scene, dialogueIndex, dialogues.length, isTyping, finishTyping, currentSceneId, setChoiceVisible, nextDialogue, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAdvance]);

  useEffect(() => {
    if (checkLightGaugeReset()) return;
  }, [currentSceneId, dialogueIndex]);

  if (!script || !chapter || !scene) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        로딩 중...
      </div>
    );
  }

  const resolvedName = playerName || localStorage.getItem('nocturne_player_name') || '플레이어';
  const speakerName = currentLine
    ? (currentLine.speaker_label ?? getSpeakerDisplayName(currentLine.speaker, resolvedName))
        .replace('[진짜 이름]', resolvedName)
    : '';
  const atEndOfScene = dialogueIndex >= dialogues.length && !scene?.choice && !scene?.next_scene;

  const sceneBg = SCENE_BACKGROUNDS[currentSceneId];

  return (
    <div
      className="flex flex-col"
      style={
        sceneBg
          ? {
              height: '100vh', overflow: 'hidden',
              backgroundImage: `url(${sceneBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : {
              height: '100vh', overflow: 'hidden',
              background: '#0A0A1E',
              backgroundImage: 'radial-gradient(ellipse at 50% 20%, #1A1A6E 0%, #0A0A1E 70%)',
            }
      }
    >
      {/* 배경 이미지 어두운 오버레이 (가독성) */}
      {sceneBg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* HUD + 캐릭터 + 대사창: uiVisible false 동안 숨김, 2초 후 페이드인 */}
      <div style={{
        opacity: uiVisible ? 1 : 0,
        transition: uiVisible ? 'opacity 0.8s ease' : 'none',
        pointerEvents: uiVisible ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>

      {/* HUD */}
      <header style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(6,2,20,0.75) 100%)',
        borderBottom: '1px solid rgba(139,92,246,0.35)',
        boxShadow: '0 1px 0 rgba(139,92,246,0.15), inset 0 -1px 0 rgba(0,0,0,0.5)',
        padding: '0',
      }}>
        {/* 상단 얇은 강조선 */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7) 30%, rgba(255,215,0,0.5) 50%, rgba(139,92,246,0.7) 70%, transparent)', marginBottom: '0' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>

          {/* 좌: 코드명 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#a78bfa',
              boxShadow: '0 0 6px #a78bfa',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.15em', lineHeight: 1 }}>코드명</div>
              <div style={{ fontSize: '15px', color: '#e2d9ff', fontFamily: 'monospace', letterSpacing: '0.1em', lineHeight: 1.4 }}>
                E527
              </div>
            </div>
          </div>

          {/* 중앙: 게이지들 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            {/* 빛 게이지 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: 'rgba(167,139,250,0.7)', letterSpacing: '0.12em', minWidth: '52px', textAlign: 'right' }}>LIGHT</span>
              {/* 분절형 바 */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const filled = i < Math.round(stats.lightGauge / 5);
                  return (
                    <div key={i} style={{
                      width: '7px', height: '10px',
                      background: filled
                        ? `rgba(${139 + i * 4},${92 + i * 3},246,${0.7 + (filled ? 0.3 : 0)})`
                        : 'rgba(255,255,255,0.06)',
                      borderRadius: '1px',
                      boxShadow: filled ? '0 0 4px rgba(139,92,246,0.6)' : 'none',
                      transition: 'background 0.3s',
                    }} />
                  );
                })}
              </div>
              <span style={{ fontSize: '10px', color: '#c4b5fd', fontFamily: 'monospace', minWidth: '30px' }}>
                {Math.max(0, stats.lightGauge)}%
              </span>
            </div>

            {/* 기억 조각 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: 'rgba(251,191,36,0.7)', letterSpacing: '0.12em', minWidth: '52px', textAlign: 'right' }}>MEMORY</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const filled = i < Math.round(stats.memoryFragments / 5);
                  return (
                    <div key={i} style={{
                      width: '7px', height: '10px',
                      background: filled ? 'rgba(251,191,36,0.75)' : 'rgba(255,255,255,0.06)',
                      borderRadius: '1px',
                      boxShadow: filled ? '0 0 4px rgba(251,191,36,0.5)' : 'none',
                      transition: 'background 0.3s',
                    }} />
                  );
                })}
              </div>
              <span style={{ fontSize: '10px', color: '#fbbf24', fontFamily: 'monospace', minWidth: '30px' }}>
                {stats.memoryFragments}%
              </span>
            </div>
          </div>

          {/* 우: 챕터 정보 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '160px', gap: '2px' }}>
            <div style={{ fontSize: '9px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.15em' }}>CHAPTER LOG</div>
            <div style={{ fontSize: '11px', color: '#d8b4fe', letterSpacing: '0.04em', textAlign: 'right', maxWidth: '180px', lineHeight: 1.3 }}>
              {chapter.title}
            </div>
          </div>

        </div>
      </header>

      {/* 캐릭터 영역 */}
      <div className="flex-1 flex items-end justify-center p-4" style={{ position: 'relative', zIndex: 1, minHeight: 0, overflow: 'hidden' }}>
        {currentLine?.speaker === 'jade' && (
          <img
            src={currentSceneId === 'scene_2_2' ? '/jade_littleprince.png' : currentSceneId === 'scene_5_2' ? '/jade_idol_excited.png' : currentSceneId === 'scene_4_2' ? '/jade_choice1.png' : currentSceneId === 'scene_5_1' ? '/jade_choice2.png' : '/jade_opening.png'}
            alt="제이드"
            className="flex-shrink-0"
            style={{
              width: '320px',
              height: '420px',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0px 8px 24px rgba(80, 60, 180, 0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))',
            }}
          />
        )}
        {currentLine?.speaker === 'crystal' && (
          <img
            src={currentSceneId === 'scene_5_2' ? '/crystal_idol_excited.png' : currentSceneId === 'scene_4_2' ? '/crystal_name1.png' : '/crystal_name.png'}
            alt="크리스탈"
            className="flex-shrink-0"
            style={{
              width: '320px',
              height: '420px',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0px 8px 24px rgba(80, 60, 180, 0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))',
            }}
          />
        )}
        {currentLine?.speaker === 'guardian' && (
          <img
            src="/guardian.png"
            alt="수호신"
            className="flex-shrink-0"
            style={{
              width: '320px',
              height: '420px',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0px 8px 24px rgba(255, 215, 0, 0.5)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))',
            }}
          />
        )}
      </div>

      {/* 공통 keyframe 정의 */}
      <style>{`
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(-2px); }
          50%       { transform: translateY(3px); }
        }
        @keyframes narrationFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sfScanline {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(500%); opacity: 0; }
        }
        @keyframes sfCornerPulse {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 4px rgba(0,200,255,0.4); }
          50%       { opacity: 1;   box-shadow: 0 0 8px rgba(0,200,255,0.9); }
        }
        @keyframes sfBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes sfGlowPulse {
          0%, 100% { text-shadow: 0 0 12px rgba(0,200,255,0.4), 0 2px 8px rgba(0,0,0,0.9); }
          50%       { text-shadow: 0 0 24px rgba(0,200,255,0.7), 0 2px 8px rgba(0,0,0,0.9); }
        }
      `}</style>

      {/* 나레이션 — SF 홀로그램 자막 스타일 */}
      {isNarration ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleAdvance}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAdvance()}
          style={{
            position: 'fixed', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          {/* 배경 그라디언트 */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 45% at 50% 50%, rgba(0,20,50,0.5) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          {/* 홀로그램 수평선 장식 */}
          <div style={{
            position: 'absolute',
            width: '560px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            pointerEvents: 'none',
          }}>
            <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.25) 30%, rgba(139,92,246,0.3) 50%, rgba(0,200,255,0.25) 70%, transparent)' }} />
            <div style={{ height: '1px', width: '80%', background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.12) 50%, transparent)' }} />
          </div>
          {/* 내레이션 텍스트 */}
          <p style={{
            position: 'relative',
            maxWidth: '600px',
            textAlign: 'center',
            fontSize: '1.1rem',
            fontStyle: 'italic',
            lineHeight: 2.1,
            color: 'rgba(200, 230, 255, 0.92)',
            letterSpacing: '0.05em',
            animation: 'narrationFadeIn 0.7s ease both, sfGlowPulse 3s ease-in-out infinite',
            padding: '0 2.5rem',
          }}>
            {displayText}
            {isTyping && <span style={{ opacity: 0.7, animation: 'sfBlink 0.8s step-end infinite' }}>|</span>}
          </p>
          {/* 하단 수평선 장식 */}
          <div style={{
            position: 'absolute',
            width: '560px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            pointerEvents: 'none',
            marginTop: '80px',
          }}>
            <div style={{ height: '1px', width: '80%', background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.12) 50%, transparent)' }} />
            <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.25) 30%, rgba(139,92,246,0.3) 50%, rgba(0,200,255,0.25) 70%, transparent)' }} />
          </div>
          {/* 하단 클릭 유도 */}
          {!isTyping && (
            <div style={{
              position: 'absolute', bottom: '2.5rem',
              display: 'flex', alignItems: 'center', gap: '8px',
              opacity: 0.5,
              animation: 'arrowBounce 1.4s ease-in-out infinite',
            }}>
              <span style={{ fontSize: '8px', color: 'rgba(0,200,255,0.8)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>NEXT</span>
              <svg width="16" height="12" viewBox="0 0 20 16" fill="none">
                <polygon points="2,2 18,2 10,14" fill="rgba(0,200,255,0.7)"/>
              </svg>
            </div>
          )}
        </div>
      ) : (
      /* 일반 대사창 — SF 터미널 스타일 */
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
        {/* SF 코너 데코레이터 — 좌상단 */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: '14px', height: '14px', borderTop: '2px solid rgba(0,200,255,0.85)', borderLeft: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'sfCornerPulse 2.5s ease-in-out infinite' }} />
        {/* SF 코너 데코레이터 — 우상단 */}
        <div style={{ position: 'absolute', top: -1, right: -1, width: '14px', height: '14px', borderTop: '2px solid rgba(0,200,255,0.85)', borderRight: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'sfCornerPulse 2.5s ease-in-out infinite 0.6s' }} />
        {/* SF 코너 데코레이터 — 좌하단 */}
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: '14px', height: '14px', borderBottom: '2px solid rgba(0,200,255,0.85)', borderLeft: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'sfCornerPulse 2.5s ease-in-out infinite 1.2s' }} />
        {/* SF 코너 데코레이터 — 우하단 */}
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: '14px', height: '14px', borderBottom: '2px solid rgba(0,200,255,0.85)', borderRight: '2px solid rgba(0,200,255,0.85)', pointerEvents: 'none', animation: 'sfCornerPulse 2.5s ease-in-out infinite 1.8s' }} />

        {/* 스캔라인 효과 */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '30%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,180,255,0.025) 50%, transparent 100%)',
            animation: 'sfScanline 5s linear infinite',
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
            {/* 발화자 인디케이터 바 */}
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
            {/* 우측 VOICE LOG 레이블 */}
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
            {atEndOfScene ? '클릭하면 엔딩으로 이동합니다.' : displayText}
            {isTyping && <span style={{ opacity: 0.6, animation: 'sfBlink 0.8s step-end infinite' }}>|</span>}
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
              <polygon points="2,2 18,2 10,14" fill="rgba(0,200,255,0.75)"/>
            </svg>
          </div>
        )}
      </div>
      )}

      </div> {/* uiVisible 래퍼 닫힘 */}
    </div>
  );
}
