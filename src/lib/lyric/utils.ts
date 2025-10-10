export function parseTimestamp(minutes: string, seconds: string, centiseconds: string) {
  return Number.parseInt(minutes) * 60 * 1000 + Number.parseInt(seconds) * 1000 + Number.parseInt(centiseconds) * 10;
}

export function normalizeLyricText(text: string) {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n");
}
