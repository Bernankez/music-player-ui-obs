import type { DEFAULT_METADATA_MAP, Lyric, LyricLine, Metadata, ParseLyricOptions } from "@/lib/lyric";
import { findCurrentLyric, parseLyric } from "@/lib/lyric";

export function useLyric<T extends Record<string, string> = typeof DEFAULT_METADATA_MAP>(lyric: MaybeRefOrGetter<string>, currentTime: MaybeRefOrGetter<number>, options?: ParseLyricOptions<T>) {
  const parsedLyric = ref<Lyric<Metadata<T>>>();
  const currentLyric = ref<LyricLine>();

  watchEffect(() => {
    parsedLyric.value = parseLyric<T>(toValue(lyric), options);
  });

  watchEffect(() => {
    currentLyric.value = findCurrentLyric(parsedLyric.value?.lyrics ?? [], toValue(currentTime));
  });

  return {
    parsedLyric,
    currentLyric,
  };
}
