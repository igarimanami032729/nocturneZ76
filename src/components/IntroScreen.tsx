import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VIDEO_DURATION_MS = 27000; // 영상 길이 27초 (fallback용)

export function IntroScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToGame = () => {
    if (fadeOut) return;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    setFadeOut(true);
    setTimeout(() => navigate('/game'), 800);
  };

  // 영상이 정상 재생됐을 때: timeupdate로 fallback 타이머 시작
  const handleCanPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // autoplay 차단 시 fallback 타이머로 넘어감
      fallbackTimerRef.current = setTimeout(goToGame, VIDEO_DURATION_MS);
    });
  };

  // 영상 끝났을 때 → 게임으로
  const handleEnded = () => {
    goToGame();
  };

  // 영상 로드 자체 실패 시 → fallback 타이머
  const handleError = () => {
    if (!fallbackTimerRef.current) {
      fallbackTimerRef.current = setTimeout(goToGame, VIDEO_DURATION_MS);
    }
  };

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  const handleSkip = () => {
    if (videoRef.current) videoRef.current.pause();
    goToGame();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.8s ease',
        zIndex: 100,
      }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* 스킵 버튼 */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          background: 'transparent',
          border: '1px solid rgba(255,215,0,0.35)',
          color: 'rgba(255,215,0,0.6)',
          padding: '0.4rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          letterSpacing: '0.1em',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,215,0,0.8)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,215,0,0.9)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,215,0,0.35)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,215,0,0.6)';
        }}
      >
        SKIP
      </button>
    </div>
  );
}
