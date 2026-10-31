import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import {
  Action,
  Artwork,
  Button,
  Card,
  Chips,
  Field,
  Heading,
  ResourceState,
  Screen,
  s,
} from "../../src/components/ui";
import { Payment } from "../../src/components/Payment";
import { SignInCard } from "../../src/components/SignInCard";
import { useSession } from "../../src/lib/session";
import { useResource } from "../../src/lib/useResource";
import { usePlayer } from "../../src/lib/player";
import { artistName, type Room } from "../../src/lib/types";
export default function RoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const room = useResource<Room>(`/api/rooms/${encodeURIComponent(id)}`);
  const { profile, request } = useSession();
  const { play } = usePlayer();
  const [rating, setRating] = useState("5");
  const [content, setContent] = useState("");
  useFocusEffect(
    useCallback(() => {
      room.reload();
    }, [room.reload]),
  );
  const r = room.data;
  return (
    <Screen>
      <ResourceState
        loading={room.loading}
        error={room.error}
        retry={room.reload}
      />
      {r && (
        <>
          <Artwork
            uri={r.song?.coverArtPath}
            style={{ width: "100%", aspectRatio: 1, borderRadius: 18 }}
          />
          <Heading
            title={r.title}
            subtitle={`${artistName(r.artist)} · ${r.state}`}
          />
          <Text style={s.text}>
            {r.description ||
              "An exclusive listening experience from the artist."}
          </Text>
          <Button
            secondary
            onPress={() => router.push(`/artist/${r.artist.id}`)}
          >
            Meet the artist ↗
          </Button>
          <Card>
            <Text style={s.label}>{r.price} USDC to unlock</Text>
            <Text style={s.muted}>
              Access starts {new Date(r.accessStartsAt).toLocaleString()}
            </Text>
            <Text style={s.muted}>
              Access ends {new Date(r.accessEndsAt).toLocaleString()}
            </Text>
            {r.hasTicket && r.state === "live" && r.song ? (
              <Button
                onPress={() => void play({ ...r.song!, artist: r.artist })}
              >
                Listen now
              </Button>
            ) : r.hasTicket ? (
              <Text style={s.text}>
                {r.state === "upcoming"
                  ? "Your ticket is ready. Come back when the Room opens."
                  : "This Room’s access window has ended."}
              </Text>
            ) : null}
          </Card>
          {!r.hasTicket &&
            r.state !== "closed" &&
            (profile ? (
              <Payment roomId={r.id} price={r.price} onComplete={room.reload} />
            ) : (
              <SignInCard />
            ))}
          <Heading
            title="Reviews"
            subtitle={
              r.avgRating
                ? `${r.avgRating.toFixed(1)} / 5 stars`
                : "Be the first to share your thoughts."
            }
          />
          {r.reviews?.map((review) => (
            <Card key={review.id}>
              <Text style={s.label}>
                {artistName(review.user)} · {"★".repeat(review.rating || 0)}
              </Text>
              <Text style={s.text}>{review.content}</Text>
            </Card>
          ))}
          {r.hasTicket && profile?.role === "listener" && (
            <Card>
              <Text style={s.label}>How did it sound?</Text>
              <Chips
                items={["1", "2", "3", "4", "5"]}
                selected={rating}
                onSelect={setRating}
              />
              <Field
                multiline
                placeholder="Share your review"
                value={content}
                onChangeText={setContent}
              />
              <Action
                label="Post review"
                disabled={!content.trim()}
                run={() =>
                  request(`/api/rooms/${r.id}/reviews`, {
                    method: "POST",
                    body: { rating: Number(rating), content: content.trim() },
                    authenticated: true,
                  })
                }
                onSuccess={() => {
                  setContent("");
                  room.reload();
                }}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
