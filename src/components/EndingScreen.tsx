import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import {
  startEndingBgm,
  stopEndingBgm,
  stopTempleOfTimeBgm,
  stopMagatiaBgm,
  stopLakeOfOblivionBgm,
  stopRienBgm,
  stopEreveTrainingForestBgm,
  stopCellasWhereStarsRestBgm,
} from '../bgm';

type Phase = 'glitch' | 'credits';

const ENDING_CREDITS: Record<string, {
  title: string;
  english: string;
  theme: string;
  sections: { heading?: string; lines: string[] }[];
}> = {
  ending_self_confidence: {
    title: '자기 확신 엔딩',
    english: 'Ending : I Shine',
    theme: '자기 사랑, 자기 확신',
    sections: [
      { heading: 'E P I L O G U E', lines: [''] },
      {
        heading: 'E527',
        lines: [
          '진짜 이름을 되찾았다.',
          '그 날 이후, 처음으로',
          '자신의 이름으로 무대에 섰다.',
          '',
          '빛의 거울은 그 어느 때보다 밝게 빛났다.',
        ],
      },
      {
        heading: 'Z314  ─  제이드',
        lines: [
          '"어울린다."',
          '',
          '그 한마디가, 모든 것이었다.',
          '제이드는 완전한 무대를 완성했다.',
        ],
      },
      {
        heading: 'N042  ─  크리스탈',
        lines: [
          '거울이 완전히 복원됐다.',
          '행성에서 가장 오래된 기억이,',
          '마침내 돌아왔다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        heading: '행성  녹턴 Z76',
        lines: [
          '그 날 이후, 빛의 광장에는',
          '처음으로 세 개의 진짜 이름이 새겨졌다.',
          '',
          '코드명은 사라졌다.',
          '숫자와 문자로 이루어진 이름들이',
          '빛 속으로 녹아들어 사라졌다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        lines: [
          '',
          '빛을 두려워하지 않을 때',
          '거울은 깨지지 않는다.',
          '',
        ],
      },
    ],
  },
  ending_guardian: {
    title: '수호 엔딩',
    english: 'Ending : We Protect Each Other',
    theme: '우정, 서로를 지킴',
    sections: [
      { heading: 'E P I L O G U E', lines: [''] },
      {
        heading: 'E527',
        lines: [
          '혼자가 아니었다.',
          '처음부터, 그들이 함께였다.',
          '',
          '그 사실을 깨달은 순간,',
          '거울은 가장 밝게 빛났다.',
        ],
      },
      {
        heading: 'Z314  ─  제이드',
        lines: [
          '크리스탈의 이름을 가장 먼저',
          '불러준 건 제이드였다.',
          '',
          '"이름이 있어야 진짜야."',
        ],
      },
      {
        heading: 'N042  ─  크리스탈',
        lines: [
          '거울이 완전히 복원됐다.',
          '세 사람의 이름이 함께 울려 퍼지는 순간,',
          '크리스탈의 빛 게이지가 가득 찼다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        heading: '행성  녹턴 Z76',
        lines: [
          '셋이 서로의 이름을 불러줬다.',
          '그것으로 충분했다.',
          '',
          '빛의 거울들이 일제히 밝아올랐다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        lines: [
          '',
          '서로가 서로의 거울이 될 때',
          '빛은 꺼지지 않는다.',
          '',
        ],
      },
    ],
  },
  ending_mission: {
    title: '사명 엔딩',
    english: 'Ending : This Is Why We Sing',
    theme: '음악의 의미, 존재의 이유',
    sections: [
      { heading: 'E P I L O G U E', lines: [''] },
      {
        heading: 'E527',
        lines: [
          '노래가 이유가 됐다.',
          '기억을 잃은 이들에게 빛을 전하기 위해',
          '그는 다시 무대에 섰다.',
        ],
      },
      {
        heading: 'Z314  ─  제이드',
        lines: [
          '처음엔 코드명이었다.',
          '지금은 이름이 있다.',
          '그리고, 이유가 생겼다.',
        ],
      },
      {
        heading: 'N042  ─  크리스탈',
        lines: [
          '행성에서 가장 오래된 기억을 가진 자.',
          '그녀의 노래가 가장 먼저',
          '다른 이들의 귀에 닿았다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        heading: '행성  녹턴 Z76',
        lines: [
          '세 사람이 노래를 통해',
          '다른 기억 잃은 이들에게',
          '빛을 전달하기로 결심했다.',
          '',
          '행성에 새로운 존재들이',
          '눈을 떴다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        lines: [
          '',
          '노래는 기억이다.',
          '기억은 이름이다.',
          '이름은 나다.',
          '',
        ],
      },
    ],
  },
  ending_true: {
    title: '히든 엔딩',
    english: 'True Ending : Nocturne Z76',
    theme: '완전한 자아 회복, 세대를 넘은 우정',
    sections: [
      { heading: 'T R U E  E N D I N G', lines: [''] },
      {
        heading: 'E527',
        lines: [
          '모든 기억이 돌아왔다.',
          '수호자의 이름을 되찾아준 존재.',
          '',
          '그것이, 그의 진짜 사명이었다.',
        ],
      },
      {
        heading: 'Z314  ─  제이드',
        lines: [
          '처음부터 알고 있었다.',
          '',
          '"네가 열쇠야."',
          '',
          '그 말의 의미를, 이제는 안다.',
        ],
      },
      {
        heading: 'N042  ─  크리스탈',
        lines: [
          '행성의 기억이 완전히 복원됐다.',
          '크리스탈의 이름이',
          '행성 전체에 울려 퍼졌다.',
        ],
      },
      {
        heading: '수호자',
        lines: [
          '녹턴 Z76에서 가장 처음',
          '기억을 잃었던 존재.',
          '',
          '세 사람의 노래로 이름을 되찾았다.',
          '그는 오래전부터 기다리고 있었다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        heading: '행성  녹턴 Z76',
        lines: [
          '수호자가 마침내 모습을 드러냈다.',
          '',
          '행성이 가장 밝게 빛나는 날.',
          '처음으로 모든 이름이 함께 불렸다.',
        ],
      },
      { lines: ['', '────────────────────────', ''] },
      {
        lines: [
          '',
          '세대를 넘어, 기억을 넘어,',
          '이름은 살아남는다.',
          '',
        ],
      },
    ],
  },
};

export function EndingScreen() {
  const navigate = useNavigate();
  const currentEndingId = useGameStore((s) => s.currentEndingId);
  const playerName = useGameStore((s) => s.playerName);
  const resetGame = useGameStore((s) => s.resetGame);

  const [phase, setPhase] = useState<Phase>('glitch');

  const resolvedName = playerName || localStorage.getItem('nocturne_player_name') || '플레이어';
  const info = currentEndingId ? ENDING_CREDITS[currentEndingId] : null;

  useEffect(() => {
    stopTempleOfTimeBgm();
    stopMagatiaBgm();
    stopLakeOfOblivionBgm();
    stopRienBgm();
    stopEreveTrainingForestBgm();
    stopCellasWhereStarsRestBgm();
    startEndingBgm(); // NameReveal에서 이어서 재생 (이미 재생 중이면 무시)
    const t = setTimeout(() => setPhase('credits'), 3200);
    return () => clearTimeout(t);
  }, []);

  const handleBackToTitle = () => {
    stopEndingBgm();
    resetGame();
    navigate('/');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <style>{`
        @keyframes glitchFlicker {
          0%, 100% { opacity: 1; filter: none; }
          8%  { opacity: 0.85; filter: brightness(1.6) contrast(1.4); }
          10% { opacity: 1; transform: translateX(-6px) skewX(-1deg); filter: none; }
          11% { transform: none; }
          22% { opacity: 0.5; filter: hue-rotate(180deg) saturate(4); }
          23% { opacity: 1; filter: none; }
          35% { transform: translateX(4px); }
          36% { transform: none; }
          50% { opacity: 0.7; filter: brightness(2); }
          51% { opacity: 1; filter: none; }
          65% { transform: translateX(-3px) skewX(0.5deg); }
          66% { transform: none; }
          78% { opacity: 0.4; filter: hue-rotate(90deg); }
          79% { opacity: 1; filter: none; }
          90% { transform: translateX(5px); opacity: 0.8; }
          91% { transform: none; opacity: 1; }
        }
        @keyframes scanlineMove {
          from { transform: translateY(0); }
          to   { transform: translateY(60px); }
        }
        @keyframes glitchBar1 {
          0%,100% { top: -10%; opacity: 0; height: 4%; }
          15%     { top: 20%;  opacity: 0.18; height: 6%; }
          30%     { top: 55%;  opacity: 0.12; height: 3%; }
          50%     { top: 80%;  opacity: 0.2;  height: 8%; }
          70%     { top: 35%;  opacity: 0.1;  height: 5%; }
        }
        @keyframes glitchBar2 {
          0%,100% { top: 110%; opacity: 0; height: 3%; }
          20%     { top: 10%;  opacity: 0.15; height: 5%; }
          45%     { top: 70%;  opacity: 0.22; height: 4%; }
          65%     { top: 40%;  opacity: 0.1;  height: 7%; }
          85%     { top: 60%;  opacity: 0.18; height: 3%; }
        }
        @keyframes rgbShift {
          0%, 100% { text-shadow: 3px 0 #f00, -3px 0 #0ff, 0 0 24px rgba(255,215,0,0.8); }
          25%      { text-shadow: -4px 0 #f00, 4px 0 #0ff, 0 0 16px rgba(255,215,0,0.6); }
          50%      { text-shadow: 2px 0 #0ff, -2px 0 #f00, 0 0 32px rgba(255,215,0,1); }
          75%      { text-shadow: -3px 1px #f00, 3px -1px #0ff, 0 0 20px rgba(255,215,0,0.7); }
        }
        @keyframes glitchFadeOut {
          0%   { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes creditsScroll {
          from { transform: translateY(100vh); }
          to   { transform: translateY(-3200px); }
        }
        @keyframes creditsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes starTwinkle {
          0%,100% { opacity: 0.3; }
          50%     { opacity: 1; }
        }
      `}</style>

      {/* ── GLITCH OVERLAY ─────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20,
        pointerEvents: phase === 'credits' ? 'none' : 'auto',
        animation: 'glitchFadeOut 3.2s ease forwards',
      }}>
        {/* 배경 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #060614 0%, #000 100%)',
          animation: 'glitchFlicker 0.35s ease-in-out infinite',
        }} />

        {/* 스캔라인 */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)',
          animation: 'scanlineMove 0.4s linear infinite',
        }} />

        {/* 글리치 바 1 */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          background: 'linear-gradient(90deg, rgba(139,92,246,0.25), rgba(100,0,255,0.15), rgba(139,92,246,0.25))',
          animation: 'glitchBar1 0.7s ease-in-out infinite',
        }} />
        {/* 글리치 바 2 */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          background: 'linear-gradient(90deg, rgba(0,200,255,0.15), rgba(0,100,200,0.1), rgba(0,200,255,0.15))',
          animation: 'glitchBar2 1.1s ease-in-out infinite',
        }} />

        {/* 중앙 타이틀 (글리치 중) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.7rem', letterSpacing: '0.5em',
            color: 'rgba(167,139,250,0.6)', marginBottom: '1rem',
          }}>
            ◈  E N D I N G  ◈
          </p>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
            fontWeight: 'bold',
            color: '#FFD700',
            letterSpacing: '0.12em',
            animation: 'rgbShift 0.2s step-end infinite',
          }}>
            {info?.english ?? 'NOCTURNE Z76'}
          </h1>
          {info && (
            <p style={{
              marginTop: '0.75rem',
              fontSize: '1rem', color: 'rgba(220,200,255,0.7)',
              letterSpacing: '0.08em',
            }}>
              {info.title}
            </p>
          )}
        </div>

        {/* 노이즈 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }} />
      </div>

      {/* ── CREDITS ────────────────────────────────────────────── */}
      {phase === 'credits' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#000',
          animation: 'creditsFadeIn 1.2s ease forwards',
          overflow: 'hidden',
        }}>
          {/* 배경 별빛 */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 7 + 13) % 100}%`,
              top: `${(i * 11 + 7) % 100}%`,
              width: i % 5 === 0 ? '2px' : '1px',
              height: i % 5 === 0 ? '2px' : '1px',
              borderRadius: '50%',
              background: 'white',
              opacity: 0.2,
              animation: `starTwinkle ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 4}s`,
            }} />
          ))}

          {/* 하단 페이드 마스크 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '15vh',
            background: 'linear-gradient(transparent, #000)',
            pointerEvents: 'none', zIndex: 5,
          }} />
          {/* 상단 페이드 마스크 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '12vh',
            background: 'linear-gradient(#000, transparent)',
            pointerEvents: 'none', zIndex: 5,
          }} />

          {/* 스크롤 컨테이너 */}
          <div
            style={{
              position: 'absolute',
              left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '560px',
              textAlign: 'center',
              animation: 'creditsScroll 75s linear forwards',
              willChange: 'transform',
            }}
          >
            {/* 플레이어 이름 */}
            <div style={{ paddingTop: '4rem', marginBottom: '2.5rem' }}>
              <p style={{
                fontSize: '0.7rem', color: 'rgba(167,139,250,0.5)',
                letterSpacing: '0.4em', marginBottom: '1rem',
              }}>
                ◈  E N D I N G  ◈
              </p>
              <p style={{
                fontSize: '1.05rem', color: 'rgba(220,205,255,0.9)',
                letterSpacing: '0.08em',
              }}>
                {resolvedName}, 당신의 여정이 끝났습니다.
              </p>
            </div>

            {/* 엔딩 제목 */}
            {info && (
              <div style={{ marginBottom: '5rem' }}>
                <h1 style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                  fontWeight: 'bold', color: '#FFD700',
                  letterSpacing: '0.06em',
                  textShadow: '0 0 24px rgba(255,215,0,0.5)',
                  marginBottom: '0.6rem',
                }}>
                  {info.title}
                </h1>
                <p style={{
                  fontSize: '0.8rem', color: 'rgba(167,139,250,0.75)',
                  letterSpacing: '0.18em',
                }}>
                  {info.english}
                </p>
                <p style={{
                  marginTop: '0.8rem',
                  fontSize: '0.78rem', color: 'rgba(200,190,255,0.5)',
                  letterSpacing: '0.1em',
                }}>
                  {info.theme}
                </p>
              </div>
            )}

            {/* 섹션들 */}
            {(info?.sections ?? []).map((section, i) => (
              <div key={i} style={{ marginBottom: '3.2rem', padding: '0 2rem' }}>
                {section.heading && (
                  <p style={{
                    fontSize: '0.65rem', color: 'rgba(167,139,250,0.55)',
                    letterSpacing: '0.35em', marginBottom: '1.2rem',
                    fontWeight: 600,
                  }}>
                    {section.heading}
                  </p>
                )}
                {section.lines.map((line, j) => {
                  const isDivider = line.startsWith('───');
                  const isQuote = line.startsWith('"');
                  const isEmpty = line === '';
                  return (
                    <p key={j} style={{
                      fontSize: isQuote ? '1.05rem' : '0.92rem',
                      color: isDivider
                        ? 'rgba(139,92,246,0.3)'
                        : isQuote
                        ? 'rgba(255,240,200,0.9)'
                        : 'rgba(210,200,255,0.8)',
                      lineHeight: isEmpty ? 0.8 : 2,
                      letterSpacing: isDivider ? '0' : '0.05em',
                      fontStyle: isQuote ? 'italic' : 'normal',
                      minHeight: isEmpty ? '1.2rem' : undefined,
                    }}>
                      {line || '\u00A0'}
                    </p>
                  );
                })}
              </div>
            ))}

            {/* 맺음말 */}
            <div style={{ margin: '5rem 2rem 3rem' }}>
              <p style={{
                fontSize: '0.85rem', color: 'rgba(200,190,255,0.65)',
                lineHeight: 2, letterSpacing: '0.05em',
              }}>
                모든 선택에는 정답이 없다.<br />
                어떤 길을 걸어도, 결국 같은 곳에 도달한다.
              </p>
              <p style={{
                marginTop: '1.5rem',
                fontSize: '1.15rem', color: 'rgba(255,230,180,0.85)',
                fontStyle: 'italic', letterSpacing: '0.08em',
              }}>
                "나는 나다."
              </p>
            </div>

            {/* 타이틀 로고 */}
            <div style={{ marginTop: '5rem', paddingBottom: '6rem' }}>
              <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(255,215,0,0.4), rgba(139,92,246,0.4), transparent)',
                marginBottom: '3rem',
              }} />
              <p style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                fontWeight: 'bold', color: '#FFD700',
                letterSpacing: '0.3em',
                textShadow: '0 0 20px rgba(255,215,0,0.4)',
              }}>
                NOCTURNE Z76
              </p>
              <p style={{
                marginTop: '2.5rem',
                fontSize: '0.65rem', color: 'rgba(167,139,250,0.35)',
                letterSpacing: '0.4em',
              }}>
                E N D
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 타이틀 버튼 (항상 표시) ───────────────────────────── */}
      <button
        type="button"
        onClick={handleBackToTitle}
        style={{
          position: 'fixed', bottom: '1.8rem', right: '1.8rem',
          padding: '0.55rem 1.4rem',
          border: '1px solid rgba(255,215,0,0.35)',
          color: 'rgba(255,215,0,0.65)',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '4px',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.25s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,215,0,0.7)';
          (e.currentTarget as HTMLButtonElement).style.color = '#FFD700';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,215,0,0.35)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,215,0,0.65)';
        }}
      >
        타이틀로 돌아가기
      </button>
    </div>
  );
}
