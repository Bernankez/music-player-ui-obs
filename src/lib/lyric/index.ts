import type { LyricLine } from "./lyric";

export * from "./lyric";
export * from "./metadata";

export const DEFAULT_METADATA_MAP = {
  ti: "title",
  ar: "artist",
  al: "album",
  by: "lyricist",
} as const;

export function findCurrentLyric(lyrics: LyricLine[], currentTime: number) {
  if (lyrics.length === 0)
    return undefined;

  let currentLyric: LyricLine | undefined;

  for (const lyric of lyrics) {
    if (lyric.time <= currentTime) {
      currentLyric = lyric;
    }
    else {
      break;
    }
  }

  return currentLyric;
}

export function findLyricById(lyrics: LyricLine[], id: string): LyricLine | undefined {
  return lyrics.find(lyric => lyric.id === id);
}
