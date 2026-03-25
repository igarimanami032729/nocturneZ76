import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getCurrentChapterAndScene, goToScene } from '../game/engine';
import { startEndingBgm } from '../bgm';

const STEP_DURATION_MS = 4000;
const TRANSFORM_DELAY_MS = 1100;

const CHARACTER_IMAGES: Record<string, { before: string; after: string }> = {
  N042: { before: '/crystal_choice2.png', after: '/crystal_idol.png' },
  Z314: { before: '/jade_opening.png',    after: '/jade_idol.png'    },
};

export function NameRevealScreen() {
  const script             = useGameStore((s) => s.script);
  const currentChapterIndex = useGameStore((s) => s.currentChapterIndex);
  const currentSceneId     = useGameStore((s) => s.currentSceneId);
  const playerName         = useGameStore((s) => s.playerName);

  const data     = getCurrentChapterAndScene(script!, currentChapterIndex, currentSceneId);
  const scene    = data?.scene;
  const sequence = scene?.name_reveal_sequence ?? [];

  const [step,        setStep]        = useState(0);
  const [lightsOn,    setLightsOn]    = useState<number[]>([]);
  const [transformed, setTransformed] = useState<number[]>([]);

  useEffect(() => {
    startEndingBgm();
  }, []);

  useEffect(() => {
    if (sequence.length === 0) return;
    if (step >= sequence.length) {
      const t = setTimeout(() => goToScene(scene?.next_scene ?? 'scene_5_2'), 1200);
      return () => clearTimeout(t);
    }

    const order = sequence[step].order;
    setLightsOn((prev) => [...prev, order]);

    const t1 = setTimeout(() => setTransformed((prev) => [...prev, order]), TRANSFORM_DELAY_MS);
    const t2 = setTimeout(() => setStep((s) => s + 1), STEP_DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step, sequence.length, scene?.next_scene]);

  if (!script || !scene || sequence.length === 0) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, #120830 0%, #05020F 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spotlightPulse {
          0%,100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }
        @keyframes nameGlow {
          0%,100% { text-shadow: 0 0 12px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.3); }
          50%      { text-shadow: 0 0 20px rgba(255,215,0,0.9), 0 0 50px rgba(255,215,0,0.5); }
        }
        @keyframes codeDissolve {
          0%   { opacity:1; letter-spacing:0.2em; filter:blur(0px); }
          100% { opacity:0; letter-spacing:0.8em; filter:blur(6px); }
        }
        @keyframes mirrorShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes playerNameReveal {
          from { opacity:0; transform:scale(0.85) translateY(8px); filter:blur(4px); }
          to   { opacity:1; transform:scale(1)    translateY(0);   filter:blur(0px); }
        }
        @keyframes idolReveal {
          from { opacity:0; filter:blur(4px) brightness(1.6); }
          to   { opacity:1; filter:blur(0px) brightness(1);   }
        }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes starTwinkle {
          0%,100% { opacity:0.2; transform:scale(0.8); }
          50%      { opacity:0.9; transform:scale(1.2); }
        }
      `}</style>

      {/* 별빛 파티클 */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position:'absolute',
            width: i % 3 === 0 ? '3px' : '2px',
            height: i % 3 === 0 ? '3px' : '2px',
            borderRadius:'50%',
            background:'#fff',
            left: `${(i * 17 + 5) % 100}%`,
            top:  `${(i * 13 + 8) % 100}%`,
            animation: `starTwinkle ${1.5 + (i % 4) * 0.4}s ease-in-out ${(i * 0.3) % 2}s infinite`,
          }} />
        ))}
      </div>

      {/* 상단 타이틀 */}
      <div style={{
        marginBottom: '2.5rem', textAlign: 'center', zIndex: 1,
        opacity: lightsOn.length > 0 ? 1 : 0, transition: 'opacity 1s ease',
      }}>
        <div style={{ fontSize:'9px', letterSpacing:'0.4em', color:'rgba(167,139,250,0.5)', marginBottom:'6px' }}>
          ◈ NAME RESTORATION ◈
        </div>
        <div style={{ fontSize:'1.1rem', color:'rgba(220,210,255,0.7)', letterSpacing:'0.08em', fontStyle:'italic' }}>
          별들이 이름을 되찾는 밤
        </div>
      </div>

      {/* 3 슬롯 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1.2rem',
        zIndex: 1,
        flexWrap: 'nowrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px',
      }}>
        {sequence.map((item) => {
          const isOn          = lightsOn.includes(item.order);
          const isTransformed = transformed.includes(item.order);
          const isPlayer      = item.codename === 'E527';
          const displayName   = item.true_name === '[플레이어가 입력한 이름]' ? playerName : item.true_name;
          const imgs          = CHARACTER_IMAGES[item.codename];

          return (
            <div key={item.order} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: '1 1 0',
              minWidth: 0,
              transition: 'opacity 0.8s ease',
              opacity: isOn ? 1 : 0.08,
            }}>
              {isPlayer ? (
                /* ── 플레이어 슬롯: 거울 ── */
                <PlayerMirrorSlot
                  isOn={isOn}
                  isTransformed={isTransformed}
                  playerName={displayName}
                />
              ) : (
                /* ── 캐릭터 슬롯 ── */
                <CharacterSlot
                  isOn={isOn}
                  isTransformed={isTransformed}
                  beforeImg={imgs.before}
                  afterImg={imgs.after}
                  codename={item.codename}
                  trueName={displayName}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 캐릭터 슬롯 ─────────────────────────────────────────────────────────────
function CharacterSlot({
  isOn, isTransformed, beforeImg, afterImg, codename, trueName,
}: {
  isOn: boolean; isTransformed: boolean;
  beforeImg: string; afterImg: string;
  codename: string; trueName: string;
}) {
  return (
    <>
      {/* 이미지 영역 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '260px',
        overflow: 'visible',
      }}>
        {/* 변신 전 이미지 */}
        <img
          src={beforeImg}
          alt={codename}
          style={{
            position: 'absolute', bottom: 0, left: 0,
            width: '100%', height: '240px',
            objectFit: 'contain', objectPosition: 'bottom center',
            opacity: isOn && !isTransformed ? 1 : 0,
            transition: 'opacity 0.7s ease',
            filter: 'drop-shadow(0 4px 16px rgba(100,80,200,0.5))',
          }}
        />

        {/* 변신 후 이미지 (아이돌) */}
        <img
          src={afterImg}
          alt={`${codename} idol`}
          style={{
            position: 'absolute', bottom: 0, left: 0,
            width: '100%', height: '260px',
            objectFit: 'contain', objectPosition: 'bottom center',
            opacity: isTransformed ? 1 : 0,
            animation: isTransformed ? 'idolReveal 0.9s cubic-bezier(0.22,1,0.36,1) both' : 'none',
            filter: 'drop-shadow(0 6px 20px rgba(255,215,0,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
          }}
        />

        {/* 스포트라이트 — 좁은 원뿔형 무대 조명 */}
        {isTransformed && (
          <div style={{
            position: 'absolute', inset: 0,
            background: [
              'radial-gradient(ellipse 30% 110% at 50% 0%, rgba(255,248,210,0.55) 0%, rgba(255,230,140,0.22) 40%, transparent 70%)',
            ].join(', '),
            pointerEvents: 'none',
            animation: 'spotlightPulse 3s ease-in-out infinite',
          }} />
        )}

        {/* 변신 플래시 이펙트 */}
        {isTransformed && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle 40% at 50% 60%, rgba(255,255,255,0.28) 0%, transparent 65%)',
            animation: 'idolReveal 0.8s ease both',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* 코드명 → 실명 */}
      <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
        {/* 코드명 (변신 후 숨김) */}
        <div style={{
          fontSize: '11px', color: 'rgba(167,139,250,0.6)',
          letterSpacing: '0.25em', fontFamily: 'monospace',
          opacity: isTransformed ? 0 : (isOn ? 0.8 : 0),
          transition: 'opacity 0.6s ease',
          marginBottom: '4px',
          height: '16px',
        }}>
          {codename}
        </div>

        {/* 구분선 */}
        {isTransformed && (
          <div style={{
            width: '60px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            margin: '0 auto 8px',
            animation: 'fadeInUp 0.5s ease both',
          }} />
        )}

        {/* 진짜 이름 */}
        <div style={{
          fontSize: '2rem', fontWeight: 'bold',
          color: '#FFD700',
          opacity: isTransformed ? 1 : 0,
          animation: isTransformed ? 'fadeInUp 0.7s ease 0.2s both' : 'none',
          animationName: isTransformed ? 'nameGlow, fadeInUp' : 'none',
          animationDuration: '2.5s, 0.7s',
          animationTimingFunction: 'ease-in-out, ease',
          animationDelay: '0s, 0.2s',
          animationIterationCount: 'infinite, 1',
          animationFillMode: 'none, both',
          letterSpacing: '0.06em',
        }}>
          {trueName}
        </div>
      </div>
    </>
  );
}

// ─── 플레이어 거울 슬롯 ──────────────────────────────────────────────────────
function PlayerMirrorSlot({
  isOn, isTransformed, playerName,
}: {
  isOn: boolean; isTransformed: boolean; playerName: string;
}) {
  return (
    <>
      {/* 거울 프레임 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '260px',
        borderRadius: '50% 50% 46% 46% / 60% 60% 40% 40%',
        border: `2px solid ${isTransformed ? 'rgba(255,215,0,0.7)' : 'rgba(139,92,246,0.4)'}`,
        background: isTransformed
          ? 'linear-gradient(180deg, rgba(30,15,5,0.9) 0%, rgba(10,5,0,0.97) 100%)'
          : 'linear-gradient(180deg, rgba(10,5,30,0.9) 0%, rgba(5,2,15,0.97) 100%)',
        boxShadow: isTransformed
          ? '0 0 30px rgba(255,215,0,0.25), inset 0 0 30px rgba(255,200,50,0.08)'
          : '0 0 20px rgba(139,92,246,0.2), inset 0 0 20px rgba(100,60,200,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'border-color 0.8s ease, box-shadow 0.8s ease, background 0.8s ease',
      }}>
        {/* 거울 반사 광택 */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
          borderRadius: '0 0 50% 50%',
          pointerEvents: 'none',
        }} />

        {/* 스포트라이트 */}
        {isTransformed && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 90% at 50% -5%, rgba(255,245,180,0.25) 0%, transparent 70%)',
            animation: 'spotlightPulse 2.5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}

        {/* E527 코드 (변신 전) */}
        <div style={{
          position: 'absolute',
          fontSize: '1.3rem',
          fontFamily: 'monospace',
          letterSpacing: '0.3em',
          color: 'rgba(167,139,250,0.8)',
          textShadow: '0 0 10px rgba(139,92,246,0.6)',
          opacity: isTransformed ? 0 : (isOn ? 1 : 0),
          animation: isTransformed ? 'codeDissolve 0.7s ease forwards' : 'none',
          transition: isTransformed ? 'none' : 'opacity 0.5s ease',
        }}>
          E527
        </div>

        {/* 플레이어 이름 (변신 후) */}
        {isTransformed && (
          <div style={{
            position: 'absolute',
            textAlign: 'center',
            padding: '0 1rem',
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,215,0,0.6)',
              letterSpacing: '0.2em',
              marginBottom: '8px',
              animation: 'fadeInUp 0.5s ease 0.3s both',
            }}>
              당신은
            </div>
            <div style={{
              fontSize: playerName.length > 6 ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              color: '#FFD700',
              letterSpacing: '0.08em',
              animationName: 'playerNameReveal, nameGlow',
              animationDuration: '0.9s, 2.5s',
              animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1), ease-in-out',
              animationDelay: '0.15s, 1s',
              animationIterationCount: '1, infinite',
              animationFillMode: 'both, none',
              textAlign: 'center',
              wordBreak: 'keep-all',
            }}>
              {playerName}
            </div>
          </div>
        )}

        {/* 거울 하단 반사 */}
        <div style={{
          position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '25%',
          background: 'linear-gradient(0deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          borderRadius: '50% 50% 0 0',
          pointerEvents: 'none',
        }} />
      </div>

      {/* 코드명 표기 */}
      <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
        <div style={{
          fontSize: '11px', color: 'rgba(167,139,250,0.5)',
          letterSpacing: '0.25em', fontFamily: 'monospace',
          opacity: isTransformed ? 0 : (isOn ? 0.7 : 0),
          transition: 'opacity 0.6s ease',
          height: '16px',
        }}>
          E527
        </div>

        {isTransformed && (
          <div style={{
            width: '60px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            margin: '4px auto 8px',
            animation: 'fadeInUp 0.5s ease both',
          }} />
        )}

        <div style={{
          fontSize: '2rem', fontWeight: 'bold',
          color: '#FFD700',
          opacity: isTransformed ? 1 : 0,
          animationName: isTransformed ? 'nameGlow, fadeInUp' : 'none',
          animationDuration: '2.5s, 0.7s',
          animationTimingFunction: 'ease-in-out, ease',
          animationDelay: '0s, 0.2s',
          animationIterationCount: 'infinite, 1',
          animationFillMode: 'none, both',
          letterSpacing: '0.06em',
        }}>
          {playerName}
        </div>
      </div>
    </>
  );
}
