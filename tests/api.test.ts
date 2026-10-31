import assert from "node:assert/strict";
import { test } from "node:test";
process.env.EXPO_PUBLIC_API_URL = "https://api.example.test/";
const { apiRequest, assertSecureAuthUrl } = await import("../src/lib/api.ts");
test("release builds cannot send account tokens over HTTP", (t) => {
  Object.assign(globalThis, { __DEV__: false });
  t.after(() => Reflect.deleteProperty(globalThis, "__DEV__"));
  assert.throws(
    () => assertSecureAuthUrl("http://localhost:4000", "token"),
    /HTTPS API/,
  );
  assert.doesNotThrow(() =>
    assertSecureAuthUrl("https://api.example.test", "token"),
  );
  assert.doesNotThrow(() => assertSecureAuthUrl("http://localhost:4000", null));
});
test("API uses the existing envelope and refreshable bearer credentials", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string, options: RequestInit) => {
      assert.equal(url, "https://api.example.test/api/pool/vote");
      assert.equal(
        (options.headers as Record<string, string>).Authorization,
        "Bearer fresh-token",
      );
      assert.equal(options.body, '{"songId":"track-1"}');
      return Response.json({ success: true, data: { recorded: true } });
    },
  );
  assert.deepEqual(
    await apiRequest(
      "/api/pool/vote",
      { method: "POST", authenticated: true, body: { songId: "track-1" } },
      "fresh-token",
    ),
    { recorded: true },
  );
});
test("protected requests fail before contacting the backend without a token", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Must not run");
  });
  await assert.rejects(
    apiRequest("/api/wallet/balance", { authenticated: true }),
    /Sign in/,
  );
  assert.equal(mock.mock.callCount(), 0);
});
test("backend errors remain visible to users", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { success: false, message: "Buy a ticket to this room to listen" },
      { status: 403 },
    ),
  );
  await assert.rejects(apiRequest("/api/rooms/locked"), /Buy a ticket/);
});
test("multipart uploads let the platform set its own boundary", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, options: RequestInit) => {
      assert.equal(
        (options.headers as Record<string, string>)["Content-Type"],
        undefined,
      );
      assert.ok(options.body instanceof FormData);
      return Response.json({ success: true });
    },
  );
  assert.equal(
    await apiRequest("/api/song/upload/chunk", {
      method: "POST",
      body: new FormData(),
    }),
    undefined,
  );
});
test("network failures are reported without leaking credentials", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(apiRequest("/health"), /Could not reach AudioBlocks/);
});
test("request timeout aborts a stalled network call", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) =>
        options.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        ),
      ),
  );
  await assert.rejects(apiRequest("/health", { timeout: 5 }), /timed out/);
});
test("account sync keeps the user envelope", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: true, user: { id: "u" } }),
  );
  assert.deepEqual(
    await apiRequest("/api/auth/sync", { method: "POST" }, "token", true),
    { success: true, user: { id: "u" } },
  );
});
