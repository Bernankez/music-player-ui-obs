import type { PlayerEventMap } from "./usePlayer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { Player, usePlayer } from "./usePlayer";

// 简化的 mock，避免使用 setTimeout
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

// 在每个测试前重置 mock
beforeEach(() => {
  mockRequestAnimationFrame.mockClear();
  mockCancelAnimationFrame.mockClear();

  // 设置简单的同步 mock
  mockRequestAnimationFrame.mockImplementation(() => {
    // 不实际调用 callback，只返回一个 ID
    return 1;
  });

  mockCancelAnimationFrame.mockImplementation(() => {
    // 什么都不做
  });

  // 设置全局 mock
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    value: mockRequestAnimationFrame,
    writable: true,
  });

  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    value: mockCancelAnimationFrame,
    writable: true,
  });
});

describe("player class", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player();
  });

  afterEach(() => {
    player.destory();
  });

  describe("basic properties", () => {
    it("should initialize with default values", () => {
      expect(player.time).toBe(0);
      expect(player.totalTime).toBe(0);
    });

    it("should correctly set and get time (milliseconds)", () => {
      player.totalTime = 100000; // 100秒 = 100,000毫秒
      player.time = 50000; // 50秒 = 50,000毫秒
      expect(player.time).toBe(50000);
    });

    it("should not allow time to exceed total time", () => {
      player.totalTime = 100000; // 100秒
      player.time = 150000; // 150秒
      expect(player.time).toBe(100000); // 应该被限制为总时间
    });

    it("should not allow negative time", () => {
      player.time = -10000;
      expect(player.time).toBe(0);
    });

    it("should not allow negative total time", () => {
      player.totalTime = -10000;
      expect(player.totalTime).toBe(0);
    });
  });

  describe("playback control", () => {
    it("should be able to start playing", () => {
      const playCallback = vi.fn();
      player.on("play", playCallback);

      player.play();

      expect(playCallback).toHaveBeenCalledWith({
        time: 0,
        totalTime: 0,
      });
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it("should be able to pause playback", () => {
      const pauseCallback = vi.fn();
      player.on("pause", pauseCallback);

      // 首先开始播放
      player.play();
      // 然后暂停
      player.pause();

      expect(pauseCallback).toHaveBeenCalledWith({
        time: 0,
        totalTime: 0,
      });
    });

    it("should not trigger multiple events on repeated play calls", () => {
      const playCallback = vi.fn();
      player.on("play", playCallback);

      player.play();
      player.play();

      expect(playCallback).toHaveBeenCalledTimes(1);
    });

    it("should be able to reset player", () => {
      const resetCallback = vi.fn();
      player.on("reset", resetCallback);

      player.totalTime = 100000; // 100秒
      player.time = 50000; // 50秒
      player.play();
      player.reset();

      expect(player.time).toBe(0);
      expect(resetCallback).toHaveBeenCalled();
    });
  });

  describe("event system", () => {
    it("should be able to add and trigger event listeners", () => {
      const callback = vi.fn();
      player.on("timeupdate", callback);

      player.totalTime = 100000; // 100秒
      player.time = 10000; // 10秒

      expect(callback).toHaveBeenCalledWith({
        time: 10000,
        totalTime: 100000,
        isPlaying: false,
      });
    });

    it("should be able to remove specific event listeners", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      player.on("timeupdate", callback1);
      player.on("timeupdate", callback2);
      player.off("timeupdate", callback1);

      player.time = 10000; // 10秒

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it("should trigger end event when time reaches total time", () => {
      const endCallback = vi.fn();
      player.on("end", endCallback);

      player.totalTime = 100000; // 100秒
      player.time = 99000; // 99秒
      player.play();

      // 设置时间到达结尾应该触发 end 事件
      player.time = 100000; // 100秒

      expect(endCallback).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should adjust time when total time changes and current time exceeds it", () => {
      const timeUpdateCallback = vi.fn();
      player.on("timeupdate", timeUpdateCallback);

      player.totalTime = 100000; // 100秒
      player.time = 80000; // 80秒

      // 清空之前的调用记录
      timeUpdateCallback.mockClear();

      player.totalTime = 50000; // 50秒

      expect(player.time).toBe(50000);
      expect(timeUpdateCallback).toHaveBeenCalledWith({
        time: 50000,
        totalTime: 50000,
        isPlaying: false,
      });
    });

    it("should end playback when total time becomes current time during playback", () => {
      const endCallback = vi.fn();
      player.on("end", endCallback);

      player.totalTime = 100000; // 100秒
      player.time = 50000; // 50秒
      player.play();

      // 将总时间设置为当前时间
      player.totalTime = 50000; // 50秒

      expect(endCallback).toHaveBeenCalled();
      expect(player.time).toBe(50000);
    });
  });
});

describe("usePlayer composable", () => {
  let playerInstance: ReturnType<typeof usePlayer>;

  beforeEach(() => {
    playerInstance = usePlayer();
  });

  afterEach(() => {
    playerInstance.playerRef.value.destory();
  });

  describe("reactive properties", () => {
    it("should return correct reactive properties", () => {
      expect(playerInstance.isPlaying.value).toBe(false);
      expect(playerInstance.time.value).toBe(0);
      expect(playerInstance.totalTime.value).toBe(0);
      expect(playerInstance.leftTime.value).toBe(0);
      expect(playerInstance.progress.value).toBe(0);
    });

    it("should update total time (milliseconds)", async () => {
      playerInstance.totalTime.value = 200000; // 200秒
      await nextTick();
      expect(playerInstance.totalTime.value).toBe(200000);
    });

    it("should update current time (milliseconds)", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();
      playerInstance.time.value = 50000; // 50秒
      await nextTick();
      expect(playerInstance.time.value).toBe(50000);
    });

    it("should correctly calculate remaining time (milliseconds)", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();
      playerInstance.time.value = 30000; // 30秒
      await nextTick();
      expect(playerInstance.leftTime.value).toBe(70000); // 70秒
    });

    it("should correctly calculate playback progress (percentage)", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();
      playerInstance.time.value = 25000; // 25秒
      await nextTick();
      expect(playerInstance.progress.value).toBe(25); // 25%
    });

    it("should update current time when setting progress", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();
      playerInstance.progress.value = 50; // 50%
      await nextTick();
      expect(playerInstance.time.value).toBe(50000); // 50秒
    });

    it("should return 0 progress when total time is 0", async () => {
      playerInstance.totalTime.value = 0;
      await nextTick();
      playerInstance.time.value = 10000; // 10秒
      await nextTick();
      expect(playerInstance.progress.value).toBe(0);
    });

    it("should not allow progress to exceed 100", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();
      playerInstance.time.value = 150000; // 150秒（超出总时间）
      await nextTick();
      expect(playerInstance.progress.value).toBe(100);
    });
  });

  describe("playback control methods", () => {
    it("should start playing with play method", async () => {
      playerInstance.play();
      await nextTick();
      expect(playerInstance.isPlaying.value).toBe(true);
    });

    it("should pause playback with pause method", async () => {
      playerInstance.play();
      await nextTick();
      playerInstance.pause();
      await nextTick();
      expect(playerInstance.isPlaying.value).toBe(false);
    });

    it("should reset player with reset method", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();
      playerInstance.time.value = 50000; // 50秒
      await nextTick();
      playerInstance.play();
      await nextTick();

      playerInstance.reset();
      await nextTick();

      expect(playerInstance.time.value).toBe(0);
      expect(playerInstance.isPlaying.value).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle negative time correctly", async () => {
      playerInstance.time.value = -10000;
      await nextTick();
      expect(playerInstance.time.value).toBe(0);
    });

    it("should handle out-of-range progress values correctly", async () => {
      playerInstance.totalTime.value = 100000; // 100秒
      await nextTick();

      // 测试超过100的进度
      playerInstance.progress.value = 150; // 150%
      await nextTick();
      expect(playerInstance.progress.value).toBe(100);
      expect(playerInstance.time.value).toBe(100000); // 100秒

      // 测试小于0的进度
      playerInstance.progress.value = -10; // -10%
      await nextTick();
      expect(playerInstance.progress.value).toBe(0);
      expect(playerInstance.time.value).toBe(0);
    });
  });

  describe("event responses", () => {
    it("should correctly update reactive state from underlying player events", async () => {
      const player = playerInstance.playerRef.value;

      // 模拟时间更新事件（不涉及播放/暂停避免卡住）
      player.totalTime = 100000; // 100秒
      await nextTick();
      player.time = 30000; // 30秒
      await nextTick();
      expect(playerInstance.time.value).toBe(30000);
      expect(playerInstance.totalTime.value).toBe(100000);
    });
  });
});

describe("event system integrity", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player();
  });

  afterEach(() => {
    player.destory();
  });

  it("should support multiple listeners of the same type", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    player.on("timeupdate", callback1);
    player.on("timeupdate", callback2);

    player.time = 10000; // 10秒

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it("should correctly handle events without parameters", () => {
    const resetCallback = vi.fn();

    player.on("reset", resetCallback);
    player.reset();

    expect(resetCallback).toHaveBeenCalledWith();
  });

  it("should not throw error when removing non-existent listeners", () => {
    const callback = vi.fn();

    expect(() => {
      player.off("play", callback);
    }).not.toThrow();
  });
});

describe("type safety", () => {
  it("should have correct types for event callbacks", () => {
    const player = new Player();

    // 这些应该通过 TypeScript 类型检查
    player.on("timeupdate", (data: PlayerEventMap["timeupdate"]) => {
      expect(typeof data.time).toBe("number");
      expect(typeof data.totalTime).toBe("number");
      expect(typeof data.isPlaying).toBe("boolean");
    });

    player.on("play", (data: PlayerEventMap["play"]) => {
      expect(typeof data.time).toBe("number");
      expect(typeof data.totalTime).toBe("number");
    });

    player.on("pause", (data: PlayerEventMap["pause"]) => {
      expect(typeof data.time).toBe("number");
      expect(typeof data.totalTime).toBe("number");
    });

    player.on("reset", () => {
      // reset 事件没有参数
    });

    player.on("end", () => {
      // end 事件没有参数
    });

    player.destory();
  });
});

describe("integration tests", () => {
  it("should work correctly for complete playback flow", async () => {
    const playerInstance = usePlayer();

    // 设置总时间（毫秒）
    playerInstance.totalTime.value = 100000; // 100秒
    await nextTick();
    expect(playerInstance.totalTime.value).toBe(100000);

    // 设置播放时间（毫秒）
    playerInstance.time.value = 25000; // 25秒
    await nextTick();
    expect(playerInstance.time.value).toBe(25000);
    expect(playerInstance.progress.value).toBe(25); // 25%
    expect(playerInstance.leftTime.value).toBe(75000); // 75秒

    // 重置播放器（避免播放相关的测试可能导致卡住）
    playerInstance.reset();
    await nextTick();
    expect(playerInstance.time.value).toBe(0);
    expect(playerInstance.isPlaying.value).toBe(false);

    // 清理
    playerInstance.playerRef.value.destory();
  });

  it("should work correctly for progress bar functionality", async () => {
    const playerInstance = usePlayer();

    // 设置总时间（毫秒）
    playerInstance.totalTime.value = 200000; // 200秒
    await nextTick();

    // 通过进度条设置播放位置
    playerInstance.progress.value = 75; // 75%
    await nextTick();

    expect(playerInstance.time.value).toBe(150000); // 200秒 * 0.75 = 150秒
    expect(playerInstance.progress.value).toBe(75);
    expect(playerInstance.leftTime.value).toBe(50000); // 200秒 - 150秒 = 50秒

    // 清理
    playerInstance.playerRef.value.destory();
  });

  it("should correctly handle time format conversions", async () => {
    const playerInstance = usePlayer();

    // 测试常见的时间转换场景
    const testCases = [
      { totalMs: 60000, timeMs: 30000, expectedProgress: 50 }, // 1分钟总长，30秒当前，50%进度
      { totalMs: 180000, timeMs: 45000, expectedProgress: 25 }, // 3分钟总长，45秒当前，25%进度
      { totalMs: 300000, timeMs: 240000, expectedProgress: 80 }, // 5分钟总长，4分钟当前，80%进度
    ];

    for (const testCase of testCases) {
      playerInstance.totalTime.value = testCase.totalMs;
      await nextTick();
      playerInstance.time.value = testCase.timeMs;
      await nextTick();

      expect(playerInstance.progress.value).toBe(testCase.expectedProgress);
      expect(playerInstance.leftTime.value).toBe(testCase.totalMs - testCase.timeMs);
    }

    // 清理
    playerInstance.playerRef.value.destory();
  });
});
