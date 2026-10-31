import { useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  Action,
  Banner,
  Button,
  Card,
  Chips,
  Field,
  Heading,
  ResourceState,
  Screen,
  colors,
  s,
} from "../src/components/ui";
import { SignInCard } from "../src/components/SignInCard";
import { useSession } from "../src/lib/session";
import { useResource } from "../src/lib/useResource";
import type { Stats } from "../src/lib/types";
export default function ArtistHub() {
  const { profile, sync, request } = useSession();
  const [range, setRange] = useState("28d");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generation, setGeneration] = useState(false);
  const stats = useResource<Stats>(
    profile?.role === "artist" ? `/api/song/stats/mine?range=${range}` : null,
  );
  useFocusEffect(
    useCallback(() => {
      stats.reload();
    }, [stats.reload]),
  );
  if (!profile)
    return (
      <Screen>
        <Banner
          title="Own your sound."
          subtitle="Release music. Build your audience. Get paid directly."
        />
        <SignInCard />
      </Screen>
    );
  if (profile.role !== "artist")
    return (
      <Screen>
        <Banner
          title="Your music belongs here."
          subtitle="Create an artist account to release songs and host exclusive Rooms."
        />
        {profile.role === "listener" && (
          <Action label="Join as Artist" run={() => sync("artist")} />
        )}
      </Screen>
    );
  return (
    <Screen>
      <Image
        source={require("../assets/artist-hub.png")}
        style={{ width: "100%", height: 200, borderRadius: 20 }}
      />
      <Banner
        eyebrow="ARTIST HUB"
        title="Monetize, Grow & Engage"
        subtitle="Build a real music career with tools designed to help you connect with your fans and get paid."
      >
        <Button onPress={() => router.push("/upload")}>Upload a track ↗</Button>
      </Banner>
      <View style={{ gap: 12 }}>
        <Button secondary onPress={() => router.push("/create-room")}>
          Create a listening Room
        </Button>
        <Button secondary onPress={() => router.push("/collaborations")}>
          Your collaborations
        </Button>
        <Button secondary onPress={() => router.push("/edit-profile")}>
          Edit artist profile
        </Button>
      </View>
      <Heading title="Artist insights" />
      <Chips
        items={["7d", "28d", "12m"]}
        selected={range}
        onSelect={setRange}
      />
      <ResourceState
        loading={stats.loading}
        error={stats.error}
        retry={stats.reload}
      />
      {stats.data && (
        <>
          <View style={s.row}>
            <Card style={{ flex: 1 }}>
              <Text style={s.title}>{stats.data.totalSongs}</Text>
              <Text style={s.muted}>Total tracks</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={s.title}>{stats.data.totalStreams}</Text>
              <Text style={s.muted}>Total streams</Text>
            </Card>
          </View>
          <Card>
            <Text style={s.label}>
              {stats.data.rangeStreams} streams in this period
            </Text>
            <View
              style={[s.row, { alignItems: "flex-end", height: 100, gap: 3 }]}
            >
              {stats.data.trend.map((point) => (
                <View
                  key={point.date}
                  accessibilityLabel={`${point.date}: ${point.streams} streams`}
                  style={{
                    flex: 1,
                    minHeight: 3,
                    height: Math.max(
                      3,
                      (point.streams /
                        Math.max(
                          1,
                          ...stats.data!.trend.map((p) => p.streams),
                        )) *
                        100,
                    ),
                    backgroundColor: colors.purple,
                    borderRadius: 3,
                  }}
                />
              ))}
            </View>
            <Text style={s.muted}>
              {stats.data.trend[0]?.date} — {stats.data.trend.at(-1)?.date}
            </Text>
          </Card>
          {stats.data.topCountries.length > 0 && (
            <Card>
              <Text style={s.label}>Your audience</Text>
              {stats.data.topCountries.map((country) => (
                <View key={country.country} style={s.between}>
                  <Text style={s.muted}>{country.country}</Text>
                  <Text style={s.label}>{country.streams} streams</Text>
                </View>
              ))}
            </Card>
          )}
          <Heading title="Your tracks" />
          {stats.data.songs.map((song) => (
            <Card key={song.id}>
              <View style={s.between}>
                <Text style={[s.label, { flex: 1 }]}>{song.title}</Text>
                <Text style={s.muted}>{song.plays} streams</Text>
              </View>
              <Text style={{ color: colors.soft, fontSize: 12 }}>
                {song.status.replace("_", " ")}
              </Text>
            </Card>
          ))}
        </>
      )}
      <Card>
        <Heading
          title="AI music generation"
          subtitle="Bring an idea to life with a short generated track."
        />
        <Field label="Track title" value={title} onChangeText={setTitle} />
        <Field
          label="Describe the sound"
          placeholder="Dreamy Afrobeat with warm guitar and soft percussion"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <Action
          label="Generate a 15-second track"
          disabled={!title.trim() || !prompt.trim() || generation}
          run={() =>
            request("/api/song/ai/generate", {
              method: "POST",
              body: {
                title: title.trim(),
                prompt: prompt.trim(),
                durationSeconds: 15,
              },
              authenticated: true,
            })
          }
          onSuccess={() => {
            setGeneration(true);
            stats.reload();
          }}
        />
        {generation && (
          <Text style={s.muted}>
            Generation queued. Refresh your insights to see its progress.
          </Text>
        )}
      </Card>
    </Screen>
  );
}
