import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { usePlayer } from "../lib/player";
import { useSession } from "../lib/session";
import { artistName, type Song } from "../lib/types";
import { Artwork, colors, Icon, IconButton, s } from "./ui";
export function Songs({
  songs,
  horizontal = false,
}: {
  songs: Song[];
  horizontal?: boolean;
}) {
  const { play, track, playing, toggle } = usePlayer();
  const { request, profile } = useSession();
  const [likes, setLikes] = useState<
    Record<string, { liked: boolean; likeCount: number }>
  >({});
  const [liking, setLiking] = useState<string | null>(null);
  useEffect(() => setLikes({}), [profile?.id]);
  const content = songs.map((song) => (
    <View
      key={song.id}
      style={{
        width: horizontal ? 158 : undefined,
        flex: horizontal ? undefined : 1,
        minWidth: horizontal ? undefined : "45%",
        maxWidth: horizontal ? undefined : "49%",
        backgroundColor: colors.card,
        padding: 10,
        borderRadius: 14,
        gap: 8,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play ${song.title}`}
        onPress={() =>
          track?.id === song.id ? toggle() : void play(song, songs)
        }
      >
        <Artwork
          uri={song.coverArtPath}
          style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }}
        />
        <View
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            backgroundColor: colors.pink,
            padding: 9,
            borderRadius: 30,
          }}
        >
          <Icon
            size={16}
            name={track?.id === song.id && playing ? "pause" : "play"}
          />
        </View>
      </Pressable>
      <Text numberOfLines={1} style={s.label}>
        {song.title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${artistName(song.artist)}`}
        disabled={!song.artist.id}
        onPress={() => router.push(`/artist/${song.artist.id}`)}
      >
        <Text numberOfLines={1} style={s.muted}>
          {artistName(song.artist)}
        </Text>
      </Pressable>
      <View style={s.between}>
        <Text numberOfLines={1} style={[s.muted, { fontSize: 10, flex: 1 }]}>
          {song.genre || "Independent"}
        </Text>
        <View style={s.row}>
          <Text style={[s.muted, { fontSize: 11 }]}>
            {likes[song.id]?.likeCount ?? song.likeCount ?? 0}
          </Text>
          <IconButton
            name={
              (likes[song.id]?.liked ?? song.isLiked)
                ? "heart"
                : "heart-outline"
            }
            label={`Like ${song.title}`}
            color={
              (likes[song.id]?.liked ?? song.isLiked)
                ? colors.pink
                : colors.muted
            }
            disabled={liking !== null}
            onPress={async () => {
              if (!profile) {
                router.push("/sign-in");
                return;
              }
              setLiking(song.id);
              try {
                const value = await request<{
                  liked: boolean;
                  likeCount: number;
                }>(`/api/song/${song.id}/like`, {
                  method: "POST",
                  authenticated: true,
                });
                setLikes((prev) => ({ ...prev, [song.id]: value }));
              } catch (e) {
                Alert.alert(
                  "Like failed",
                  e instanceof Error ? e.message : "Try again",
                );
              } finally {
                setLiking(null);
              }
            }}
          />
        </View>
      </View>
      {song.reason && (
        <Text style={[s.muted, { fontSize: 11 }]}>{song.reason}</Text>
      )}
    </View>
  ));
  return horizontal ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12 }}
    >
      {content}
    </ScrollView>
  ) : (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {content}
    </View>
  );
}
