import { useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Banner,
  Button,
  Card,
  Chips,
  Field,
  Heading,
  Icon,
  IconButton,
  ResourceState,
  Screen,
  colors,
  s,
  Action,
  Artwork,
} from "../../src/components/ui";
import { Songs } from "../../src/components/Songs";
import { useResource } from "../../src/lib/useResource";
import { useSession } from "../../src/lib/session";
import { filterSongs } from "../../src/lib/logic";
import { artistName, type Artist, type Song } from "../../src/lib/types";
const categories = [
  { name: "Pop", image: require("../../assets/category1.jpg") },
  { name: "Contemporary", image: require("../../assets/category2.jpg") },
  { name: "Rock", image: require("../../assets/category3.jpg") },
  { name: "Afro", image: require("../../assets/category4.jpg") },
  { name: "Jazz", image: require("../../assets/category5.jpg") },
];
export default function Explore() {
  const songs = useResource<Song[]>("/api/song");
  const artists = useResource<Artist[]>("/api/pool/artists");
  const { profile, request } = useSession();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [mood, setMood] = useState("");
  const [matches, setMatches] = useState<Song[] | null>(null);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const results = filterSongs(songs.data || [], search, genre);
  return (
    <Screen>
      <View style={s.between}>
        <View>
          <Text style={s.muted}>
            {greeting}
            {profile
              ? `, ${profile.username || profile.name || profile.email?.split("@")[0] || "music lover"}`
              : ""}
          </Text>
          <Text style={[s.title, { marginTop: 4 }]}>Explore your sound.</Text>
        </View>
        <IconButton
          name="person-circle-outline"
          label="Your profile"
          onPress={() => router.push("/profile")}
        />
      </View>
      <Field
        placeholder="Search artists, songs or genres"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {!profile && (
        <Banner
          eyebrow="DISCOVER • LISTEN • SUPPORT"
          title={"Discover Tomorrow’s\nTalent Today"}
          subtitle="Ad-free streaming where listeners vote each round and fund a community pool — the artists with the most votes split it, paid out in USDC."
        >
          <View style={{ gap: 10 }}>
            <Button onPress={() => router.push("/sign-in")}>
              Stream Now ↗
            </Button>
            <Button secondary onPress={() => router.push("/welcome")}>
              Discover AudioBlocks
            </Button>
          </View>
        </Banner>
      )}
      <View style={{ gap: 12 }}>
        <Heading
          title="Mood Match"
          action={<Icon name="sparkles-outline" color={colors.purple} />}
        />
        <Card>
          <Text style={s.label}>How are you feeling right now?</Text>
          <Text style={s.muted}>
            Describe your mood and we’ll find songs that fit it.
          </Text>
          <Field
            placeholder="Tired but hopeful, ready to dance…"
            value={mood}
            onChangeText={setMood}
          />
          <Chips
            items={[
              "Happy and upbeat",
              "Need energy",
              "Want to chill",
              "Feeling romantic",
            ]}
            selected={mood}
            onSelect={setMood}
          />
          <Action
            label="Find my vibe"
            disabled={!mood.trim()}
            run={async () =>
              setMatches(
                await request<Song[]>("/api/song/mood-match", {
                  method: "POST",
                  body: { mood: mood.trim() },
                  timeout: 120000,
                }),
              )
            }
          />
          {matches && (
            <>
              <ResourceState
                empty={
                  !matches.length && "No matches yet. Try a different mood."
                }
              />
              <Songs songs={matches} horizontal />
            </>
          )}
        </Card>
      </View>
      <View style={{ gap: 16 }}>
        <Heading
          title={search ? "Search results" : "Tracks"}
          action={
            <IconButton
              name="refresh-outline"
              label="Refresh tracks"
              onPress={songs.reload}
            />
          }
        />
        <Chips
          items={["All", ...categories.map((c) => c.name)]}
          selected={genre}
          onSelect={setGenre}
        />
        <ResourceState
          loading={songs.loading}
          error={songs.error}
          retry={songs.reload}
          empty={
            !songs.loading &&
            !songs.error &&
            !results.length &&
            "No tracks found. Try another search or check back soon."
          }
        />
        <Songs songs={results} />
      </View>
      <View style={{ gap: 16 }}>
        <Heading title="Category" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {categories.map((c) => (
            <Pressable
              key={c.name}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${c.name}`}
              onPress={() => {
                setSearch("");
                setGenre(c.name);
              }}
            >
              <ImageBackground
                source={c.image}
                imageStyle={{ borderRadius: 12 }}
                style={{
                  width: 126,
                  height: 76,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#0006",
                    borderRadius: 12,
                  }}
                />
                <Text style={s.label}>{c.name}</Text>
              </ImageBackground>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ gap: 16 }}>
        <Heading title="Artists" />
        <ResourceState
          loading={artists.loading}
          error={artists.error}
          retry={artists.reload}
          empty={
            !artists.loading &&
            !artists.error &&
            !artists.data?.length &&
            "Artists will appear here when they join."
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        >
          {artists.data?.map((artist) => (
            <Pressable
              key={artist.id}
              accessibilityRole="button"
              onPress={() => router.push(`/artist/${artist.id}`)}
              style={{ width: 136, gap: 10 }}
            >
              <Artwork
                uri={artist.profileImage}
                style={{ width: 136, height: 136, borderRadius: 70 }}
              />
              <Text
                numberOfLines={1}
                style={[s.label, { textAlign: "center" }]}
              >
                {artistName(artist)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <Banner
        eyebrow="A CLOSER LISTEN"
        title="Exclusive Rooms"
        subtitle="Unlock unreleased tracks directly from your favorite artists."
      >
        <Button secondary onPress={() => router.push("/rooms")}>
          Explore Rooms ↗
        </Button>
      </Banner>
    </Screen>
  );
}
