import { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Action,
  Button,
  Card,
  Field,
  Heading,
  ResourceState,
  Screen,
  s,
} from "../src/components/ui";
import { useSession } from "../src/lib/session";
import { useResource } from "../src/lib/useResource";
import { SignInCard } from "../src/components/SignInCard";
import type { Room, Song } from "../src/lib/types";
import { validAmount } from "../src/lib/logic";
import { DateField } from "../src/components/DateField";
export default function CreateRoom() {
  const params = useLocalSearchParams<{ songId?: string }>();
  const { profile, request } = useSession();
  const songs = useResource<Song[]>(
    profile?.role === "artist" ? `/api/song?artistId=${profile.id}` : null,
  );
  const [songId, setSongId] = useState(params.songId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  if (!profile)
    return (
      <Screen>
        <SignInCard />
      </Screen>
    );
  if (profile.role !== "artist")
    return (
      <Screen>
        <Text style={s.text}>
          An artist account is required to host a Room.
        </Text>
      </Screen>
    );
  return (
    <Screen>
      <Heading
        title="A closer listening experience"
        subtitle="Choose a track and set its price and access window."
      />
      <Button
        onPress={() =>
          router.push({ pathname: "/upload", params: { unreleased: "1" } })
        }
      >
        Upload an unreleased track
      </Button>
      {params.songId ? (
        <Card>
          <Text style={s.text}>Your unreleased track is selected.</Text>
        </Card>
      ) : (
        <>
          <ResourceState
            loading={songs.loading}
            error={songs.error}
            retry={songs.reload}
          />
          <Text style={s.muted}>
            Choosing an existing released track hides it from the public catalog
            when this Room is created.
          </Text>
          {songs.data?.map((song) => (
            <Button
              key={song.id}
              secondary={songId !== song.id}
              onPress={() => setSongId(song.id)}
            >
              {songId === song.id ? "✓ " : ""}
              {song.title}
            </Button>
          ))}
        </>
      )}
      <Field label="Room title" value={title} onChangeText={setTitle} />
      <Field
        label="Description (optional)"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <Field
        label="Ticket price (USDC)"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
        placeholder="5.00"
      />
      <DateField label="Access starts" value={starts} onChange={setStarts} />
      <DateField label="Access ends" value={ends} onChange={setEnds} />
      <Action
        label="Create Room"
        disabled={!songId || !title.trim()}
        run={async () => {
          if (!validAmount(price))
            throw new Error(
              "Enter a positive USDC price with up to 6 decimal places.",
            );
          const start = new Date(starts);
          const end = new Date(ends);
          if (
            !Number.isFinite(start.getTime()) ||
            !Number.isFinite(end.getTime()) ||
            end <= start ||
            end.getTime() <= Date.now()
          )
            throw new Error(
              "Choose valid access dates. The end must follow the start and be in the future.",
            );
          const room = await request<Room>("/api/rooms", {
            method: "POST",
            authenticated: true,
            body: {
              songId,
              title: title.trim(),
              description,
              price,
              accessStartsAt: start.toISOString(),
              accessEndsAt: end.toISOString(),
            },
          });
          router.replace(`/room/${room.id}`);
        }}
      />
    </Screen>
  );
}
