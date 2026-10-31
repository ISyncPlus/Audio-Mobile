import assert from "node:assert/strict";
import { test } from "node:test";
import {
  issueStreamAccess,
  verifyStreamAccess,
  withStreamAccess,
} from "../../AudioBlock_Backend/src/utils/streamAccess.ts";
process.env.PRIVY_APP_SECRET = "local-test-key-not-a-production-secret";
test("playback capabilities are scoped to one song and expire", () => {
  const token = issueStreamAccess("song-a", "user-a", 1000);
  assert.equal(verifyStreamAccess("song-a", token, 1001), "user-a");
  assert.throws(() => verifyStreamAccess("song-b", token, 1001), /Invalid/);
  assert.throws(() => verifyStreamAccess("song-a", token, 3601000), /expired/);
  const changed = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  assert.throws(() => verifyStreamAccess("song-a", changed, 1001), /Invalid/);
  for (const value of ["", "abc.def", "a".repeat(1025)])
    assert.throws(() => verifyStreamAccess("song-a", value));
});
test("scoped access reaches only our variant playlists, never S3 segments or another song", () => {
  const text =
    "#EXTM3U\nhttps://api.test/api/song/stream/a/128k\nhttps://storage.test/segment.ts?X-Amz-Signature=signed\nhttps://api.test/api/song/stream/b/128k";
  assert.equal(
    withStreamAccess(text, "a", "scope", "https://api.test"),
    text.replace("/a/128k", "/a/128k?access=scope"),
  );
  assert.equal(
    withStreamAccess(text, "a", undefined, "https://api.test"),
    text,
  );
});
