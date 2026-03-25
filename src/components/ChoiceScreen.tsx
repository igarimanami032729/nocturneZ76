import { useGameStore } from '../store/gameStore';
import { getCurrentChapterAndScene } from '../game/engine';
import { applyChoice } from '../game/engine';
import { SCENE_BACKGROUNDS } from '../game/sceneBackgrounds';

export function ChoiceScreen() {
  const script = useGameStore((s) => s.script);
  const currentChapterIndex = useGameStore((s) => s.currentChapterIndex);
  const currentSceneId = useGameStore((s) => s.currentSceneId);

  const data = getCurrentChapterAndScene(script!, currentChapterIndex, currentSceneId);
  const scene = data?.scene;
  const choice = scene?.choice;

  if (!script || !choice) return null;

  const sceneBg = SCENE_BACKGROUNDS[currentSceneId];

  return (
    <div
      className="min-h-screen flex"
      style={
        sceneBg
          ? {
              backgroundImage: `url(${sceneBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : {
              background: '#0A0A1E',
              backgroundImage: 'radial-gradient(ellipse at 50% 30%, #1A1A6E 0%, #0A0A1E 60%)',
            }
      }
    >
      {/* 배경 어두운 오버레이 */}
      {sceneBg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* 왼쪽: 캐릭터 영역 */}
      {currentSceneId === 'scene_1_1' && (
        <div className="flex-1 flex items-center justify-center p-8" style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/jade_back.png"
            alt="제이드 뒷모습"
            style={{
              width: '320px',
              height: '420px',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0px 8px 24px rgba(80, 60, 180, 0.7)) drop-shadow(0px 2px 8px rgba(0,0,0,0.9))',
            }}
          />
        </div>
      )}
      {currentSceneId === 'scene_2_1' && choice.id === 'choice_2_A' && (
        <div className="flex-1 flex items-center justify-center p-8" style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/crystal_back.png"
            alt="크리스탈 뒷모습"
            style={{
              maxHeight: 'min(78vh, 520px)',
              width: 'auto',
              maxWidth: 'min(380px, 42vw)',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0px 8px 24px rgba(120, 80, 200, 0.55)) drop-shadow(0px 2px 8px rgba(0,0,0,0.85))',
            }}
          />
        </div>
      )}
      {currentSceneId === 'scene_2_2' && choice.id === 'choice_2_B' && (
        <div className="flex-1 flex items-center justify-center p-8" style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/jade_shy.png"
            alt="제이드"
            style={{
              maxHeight: 'min(78vh, 520px)',
              width: 'auto',
              maxWidth: 'min(380px, 42vw)',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0px 8px 24px rgba(80, 60, 180, 0.6)) drop-shadow(0px 2px 8px rgba(0,0,0,0.85))',
            }}
          />
        </div>
      )}
      {currentSceneId === 'scene_3_1' && choice.id === 'choice_3_A' && (
        <div className="flex-1 flex items-center justify-center p-8" style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/crystal_shy.png"
            alt="크리스탈"
            style={{
              maxHeight: 'min(78vh, 520px)',
              width: 'auto',
              maxWidth: 'min(380px, 42vw)',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0px 8px 24px rgba(120, 80, 200, 0.6)) drop-shadow(0px 2px 8px rgba(0,0,0,0.85))',
            }}
          />
        </div>
      )}
      {currentSceneId === 'scene_5_1' && choice.id === 'choice_5_A' && (
        <div className="flex-1 flex items-center justify-center p-8" style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/jade_crystal_up.png"
            alt="제이드와 크리스탈"
            style={{
              maxHeight: 'min(82vh, 620px)',
              width: 'auto',
              maxWidth: 'min(430px, 46vw)',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0px 10px 28px rgba(90, 70, 170, 0.55)) drop-shadow(0px 2px 8px rgba(0,0,0,0.85))',
            }}
          />
        </div>
      )}

      {/* 오른쪽: 선택지 영역 — SF 커맨드 패널 */}
      <style>{`
        @keyframes sfChoiceScan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(600%); opacity: 0; }
        }
        @keyframes sfChoiceCorner {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes sfChoiceFadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sfOptionGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(0,180,255,0.15), inset 0 0 12px rgba(0,60,140,0.06); }
          50%       { box-shadow: 0 0 10px rgba(0,180,255,0.22), inset 0 0 18px rgba(0,80,160,0.10); }
        }
      `}</style>
      <div
        style={{
          width: '46%',
          marginLeft: 'auto',
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(160deg, rgba(2,6,22,0.95) 0%, rgba(4,10,30,0.92) 100%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderLeft: '1px solid rgba(0,180,255,0.25)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '2.5rem 2rem',
          gap: '0',
          overflow: 'hidden',
          animation: 'sfChoiceFadeIn 0.5s ease both',
        }}
      >
        {/* 스캔라인 */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '35%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,160,255,0.03) 50%, transparent 100%)',
            animation: 'sfChoiceScan 6s linear infinite',
          }} />
        </div>

        {/* 패널 코너 — 좌상단 */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: '2px solid rgba(0,200,255,0.7)', borderLeft: '2px solid rgba(0,200,255,0.7)', animation: 'sfChoiceCorner 2.5s ease-in-out infinite', zIndex: 2 }} />
        {/* 패널 코너 — 우상단 */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderTop: '2px solid rgba(0,200,255,0.7)', borderRight: '2px solid rgba(0,200,255,0.7)', animation: 'sfChoiceCorner 2.5s ease-in-out infinite 0.8s', zIndex: 2 }} />
        {/* 패널 코너 — 좌하단 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderBottom: '2px solid rgba(0,200,255,0.7)', borderLeft: '2px solid rgba(0,200,255,0.7)', animation: 'sfChoiceCorner 2.5s ease-in-out infinite 1.6s', zIndex: 2 }} />
        {/* 패널 코너 — 우하단 */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: '2px solid rgba(0,200,255,0.7)', borderRight: '2px solid rgba(0,200,255,0.7)', animation: 'sfChoiceCorner 2.5s ease-in-out infinite 2.4s', zIndex: 2 }} />

        {/* SELECT COMMAND 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '1.25rem',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ width: '3px', height: '12px', background: 'rgba(0,210,255,0.85)', boxShadow: '0 0 6px rgba(0,210,255,0.7)', flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.28em', color: 'rgba(0,210,255,0.7)' }}>
            SELECT COMMAND
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(0,200,255,0.25), transparent)' }} />
        </div>

        {/* 프롬프트 */}
        <p style={{
          fontSize: '0.97rem', color: 'rgba(200,228,255,0.92)',
          lineHeight: 1.75, letterSpacing: '0.03em',
          textAlign: 'right',
          marginBottom: '1.5rem',
          position: 'relative', zIndex: 1,
          textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          paddingLeft: '1rem',
        }}>
          {choice.prompt}
        </p>

        {/* 구분선 */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.2), rgba(139,92,246,0.2), transparent)', marginBottom: '1.25rem', position: 'relative', zIndex: 1 }} />

        {/* 선택지 버튼들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1 }}>
          {choice.options.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => applyChoice(opt.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 16px',
                background: 'rgba(0,60,140,0.12)',
                border: '1px solid rgba(0,160,255,0.25)',
                boxShadow: '0 0 6px rgba(0,180,255,0.10), inset 0 0 12px rgba(0,60,140,0.06)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(0,100,200,0.22)';
                el.style.border = '1px solid rgba(0,220,255,0.65)';
                el.style.boxShadow = '0 0 16px rgba(0,200,255,0.25), inset 0 0 20px rgba(0,80,180,0.14)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(0,60,140,0.12)';
                el.style.border = '1px solid rgba(0,160,255,0.25)';
                el.style.boxShadow = '0 0 6px rgba(0,180,255,0.10), inset 0 0 12px rgba(0,60,140,0.06)';
              }}
            >
              {/* 인덱스 번호 뱃지 */}
              <div style={{
                flexShrink: 0,
                width: '26px', height: '26px',
                border: '1px solid rgba(0,200,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,80,160,0.2)',
              }}>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(0,210,255,0.85)', letterSpacing: '0.1em' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              {/* 선택지 텍스트 */}
              <span style={{
                fontSize: '0.9rem', color: 'rgba(200,228,255,0.9)',
                lineHeight: 1.6, letterSpacing: '0.02em',
                flex: 1, textAlign: 'right',
              }}>
                {opt.text}
              </span>
              {/* 우측 화살표 인디케이터 */}
              <div style={{ flexShrink: 0, color: 'rgba(0,200,255,0.45)', fontSize: '10px' }}>▶</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
