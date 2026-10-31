import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, AppState } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { apiUrl, assertSecureAuthUrl } from "./api";
import { useSession } from "./session";
import { queueNeighbor } from "./logic";
import { artistName, type Song } from "./types";

interface PlayerContextValue {
  track: Song | null;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  play: (song: Song, queue?: Song[]) => Promise<void>;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  clear: () => void;
}
const PlayerContext = createContext<PlayerContextValue | null>(null);
export const usePlayer = () => {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("PlayerProvider is missing");
  return value;
};
export function PlayerProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const { request, profile } = useSession();
  const [track, setTrack] = useState<Song | null>(null);
  const queue = useRef<Song[]>([]);
  const pending = useRef(0);
  const started = useRef(false);
  const endHandled = useRef(false);
  const clear = () => {
    pending.current++;
    player.pause();
    player.replace(null);
    setTrack(null);
    queue.current = [];
  };
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((e) => Alert.alert("Audio setup", e.message));
  }, []);
  useEffect(() => {
    clear();
  }, [profile?.id]);
  const play = async (song: Song, songs?: Song[]) => {
    const requestId = ++pending.current;
    try {
      if (!apiUrl)
        throw new Error(
          "Connect the backend in Audio-Mobile/.env to stream music.",
        );
      const { url: uri } = await request<{ url: string }>(
        `/api/song/playback/${encodeURIComponent(song.id)}`,
      );
      if (!uri || !/^https?:\/\//.test(uri))
        throw new Error("The server returned an invalid playback URL.");
      assertSecureAuthUrl(uri, "playback");
      if (requestId !== pending.current) return;
      queue.current = songs?.length ? songs : [song];
      started.current = false;
      endHandled.current = false;
      player.replace({ uri });
      setTrack(song);
      player.play();
      player.setActiveForLockScreen(true, {
        title: song.title,
        artist: artistName(song.artist),
        artworkUrl: song.coverArtPath || undefined,
      });
    } catch (error) {
      if (requestId === pending.current)
        Alert.alert(
          "Playback unavailable",
          error instanceof Error ? error.message : "Please try again.",
        );
    }
  };
  const next = () => {
    if (!track) return;
    const neighbor = queueNeighbor(queue.current, track.id, 1);
    if (neighbor) void play(neighbor, queue.current);
    else player.pause();
  };
  useEffect(() => {
    if (status.playing) started.current = true;
    if (status.didJustFinish && !endHandled.current) {
      endHandled.current = true;
      next();
    }
  }, [status.didJustFinish, status.playing]);
  useEffect(() => {
    if (!track) return;
    const id = setTimeout(() => {
      if (!started.current) {
        player.pause();
        Alert.alert(
          "Playback unavailable",
          "The audio could not start. Check your connection and try again.",
        );
      }
    }, 30000);
    return () => clearTimeout(id);
  }, [track?.id]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active" && track && status.playing)
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: artistName(track.artist),
        });
    });
    return () => listener.remove();
  }, [track, status.playing]);
  return (
    <PlayerContext.Provider
      value={{
        track,
        playing: status.playing,
        buffering: status.isBuffering,
        position: status.currentTime,
        duration: status.duration,
        play,
        toggle: () => {
          if (status.playing) player.pause();
          else {
            if (status.didJustFinish) void player.seekTo(0);
            player.play();
          }
        },
        next,
        previous: () => {
          if (status.currentTime > 3) void player.seekTo(0);
          else if (track) {
            const song = queueNeighbor(queue.current, track.id, -1);
            if (song) void play(song, queue.current);
            else void player.seekTo(0);
          }
        },
        seek: (seconds) => {
          void player
            .seekTo(Math.max(0, Math.min(seconds, status.duration)))
            .catch((e) => Alert.alert("Playback", e.message));
        },
        clear,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
