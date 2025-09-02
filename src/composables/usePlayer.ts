export interface PlayerEventMap {
  timeupdate: {
    time: number;
    totalTime: number;
    isPlaying: boolean;
  };
  play: {
    time: number;
    totalTime: number;
  };
  pause: {
    time: number;
    totalTime: number;
  };
  reset: void;
  end: void;
}

export type PlayerEventType = keyof PlayerEventMap;

export type PlayerEventCallback<T extends PlayerEventType> = PlayerEventMap[T] extends void ? () => void : (data: PlayerEventMap[T]) => void;

export class Player {
  #isPlaying = false;
  // millisecond
  #time = 0;
  #totalTime = 0;
  #timer: number | null = null;
  #lastTickTime = 0;
  #eventListeners: Map<PlayerEventType, Set<(...args: any[]) => void>> = new Map();

  get time() {
    return this.#time;
  }

  set time(time: number) {
    const newTime = Math.max(0, Math.min(time, this.#totalTime));
    this.#time = newTime;

    // 如果正在播放且时间达到总时间，则暂停并触发 end 事件
    if (this.#isPlaying && this.#time === this.#totalTime && this.#totalTime > 0) {
      this.pause();
      this.#emit("end");
    }
    else if (this.#isPlaying) {
      this.#lastTickTime = Date.now();
    }

    this.#emit("timeupdate", {
      time: this.#time,
      totalTime: this.#totalTime,
      isPlaying: this.#isPlaying,
    });
  }

  get totalTime() {
    return this.#totalTime;
  }

  set totalTime(totalTime: number) {
    this.#totalTime = Math.max(0, totalTime);

    if (this.#time > this.#totalTime) {
      this.#time = this.#totalTime;
    }

    // 检查是否需要触发 end 事件（当播放中且时间等于总时间时）
    if (this.#isPlaying && this.#time === this.#totalTime && this.#totalTime > 0) {
      this.pause();
      this.#emit("end");
    }
    else if (this.#isPlaying) {
      this.#lastTickTime = Date.now();
    }

    this.#emit("timeupdate", {
      time: this.#time,
      totalTime: this.#totalTime,
      isPlaying: this.#isPlaying,
    });
  }

  #tick() {
    if (!this.#isPlaying) {
      this.#timer = null;
      return;
    }
    const now = Date.now();
    const deltaTime = now - this.#lastTickTime;
    this.#lastTickTime = now;

    this.#time += deltaTime;

    if (this.#totalTime > 0 && this.#time >= this.#totalTime) {
      this.#time = this.#totalTime;
      this.pause();
      this.#emit("end");
      this.#timer = null;
      return;
    }

    this.#emit("timeupdate", {
      time: this.#time,
      totalTime: this.#totalTime,
      isPlaying: this.#isPlaying,
    });

    this.#timer = requestAnimationFrame(this.#tick);
  }

  #emit<T extends PlayerEventType>(type: T, data?: PlayerEventMap[T]) {
    const listeners = this.#eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => data ? callback(data) : callback());
    }
  }

  constructor() { }

  on<T extends PlayerEventType>(type: T, callback: PlayerEventCallback<T>) {
    if (!this.#eventListeners.has(type)) {
      this.#eventListeners.set(type, new Set());
    }
    const listeners = this.#eventListeners.get(type);
    listeners?.add(callback);
  }

  off<T extends PlayerEventType>(type: T, callback?: PlayerEventCallback<T>) {
    if (!callback) {
      this.#eventListeners.delete(type);
    }
    else {
      const listeners = this.#eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    }
  }

  play() {
    if (this.#isPlaying) {
      return;
    }
    this.#isPlaying = true;
    this.#lastTickTime = Date.now();
    this.#timer = requestAnimationFrame(this.#tick);

    this.#emit("play", {
      time: this.#time,
      totalTime: this.#totalTime,
    });
  }

  pause() {
    if (!this.#isPlaying) {
      return;
    }
    this.#isPlaying = false;
    if (this.#timer !== null) {
      cancelAnimationFrame(this.#timer);
      this.#timer = null;
    }

    this.#emit("pause", {
      time: this.#time,
      totalTime: this.#totalTime,
    });
  }

  reset() {
    this.pause();
    this.#time = 0;
    this.#lastTickTime = 0;
    this.#emit("reset");
  }

  destory() {
    if (this.#timer !== null) {
      cancelAnimationFrame(this.#timer);
      this.#timer = null;
    }
    this.#eventListeners.clear();
  }
}

export function usePlayer() {
  const playerRef = shallowRef(new Player());
  const _isPlaying = ref(false);
  const _time = ref(0);
  const _totalTime = ref(0);

  tryOnScopeDispose(() => {
    playerRef.value.destory();
  });

  // TODO test file (AI generate)

  const isPlaying = computed({
    get: () => _isPlaying.value,
    set: (value) => {
      if (value) {
        playerRef.value.play();
      }
      else {
        playerRef.value.pause();
      }
    },
  });
  const time = computed({
    get: () => _time.value,
    set: (value) => {
      playerRef.value.time = value;
    },
  });
  const leftTime = computed(() => _totalTime.value - _time.value);
  const totalTime = computed({
    get: () => _totalTime.value,
    set: (value) => {
      playerRef.value.totalTime = value;
    },
  });
  // 0 - 100
  const progress = computed({
    get: () => {
      if (_totalTime.value === 0) {
        return 0;
      }
      return Math.min(100, _time.value / _totalTime.value * 100);
    },
    set: (value) => {
      const _progress = Math.max(0, Math.min(value, 100));
      const _time = _totalTime.value * _progress / 100;
      time.value = _time;
    },
  });

  playerRef.value.on("play", () => {
    _isPlaying.value = true;
  });
  playerRef.value.on("pause", () => {
    _isPlaying.value = false;
  });
  playerRef.value.on("timeupdate", ({ time, totalTime }) => {
    _time.value = time;
    _totalTime.value = totalTime;
  });
  playerRef.value.on("reset", () => {
    _time.value = 0;
    _isPlaying.value = false;
  });

  function play() {
    playerRef.value.play();
  }

  function pause() {
    playerRef.value.pause();
  }

  function reset() {
    playerRef.value.reset();
  }

  return {
    playerRef,
    isPlaying,
    time,
    totalTime,
    leftTime,
    progress,

    play,
    pause,
    reset,
  };
}
