import { createContext, useContext } from "react";
import { apiRequest, type RequestOptions } from "./api";
import type { Profile } from "./types";
export interface Session {
  profile: Profile | null;
  ready: boolean;
  syncing: boolean;
  error: string | null;
  sync: (role?: "artist" | "listener") => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  request: <T>(path: string, options?: RequestOptions) => Promise<T>;
}
export const SessionContext = createContext<Session>({
  profile: null,
  ready: true,
  syncing: false,
  error: null,
  sync: async () => {
    throw new Error("Open the iOS or Android app to sign in.");
  },
  logout: async () => {},
  getToken: async () => null,
  request: (path, options) => apiRequest(path, options),
});
export const useSession = () => useContext(SessionContext);
