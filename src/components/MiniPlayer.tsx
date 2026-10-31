import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { usePlayer } from "../lib/player";
import { artistName } from "../lib/types";
import { Artwork, colors, IconButton, s } from "./ui";
export function MiniPlayer() {
  const { track, playing, toggle, next, position, duration } = usePlayer();
  if (!track) return null;
  return (
    <View
      style={{
        backgroundColor: "#211A21",
        borderTopWidth: 1,
        borderColor: "#422639",
      }}
    >
      <View
        style={{
          height: 2,
          width: `${duration ? Math.min(100, (position / duration) * 100) : 0}%`,
          backgroundColor: colors.pink,
        }}
      />
      <View style={[s.row, { paddingHorizontal: 14, paddingVertical: 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Now playing ${track.title}`}
          onPress={() => router.push("/player")}
          style={[s.row, { flex: 1 }]}
        >
          <Artwork
            uri={track.coverArtPath}
            style={{ width: 42, height: 42, borderRadius: 8 }}
          />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={s.label}>
              {track.title}
            </Text>
            <Text numberOfLines={1} style={s.muted}>
              {artistName(track.artist)}
            </Text>
          </View>
        </Pressable>
        <IconButton
          name={playing ? "pause" : "play"}
          label={playing ? "Pause" : "Play"}
          onPress={toggle}
        />
        <IconButton
          name="play-skip-forward"
          label="Next track"
          onPress={next}
        />
      </View>
    </View>
  );
}
