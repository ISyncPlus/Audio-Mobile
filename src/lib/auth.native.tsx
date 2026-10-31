import { PrivyProvider, usePrivy } from "@privy-io/expo";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { apiRequest, type RequestOptions } from "./api";
import { SessionContext } from "./session";
import type { Profile } from "./types";

function SessionProvider({ children }: PropsWithChildren) {
  const { user, isReady, getAccessToken, logout } = usePrivy();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeUser = useRef(user?.id);
  activeUser.current = user?.id;
  const tokenGetter = useRef(getAccessToken);
  tokenGetter.current = getAccessToken;
  const getToken = useCallback(() => tokenGetter.current(), []);
  const sync = useCallback(
    async (role?: "artist" | "listener") => {
      const id = activeUser.current;
      setSyncing(true);
      setError(null);
      try {
        const response = await apiRequest<{ user: Profile }>(
          "/api/auth/sync",
          { method: "POST", body: role ? { role } : {}, authenticated: true },
          await getToken(),
          true,
        );
        if (id === activeUser.current) setProfile(response.user);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed");
        throw e;
      } finally {
        setSyncing(false);
      }
    },
    [getToken],
  );
  useEffect(() => {
    setProfile(null);
    setError(null);
    if (isReady && user?.id) void sync().catch(() => {});
  }, [isReady, user?.id, sync]);
  const authenticatedRequest = useCallback(
    async <T,>(path: string, options?: RequestOptions) => {
      const token = user ? await getToken() : null;
      return apiRequest<T>(path, options, token);
    },
    [user?.id, getToken],
  );
  return (
    <SessionContext.Provider
      value={{
        profile,
        ready: isReady,
        syncing,
        error,
        sync,
        getToken,
        logout: async () => {
          await logout();
          setProfile(null);
        },
        request: authenticatedRequest,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function AuthProvider({ children }: PropsWithChildren) {
  const appId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;
  // Browsing remains available until the project's mobile Privy client is configured.
  if (!appId || !clientId) return children;
  return (
    <PrivyProvider appId={appId} clientId={clientId}>
      <SessionProvider>{children}</SessionProvider>
    </PrivyProvider>
  );
}
