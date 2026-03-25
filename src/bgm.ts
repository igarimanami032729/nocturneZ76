// 라우트 전환에도 끊기지 않는 싱글톤 BGM 매니저

let endingAudio: HTMLAudioElement | null = null;

export function startEndingBgm() {
  if (!endingAudio) {
    endingAudio = new Audio('/ending_bgm.mp4');
    endingAudio.loop = true;
    endingAudio.volume = 0.5;
  }
  if (endingAudio.paused) {
    endingAudio.play().catch(() => {
      const resume = () => {
        endingAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function stopEndingBgm() {
  if (endingAudio) {
    endingAudio.pause();
    endingAudio.currentTime = 0;
  }
}
