import type { Metadata } from "./metadata";
import { DEFAULT_METADATA_MAP } from ".";
import { parseLyricMetadata, parseMetadataLine } from "./metadata";
import { normalizeLyricText, parseTimestamp } from "./utils";

export interface Lyric<T> {
  metadata: T;
  lyrics: LyricLine[];
}

export interface LyricLine {
  id: string;
  time: number; // millisecond
  text: string;
  segments?: LyricSegment[];
  singer?: string;
  raw: string;
}

export interface LyricSegment {
  time: number; // millisecond
  text: string;
}

// [minutes]:[seconds].[centiseconds]
const TIME_TAG_REGEX = /\[(\d{2}):(\d{2})\.(\d{2})\]/g;
// <[minutes]:[seconds].[centiseconds]>[text]
const SEGMENT_REGEX = /<(\d{2}):(\d{2})\.(\d{2})>([^<]+)/g;
// [singer]:[text]
const SINGER_REGEX = /^([A-Z]):\s(.*)$/;

export interface ParseLyricOptions<T extends Record<string, string>> {
  useOffset?: boolean;
  metadataMap?: T;
}

export function parseLyric<T extends Record<string, string> = typeof DEFAULT_METADATA_MAP>(
  lyricText: string,
  options: ParseLyricOptions<T> = {},
): Lyric<Metadata<T>> {
  const { useOffset = true, metadataMap = DEFAULT_METADATA_MAP } = options;
  const lines = normalizeLyricText(lyricText).split("\n");

  const metadata = parseLyricMetadata(lines, metadataMap);
  const lyrics = parseLyricContent(lines, { useOffset, offset: metadata.offset });

  return {
    metadata,
    lyrics,
  } as Lyric<Metadata<T>>;
}

export function parseLyricContent(lines: string[], options: { useOffset?: boolean; offset?: number }) {
  const { useOffset = true } = options;
  const offset = useOffset ? options.offset ?? 0 : 0;
  const lyrics: LyricLine[] = [];
  let idCounter = 0;

  for (const line of lines) {
    // Skip metadata
    if (parseMetadataLine(line))
      continue;

    const results = parseLyricLine(line);
    if (results) {
      // 返回数组，支持多时间标签
      for (const result of results) {
        lyrics.push({
          id: `${idCounter++}`,
          ...result,
          time: result.time + offset,
          raw: line,
        });
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}

function parseLyricLine(line: string): Omit<LyricLine, "id" | "raw">[] | null {
  const times: number[] = [];
  const timeMatches = line.matchAll(TIME_TAG_REGEX);
  for (const match of timeMatches) {
    times.push(parseTimestamp(match[1], match[2], match[3]));
  }

  // 如果没有时间标签，返回null
  if (times.length === 0)
    return null;

  // 移除所有时间标签，获取歌词内容
  let content = line.replace(TIME_TAG_REGEX, "").trim();

  // 提取歌手信息（如 "F: 歌词"）
  let singer: string | undefined;
  const singerMatch = content.match(SINGER_REGEX);
  if (singerMatch) {
    singer = singerMatch[1];
    content = singerMatch[2].trim();
  }

  // 判断是否为复杂歌词（包含 <xx:xx.xx> 格式）
  const hasSegments = content.includes("<");

  if (hasSegments) {
    // 复杂歌词：解析 segments
    const segments: LyricSegment[] = [];
    let fullText = "";

    const segmentMatches = content.matchAll(SEGMENT_REGEX);
    for (const segmentMatch of segmentMatches) {
      const segmentTime = parseTimestamp(segmentMatch[1], segmentMatch[2], segmentMatch[3]);
      const segmentText = segmentMatch[4].trim();
      segments.push({ time: segmentTime, text: segmentText });
      fullText += segmentText;
    }

    // 如果没有解析到任何segment，返回null
    if (segments.length === 0)
      return null;

    // 为每个时间创建一个歌词对象
    return times.map(time => ({
      time,
      segments,
      text: fullText,
      singer,
    }));
  }
  else {
    // 简单歌词：不包含 segments
    return times.map(time => ({
      time,
      text: content,
      singer,
    }));
  }
}
