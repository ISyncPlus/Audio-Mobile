import { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Crypto from "expo-crypto";
import {
  Action,
  Button,
  Card,
  Chips,
  Field,
  ResourceState,
  Screen,
  s,
} from "../src/components/ui";
import { useSession } from "../src/lib/session";
import { SignInCard } from "../src/components/SignInCard";
import { songMoods } from "../src/lib/logic";
import { appendAsset, uploadChunks } from "../src/lib/upload";
export default function Upload() {
  const { unreleased } = useLocalSearchParams<{ unreleased?: string }>();
  const { profile, request } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Afro");
  const [mood, setMood] = useState("chill");
  const [composers, setComposers] = useState("");
  const [audio, setAudio] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );
  const [cover, setCover] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );
  const [stage, setStage] = useState("");
  const [busy, setBusy] = useState(false);
  const [songId, setSongId] = useState<string | null>(null);
  const select = async (type: "audio/*" | "image/*") => {
    const result = await DocumentPicker.getDocumentAsync({
      type,
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      if (
        !file.size ||
        file.size > (type === "image/*" ? 8 : 250) * 1024 * 1024
      )
        throw new Error(
          type === "image/*"
            ? "Choose an image under 8MB."
            : "Choose a nonempty audio file under 250MB.",
        );
      type === "audio/*" ? setAudio(file) : setCover(file);
    }
  };
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
          Join as an artist from your profile to upload music.
        </Text>
      </Screen>
    );
  if (songId)
    return (
      <Screen>
        <Card>
          <Text style={s.title}>Track submitted</Text>
          <Text style={s.muted}>
            Your track is processing. It will be ready after the server finishes
            transcoding.
          </Text>
          <Button
            onPress={() =>
              router.replace(
                unreleased === "1"
                  ? { pathname: "/create-room", params: { songId } }
                  : "/artist-hub",
              )
            }
          >
            {unreleased === "1" ? "Create its Room" : "Go to Artist Hub"}
          </Button>
        </Card>
      </Screen>
    );
  return (
    <Screen>
      <Text style={s.muted}>
        {unreleased === "1"
          ? "This track stays hidden from the public catalog. Create its Room after uploading."
          : "Release your next track. It appears in Explore after processing."}
      </Text>
      <Field
        label="Track title"
        value={title}
        onChangeText={setTitle}
        editable={!busy}
      />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        editable={!busy}
      />
      <Field
        label="Genre"
        value={genre}
        onChangeText={setGenre}
        editable={!busy}
      />
      <Text style={s.label}>Mood</Text>
      <Chips
        items={songMoods}
        selected={mood}
        onSelect={(v) => {
          if (!busy) setMood(v);
        }}
      />
      <Field
        label="Composers (optional)"
        value={composers}
        onChangeText={setComposers}
        editable={!busy}
      />
      <Action
        secondary
        label={audio?.name || "Choose audio file"}
        disabled={busy}
        run={() => select("audio/*")}
      />
      <Action
        secondary
        label={cover?.name || "Choose cover image"}
        disabled={busy}
        run={() => select("image/*")}
      />
      {stage && <Text style={s.text}>{stage}</Text>}
      <Action
        label="Upload track"
        disabled={
          !audio ||
          !cover ||
          !title.trim() ||
          !description.trim() ||
          !genre.trim()
        }
        run={async () => {
          if (!audio || !cover) return;
          setBusy(true);
          try {
            const fileId = Crypto.randomUUID();
            const totalChunks = await uploadChunks(
              audio,
              fileId,
              (body) =>
                request("/api/song/upload/chunk", {
                  method: "POST",
                  body,
                  authenticated: true,
                }),
              (value) => setStage(`Uploading audio · ${value}%`),
            );
            setStage("Uploading cover…");
            const form = new FormData();
            form.append("fileId", fileId);
            appendAsset(form, "cover", cover);
            const result = await request<{ cover: string }>(
              "/api/song/upload/cover",
              { method: "POST", body: form, authenticated: true },
            );
            setStage("Submitting track…");
            const song = await request<{ id: string }>(
              "/api/song/upload/finalize",
              {
                method: "POST",
                authenticated: true,
                body: {
                  fileId,
                  totalChunks,
                  title: title.trim(),
                  description: description.trim(),
                  genre: genre.trim(),
                  mood: [mood],
                  composers,
                  coverArtPath: result.cover,
                  unreleased: unreleased === "1",
                },
              },
            );
            setSongId(song.id);
            setStage("");
          } catch (e) {
            setStage(
              "Upload was interrupted. Your selected files are still here; try again.",
            );
            throw e;
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
