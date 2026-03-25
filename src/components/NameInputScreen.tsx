import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export function NameInputScreen() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const setPlayerName = useGameStore((s) => s.setPlayerName);

  const handleConfirm = () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    navigate('/intro');
  };

  return (
    <div className="min-h-screen bg-deep-space flex flex-col items-center justify-center p-8 bg-[#0A0A1E]" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, #1A1A6E 0%, #0A0A1E 60%)' }}>
      <h2 className="text-xl text-purple-200/90 mb-6">당신의 이름을 입력하세요</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        placeholder="이름"
        className="w-64 px-4 py-3 rounded-lg bg-black/30 border border-purple-500/40 text-white placeholder-purple-300/50 focus:border-[#FFD700]/60 focus:outline-none"
        maxLength={20}
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!name.trim()}
        className="mt-6 px-8 py-3 rounded-lg border-2 border-[#FFD700]/60 text-[#FFD700] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFD700]/10 transition-all"
      >
        확인
      </button>
    </div>
  );
}
