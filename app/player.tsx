import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { usePlayer } from "../src/lib/player";
import { useSession } from "../src/lib/session";
import { useResource } from "../src/lib/useResource";
import { artistName, type Comment } from "../src/lib/types";
import { formatTime } from "../src/lib/logic";
import { apiUrl } from "../src/lib/api";
import {
  Action,
  Artwork,
  Card,
  Field,
  Heading,
  IconButton,
  ResourceState,
  Screen,
  colors,
  s,
} from "../src/components/ui";
export default function Player() {
  const {
    track,
    playing,
    buffering,
    toggle,
    next,
    previous,
    position,
    duration,
    seek,
  } = usePlayer();
  const { profile, request } = useSession();
  const comments = useResource<Comment[]>(
    track ? `/api/song/${track.id}/comments` : null,
  );
  const [content, setContent] = useState("");
  const [width, setWidth] = useState(1);
  if (!track)
    return (
      <Screen>
        <ResourceState empty="Pick a track in Explore to start listening." />
      </Screen>
    );
  return (
    <Screen>
      <Text
        style={[
          s.muted,
          { textAlign: "center", letterSpacing: 2, fontSize: 10 },
        ]}
      >
        PLAYING FROM AUDIOBLOCKS
      </Text>
      <Artwork
        uri={track.coverArtPath}
        style={{ width: "100%", aspectRatio: 1, borderRadius: 24 }}
      />
      <Heading
        title={track.title}
        subtitle={artistName(track.artist)}
        action={
          <IconButton
            name="share-outline"
            label="Share track"
            onPress={() =>
              void Share.share({
                message: `${track.title} by ${artistName(track.artist)} on AudioBlocks`,
                url: `${apiUrl}/api/song/stream/${track.id}/master.m3u8`,
              })
            }
          />
        }
      />
      <View style={{ gap: 6 }}>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="Playback position"
          accessibilityValue={{
            min: 0,
            max: Math.round(duration),
            now: Math.round(position),
            text: formatTime(position),
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            seek(
              position + (e.nativeEvent.actionName === "increment" ? 15 : -15),
            )
          }
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onPress={(e) => seek((e.nativeEvent.locationX / width) * duration)}
          style={{ height: 44, justifyContent: "center" }}
        >
          <View
            style={{ backgroundColor: "#393039", height: 4, borderRadius: 4 }}
          >
            <View
              style={{
                height: 4,
                backgroundColor: colors.pink,
                borderRadius: 4,
                width: `${duration ? Math.min(100, (position / duration) * 100) : 0}%`,
              }}
            />
          </View>
        </Pressable>
        <View style={s.between}>
          <Text style={s.muted}>{formatTime(position)}</Text>
          <Text style={s.muted}>{formatTime(duration)}</Text>
        </View>
      </View>
      <View style={[s.row, { justifyContent: "center", gap: 24 }]}>
        <IconButton
          name="play-skip-back"
          label="Previous track"
          onPress={previous}
        />
        <View
          style={{
            backgroundColor: colors.pink,
            borderRadius: 40,
            padding: 12,
          }}
        >
          <IconButton
            name={playing ? "pause" : "play"}
            label={playing ? "Pause" : "Play"}
            onPress={toggle}
          />
        </View>
        <IconButton
          name="play-skip-forward"
          label="Next track"
          onPress={next}
        />
      </View>
      {buffering && (
        <Text style={[s.muted, { textAlign: "center" }]}>Buffering…</Text>
      )}
      <Heading title="Conversation" />
      <ResourceState
        loading={comments.loading}
        error={comments.error}
        retry={comments.reload}
        empty={
          !comments.loading &&
          !comments.error &&
          !comments.data?.length &&
          "Start the conversation about this track."
        }
      />
      {comments.data?.map((comment) => (
        <Card key={comment.id}>
          <Text style={s.label}>{artistName(comment.user)}</Text>
          <Text style={s.text}>{comment.content}</Text>
        </Card>
      ))}
      {profile && (
        <Card>
          <Field
            placeholder="Leave a comment"
            multiline
            value={content}
            onChangeText={setContent}
          />
          <Action
            label="Post comment"
            disabled={!content.trim()}
            run={() =>
              request(`/api/song/${track.id}/comments`, {
                method: "POST",
                body: { content: content.trim() },
                authenticated: true,
              })
            }
            onSuccess={() => {
              setContent("");
              comments.reload();
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
