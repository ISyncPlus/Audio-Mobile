import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterSongs,
  formatTime,
  queueNeighbor,
  validAmount,
  collaborationShares,
} from "../src/lib/logic.ts";
import type { Song } from "../src/lib/types.ts";
const songs: Song[] = [
  {
    id: "1",
    title: "Golden Hour",
    genre: "Afro",
    artist: { id: "a", name: "Amara" },
  },
  {
    id: "2",
    title: "Moonlight",
    genre: "Jazz",
    artist: { id: "b", username: "Kosi" },
  },
];
test("search matches titles, artist usernames and genres without case sensitivity", () => {
  assert.deepEqual(filterSongs(songs, "  KOSI "), [songs[1]]);
  assert.deepEqual(filterSongs(songs, "golden", "Afro"), [songs[0]]);
  assert.deepEqual(filterSongs(songs, "golden", "Jazz"), []);
  assert.deepEqual(filterSongs(songs, ""), songs);
});
test("payments validate decimal strings without floating point conversion", () => {
  for (const amount of ["1", "10.50", "0.000001", "100000000000000000000.1"])
    assert.equal(validAmount(amount), true);
  for (const amount of [
    "",
    "0",
    "0.000000",
    "-1",
    "1e3",
    "1,000",
    "NaN",
    "1.0000001",
    " 5",
    ".5",
    "5.",
  ])
    assert.equal(validAmount(amount), false, amount);
  assert.equal(validAmount("10.123", 2), false);
  assert.equal(validAmount("10.12", 2), true);
});
test("queue advances once and stops at the end instead of silently looping", () => {
  assert.equal(queueNeighbor(songs, "1", 1), songs[1]);
  assert.equal(queueNeighbor(songs, "2", 1), undefined);
  assert.equal(queueNeighbor(songs, "1", -1), undefined);
  assert.equal(queueNeighbor(songs, "missing", 1), undefined);
});
test("playback timestamps handle unavailable and invalid durations", () => {
  assert.equal(formatTime(65.9), "1:05");
  assert.equal(formatTime(Infinity), "0:00");
  assert.equal(formatTime(-5), "0:00");
});
test("collaboration payouts use exact integer basis points and total 100%", () => {
  assert.deepEqual(
    collaborationShares("33.33", [{ userId: "b", percent: "66.67" }]),
    { creatorSplitBps: 3333, members: [{ userId: "b", splitBps: 6667 }] },
  );
  assert.throws(
    () => collaborationShares("50", [{ userId: "b", percent: "40" }]),
    /exactly 100%/,
  );
  assert.throws(() => collaborationShares("100", []), /exactly 100%/);
  for (const percent of ["0", "1.111", "-2", "101", "Infinity"])
    assert.throws(
      () => collaborationShares(percent, [{ userId: "b", percent: "50" }]),
      /Each share/,
    );
});
