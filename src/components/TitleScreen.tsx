import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { stopEndingBgm } from '../bgm';

export function TitleScreen() {
  const navigate = useNavigate();
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const [name, setName] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    stopEndingBgm(); // 엔딩에서 돌아왔을 때 ending BGM 종료
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const tryPlay = () => {
      audio.play().catch(() => {});
    };
    tryPlay();
    document.addEventListener('click', tryPlay, { once: true });
    document.addEventListener('keydown', tryPlay, { once: true });
    return () => {
      audio.pause();
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    };
  }, []);

  const handleStart = () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    navigate('/intro');
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
      <audio ref={audioRef} src="/title_bgm.mp4" loop preload="auto" />
      {/* 배경 동영상 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/bg_main.mp4" type="video/mp4" />
      </video>

      {/* 어두운 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1,
      }} />

      {/* 콘텐츠 */}
      <div className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
        {/* 제목 */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '3rem' }}>
          <h1 className="title-giants" style={{ fontSize: 'clamp(4rem, 11vw, 7.5rem)' }}>
            NOCTURNE Z76
          </h1>
          {/* 반짝이 파티클 */}
          <span className="sparkle sparkle-1" style={{ top: '-10px', left: '8%' }} />
          <span className="sparkle sparkle-2" style={{ top: '-14px', left: '52%' }} />
          <span className="sparkle sparkle-3" style={{ top: '2px',   right: '4%' }} />
          <span className="sparkle sparkle-1" style={{ bottom: '-8px',  left: '28%', animationDelay: '1.2s' }} />
          <span className="sparkle sparkle-2" style={{ bottom: '-12px', right: '18%', animationDelay: '0.3s' }} />
        </div>

        {/* 이름 입력 + 게임 시작 — 반투명 흰 박스 */}
        <div style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '1.25rem',
          padding: '2rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
          minWidth: '18rem',
        }}>
          <p style={{ color: 'rgba(220,210,255,0.95)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            당신의 이름을 입력하세요
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="이름"
            maxLength={20}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(180,140,255,0.45)',
              color: '#fff',
              marginBottom: '1.25rem',
              outline: 'none',
              fontSize: '1rem',
            }}
          />
          <button
            type="button"
            onClick={handleStart}
            disabled={!name.trim()}
            style={{
              padding: '0.85rem 2.5rem',
              borderRadius: '0.5rem',
              border: '2px solid rgba(255,215,0,0.9)',
              color: '#1a1100',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              fontFamily: 'Mulmaru, sans-serif',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() ? 1 : 0.4,
              transition: 'all 0.3s',
              boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            }}
            onMouseEnter={e => { if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #ffe84d 0%, #ffb700 100%)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'; }}
          >
            게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
