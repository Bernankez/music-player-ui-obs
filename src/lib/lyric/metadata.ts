export type Metadata<T extends Record<string, string>> = {
  [K in T[keyof T]]?: string;
} & {
  offset?: number;
};

const METADATA_REGEX = /^\[([a-z]+):(.+)\]$/;

export function parseMetadataLine(line: string): [string, string] | null {
  const match = line.match(METADATA_REGEX);
  return match ? [match[1], match[2]] : null;
}

export function parseLyricMetadata<T extends Record<string, string>>(
  lines: string[],
  metadataMap: T,
): Metadata<T> {
  const metadata: Metadata<T> = {};

  for (const line of lines) {
    const metadataResult = parseMetadataLine(line);
    if (metadataResult) {
      const [key, value] = metadataResult;
      const mappedKey = metadataMap[key] as keyof Metadata<T>;

      if (mappedKey && value) {
        (metadata as any)[mappedKey] = value;
      }
      else if (key === "offset" && value) {
        metadata.offset = Number.parseInt(value) || 0;
      }
    }
  }

  return metadata;
}
