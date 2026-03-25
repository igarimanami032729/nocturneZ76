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
      <div className="flex-1 flex items-end justify-center p-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="character-placeholder w-64 h-80 rounded-lg border border-purple-500/30 bg-black/20 flex-shrink-0" />
      </div>

      {/* 오른쪽: 선택지 영역 */}
      <div
        className="flex flex-col justify-center p-8 gap-4"
        style={{
          width: '45%',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <p className="text-lg text-white mb-4 text-right leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
          {choice.prompt}
        </p>
        <div className="flex flex-col gap-3 w-full">
          {choice.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => applyChoice(opt.id)}
              className="px-6 py-4 rounded-lg border text-right text-white transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.25)',
                textShadow: '0 1px 4px rgba(0,0,0,0.7)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,215,0,0.15)';
                (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,215,0,0.7)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
                (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.25)';
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
