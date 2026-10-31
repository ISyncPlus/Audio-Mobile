import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Artwork,
  Banner,
  Chips,
  Field,
  ResourceState,
  Screen,
  colors,
  s,
} from "../../src/components/ui";
import { useResource } from "../../src/lib/useResource";
import { artistName, type Room } from "../../src/lib/types";
export default function Rooms() {
  const rooms = useResource<Room[]>("/api/rooms");
  const [search, setSearch] = useState("");
  const [state, setState] = useState("All");
  const results = (rooms.data || []).filter(
    (r) =>
      (state === "All" ||
        r.state === (state === "Open" ? "live" : state.toLowerCase())) &&
      `${r.title} ${artistName(r.artist)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <Screen>
      <Banner
        eyebrow="EXCLUSIVE LISTENING"
        title="Virtual listening parties"
        subtitle="Artists open a room and drop an unreleased track for a limited window. Buy a ticket to unlock it, listen, and leave your review."
      />
      <Field
        placeholder="Find a room or artist"
        value={search}
        onChangeText={setSearch}
      />
      <Chips
        items={["All", "Open", "Upcoming", "Closed"]}
        selected={state}
        onSelect={setState}
      />
      <ResourceState
        loading={rooms.loading}
        error={rooms.error}
        retry={rooms.reload}
        empty={
          !rooms.loading &&
          !rooms.error &&
          !results.length &&
          "No Rooms here yet. Check back for new releases."
        }
      />
      {results.map((room) => (
        <Pressable
          key={room.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${room.title}`}
          onPress={() => router.push(`/room/${room.id}`)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <Artwork
            uri={room.song?.coverArtPath}
            style={{ width: "100%", height: 200 }}
          />
          <View style={{ padding: 18, gap: 8 }}>
            <View style={s.between}>
              <Text style={[s.title, { fontSize: 20, flex: 1 }]}>
                {room.title}
              </Text>
              <Text
                style={{
                  color: colors.soft,
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
              >
                {room.state}
              </Text>
            </View>
            <Text style={s.muted}>{artistName(room.artist)}</Text>
            <View style={s.between}>
              <Text style={s.label}>{room.price} USDC</Text>
              <Text style={{ color: colors.soft }}>Unlock ↗</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
