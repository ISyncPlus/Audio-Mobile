import type { Song } from "./types.ts";

export function filterSongs(songs: Song[], search: string, genre = "All") {
  const term = search.trim().toLowerCase();
  return songs.filter(
    (s) =>
      (genre === "All" || s.genre?.toLowerCase() === genre.toLowerCase()) &&
      [s.title, s.artist.name, s.artist.username, s.genre].some((v) =>
        v?.toLowerCase().includes(term),
      ),
  );
}
export function validAmount(value: string, decimals = 6) {
  return (
    new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`).test(value) &&
    /[1-9]/.test(value)
  );
}
export function collaborationShares(
  creatorPercent: string,
  members: { userId: string; percent: string }[],
) {
  const toBps = (value: string) => {
    if (!validAmount(value, 2) || Number(value) > 100)
      throw new Error(
        "Each share must be greater than zero, with up to 2 decimal places.",
      );
    return Math.round(Number(value) * 100);
  };
  const creatorSplitBps = toBps(creatorPercent);
  const shares = members.map((m) => ({
    userId: m.userId,
    splitBps: toBps(m.percent),
  }));
  if (
    !shares.length ||
    creatorSplitBps + shares.reduce((sum, m) => sum + m.splitBps, 0) !== 10000
  )
    throw new Error("The shares must add up to exactly 100%.");
  return { creatorSplitBps, members: shares };
}
export function queueNeighbor(
  queue: Song[],
  currentId: string,
  direction: 1 | -1,
) {
  const index = queue.findIndex((s) => s.id === currentId);
  return index < 0 ? undefined : queue[index + direction];
}
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
export const songMoods = [
  "happy",
  "sad",
  "energetic",
  "chill",
  "romantic",
  "angry",
  "nostalgic",
  "focused",
];
