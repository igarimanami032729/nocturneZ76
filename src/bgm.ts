// 라우트 전환에도 끊기지 않는 싱글톤 BGM 매니저

// ── 시간의신전 (Temple of Time) BGM ──────────────────────────────────────────
let templeAudio: HTMLAudioElement | null = null;

export function startTempleOfTimeBgm() {
  if (!templeAudio) {
    templeAudio = new Audio('/temple_of_time.mp4');
    templeAudio.loop = true;
    templeAudio.volume = 0.45;
  }
  if (templeAudio.paused) {
    templeAudio.play().catch(() => {
      const resume = () => {
        templeAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function pauseTempleOfTimeBgm() {
  if (templeAudio && !templeAudio.paused) {
    templeAudio.pause();
  }
}

export function resumeTempleOfTimeBgm() {
  startTempleOfTimeBgm();
}

export function stopTempleOfTimeBgm() {
  if (templeAudio) {
    templeAudio.pause();
    templeAudio.currentTime = 0;
  }
}

// ── 마가티아 (Magatia) BGM ────────────────────────────────────────────────────
let magatiaAudio: HTMLAudioElement | null = null;

export function startMagatiaBgm() {
  if (!magatiaAudio) {
    magatiaAudio = new Audio('/magatia.mp4');
    magatiaAudio.loop = true;
    magatiaAudio.volume = 0.45;
  }
  if (magatiaAudio.paused) {
    magatiaAudio.play().catch(() => {
      const resume = () => {
        magatiaAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function stopMagatiaBgm() {
  if (magatiaAudio) {
    magatiaAudio.pause();
    magatiaAudio.currentTime = 0;
  }
}

// ── 망각의 호수 (Lake of Oblivion) BGM ───────────────────────────────────────
let lakeAudio: HTMLAudioElement | null = null;

export function startLakeOfOblivionBgm() {
  if (!lakeAudio) {
    lakeAudio = new Audio('/lake_of_oblivion.mp4');
    lakeAudio.loop = true;
    lakeAudio.volume = 0.45;
  }
  if (lakeAudio.paused) {
    lakeAudio.play().catch(() => {
      const resume = () => {
        lakeAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function stopLakeOfOblivionBgm() {
  if (lakeAudio) {
    lakeAudio.pause();
    lakeAudio.currentTime = 0;
  }
}

// ── 리엔 (MapleStory Rien) — scene_2_1 연습실 구간 전용 ─────────────────────
let rienAudio: HTMLAudioElement | null = null;

export function startRienBgm() {
  if (!rienAudio) {
    rienAudio = new Audio('/rien_bgm.mp4');
    rienAudio.loop = true;
    rienAudio.volume = 0.45;
  }
  if (rienAudio.paused) {
    rienAudio.play().catch(() => {
      const resume = () => {
        rienAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function stopRienBgm() {
  if (rienAudio) {
    rienAudio.pause();
    rienAudio.currentTime = 0;
  }
}

// ── 에레브 수련의 숲 (Ereve Training Forest) — scene_1_1 전용 ───────────────
let ereveAudio: HTMLAudioElement | null = null;

export function startEreveTrainingForestBgm() {
  if (!ereveAudio) {
    ereveAudio = new Audio('/ereve_training_forest.mp4');
    ereveAudio.loop = true;
    ereveAudio.volume = 0.45;
  }
  if (ereveAudio.paused) {
    ereveAudio.play().catch(() => {
      const resume = () => {
        ereveAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function stopEreveTrainingForestBgm() {
  if (ereveAudio) {
    ereveAudio.pause();
    ereveAudio.currentTime = 0;
  }
}

// ── 셀라스 Where Stars Rest — scene_3_1 마지막 나레이션 한 페이지 전용 ───────
let cellasAudio: HTMLAudioElement | null = null;

export function startCellasWhereStarsRestBgm() {
  if (!cellasAudio) {
    cellasAudio = new Audio('/cellas_where_stars_rest.mp4');
    cellasAudio.loop = true;
    cellasAudio.volume = 0.45;
  }
  if (cellasAudio.paused) {
    cellasAudio.play().catch(() => {
      const resume = () => {
        cellasAudio?.play();
        document.removeEventListener('click', resume);
      };
      document.addEventListener('click', resume);
    });
  }
}

export function stopCellasWhereStarsRestBgm() {
  if (cellasAudio) {
    cellasAudio.pause();
    cellasAudio.currentTime = 0;
  }
}

// ── 엔딩 BGM ─────────────────────────────────────────────────────────────────
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
