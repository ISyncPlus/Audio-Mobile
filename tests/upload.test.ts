import assert from "node:assert/strict";
import { test } from "node:test";
import { uploadChunks } from "../src/lib/upload.ts";
test("uploads consecutive bounded chunks with the exact backend field names", async () => {
  const file = new File([new Uint8Array(1024 * 1024 + 3)], "song.mp3", {
    type: "audio/mpeg",
  });
  const sizes: number[] = [];
  const progress: number[] = [];
  const count = await uploadChunks(
    {
      uri: "blob:test",
      name: file.name,
      file,
      size: file.size,
      lastModified: file.lastModified,
    },
    "session",
    async (body) => {
      assert.equal(body.get("fileId"), "session");
      assert.equal(body.get("chunkIndex"), String(sizes.length));
      sizes.push((body.get("chunk") as Blob).size);
    },
    (value) => progress.push(value),
  );
  assert.equal(count, 2);
  assert.deepEqual(sizes, [1024 * 1024, 3]);
  assert.deepEqual(progress, [50, 100]);
});
test("upload stops on a failed chunk instead of finalizing an incomplete song", async () => {
  const file = new File([new Uint8Array(2 * 1024 * 1024)], "song.mp3");
  let requests = 0;
  await assert.rejects(
    uploadChunks(
      {
        uri: "blob:test",
        name: file.name,
        file,
        lastModified: file.lastModified,
      },
      "session",
      async () => {
        requests++;
        throw new Error("network failed");
      },
      () => {},
    ),
    /network failed/,
  );
  assert.equal(requests, 1);
});
