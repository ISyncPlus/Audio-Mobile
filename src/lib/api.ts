export const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "").replace(
  /\/+$/,
  "",
);
export function assertSecureAuthUrl(url: string, token?: string | null) {
  if (
    token &&
    typeof __DEV__ !== "undefined" &&
    !__DEV__ &&
    !url.startsWith("https://")
  )
    throw new Error(
      "Use an HTTPS API URL before signing in to a release build.",
    );
}
export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: object | FormData;
  authenticated?: boolean;
  timeout?: number;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  token?: string | null,
  raw = false,
): Promise<T> {
  if (!apiUrl)
    throw new Error(
      "Set EXPO_PUBLIC_API_URL in Audio-Mobile/.env to connect to AudioBlocks.",
    );
  if (options.authenticated && !token) throw new Error("Sign in to continue.");
  assertSecureAuthUrl(apiUrl, token);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout ?? 30000,
  );
  const form = options.body instanceof FormData;
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(!form && options.body
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: options.body
        ? form
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false)
      throw new Error(
        payload?.message ||
          payload?.error ||
          `Request failed (${response.status}).`,
      );
    if (!payload) throw new Error("The server returned an invalid response.");
    return raw ? payload : payload.data;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("The request timed out. Please try again.");
    if (error instanceof TypeError)
      throw new Error(
        "Could not reach AudioBlocks. Check your connection and API address.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
