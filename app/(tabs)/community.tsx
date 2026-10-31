import { useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  Action,
  Artwork,
  Banner,
  Card,
  Chips,
  Heading,
  ResourceState,
  Screen,
  colors,
  s,
} from "../../src/components/ui";
import { Payment } from "../../src/components/Payment";
import { SignInCard } from "../../src/components/SignInCard";
import { useSession } from "../../src/lib/session";
import { useResource } from "../../src/lib/useResource";
import {
  artistName,
  type Round,
  type Song,
  type Artist,
} from "../../src/lib/types";
type ClosedRound = {
  id: string;
  roundNumber: number;
  totalDeposited: string;
  closedAt: string;
};
type Result = {
  rank: number;
  song: { title: string } | null;
  artist: Artist;
  voteCount: number;
  amountPaid: string;
};
export default function Community() {
  const { profile, request } = useSession();
  const current = useResource<{ round: Round | null; poolBalance: string }>(
    "/api/pool/current",
  );
  const songs = useResource<Song[]>("/api/pool/songs");
  const standings = useResource<Song[]>("/api/pool/current-standings");
  const rounds = useResource<ClosedRound[]>("/api/pool/rounds");
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const results = useResource<Result[]>(
    selectedRound ? `/api/pool/rounds/${selectedRound}/results` : null,
  );
  const [tab, setTab] = useState("Vote");
  useFocusEffect(
    useCallback(() => {
      current.reload();
    }, [current.reload]),
  );
  const refresh = () => {
    current.reload();
    standings.reload();
    rounds.reload();
  };
  return (
    <Screen>
      <Banner
        eyebrow="POWERED BY THE COMMUNITY"
        title="Your vote. Their next chapter."
        subtitle="Vote for a song each round. The top five artists share the USDC pool."
      >
        <Text style={{ color: colors.soft, fontSize: 26, fontWeight: "700" }}>
          {current.data?.poolBalance ?? "—"} USDC
        </Text>
        <Text style={s.muted}>
          {current.data?.round
            ? `Round ${current.data.round.roundNumber} · Closes ${current.data.round.closesAt ? new Date(current.data.round.closesAt).toLocaleString() : "when the admin closes it"}`
            : current.data
              ? "No voting round is currently open."
              : current.loading
                ? "Loading the pool…"
                : "Pool status is unavailable."}
        </Text>
      </Banner>
      <ResourceState
        loading={current.loading}
        error={current.error}
        retry={current.reload}
      />
      <Chips
        items={["Vote", "Fund Pool", "Leaderboard"]}
        selected={tab}
        onSelect={setTab}
      />
      {tab === "Vote" && (
        <>
          <Heading
            title="Back your favorite"
            subtitle="One vote per round. You can change your choice while voting is open."
          />
          {!profile && <SignInCard />}
          <ResourceState
            loading={songs.loading}
            error={songs.error}
            retry={songs.reload}
            empty={
              !songs.loading &&
              !songs.error &&
              !songs.data?.length &&
              "No songs are available for voting yet."
            }
          />
          {songs.data?.map((song) => (
            <Card key={song.id}>
              <View style={s.row}>
                <Artwork
                  uri={song.coverArtPath}
                  style={{ width: 54, height: 54, borderRadius: 9 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{song.title}</Text>
                  <Text style={s.muted}>{artistName(song.artist)}</Text>
                </View>
              </View>
              <Action
                label={
                  current.data?.round?.votedSongId === song.id
                    ? "Your vote ✓"
                    : "Vote for this track"
                }
                disabled={
                  !current.data?.round ||
                  profile?.role !== "listener" ||
                  current.data.round.votedSongId === song.id
                }
                run={() =>
                  request("/api/pool/vote", {
                    method: "POST",
                    body: { songId: song.id },
                    authenticated: true,
                  })
                }
                onSuccess={refresh}
              />
            </Card>
          ))}
        </>
      )}
      {tab === "Fund Pool" &&
        (profile ? <Payment onComplete={refresh} /> : <SignInCard />)}
      {tab === "Leaderboard" && (
        <>
          <Heading title="Current standings" />
          <ResourceState
            loading={standings.loading}
            error={standings.error}
            retry={standings.reload}
            empty={
              !standings.loading &&
              !standings.error &&
              !standings.data?.length &&
              "Votes will appear here when a round is underway."
            }
          />
          {standings.data?.map((song, i) => (
            <Card key={song.id}>
              <View style={s.between}>
                <Text
                  style={{
                    color: colors.pink,
                    fontWeight: "800",
                    fontSize: 24,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{song.title}</Text>
                  <Text style={s.muted}>{artistName(song.artist)}</Text>
                </View>
                <Text style={s.label}>{song.voteCount || 0} votes</Text>
              </View>
            </Card>
          ))}
          <Heading title="Past rounds" />
          <ResourceState
            loading={rounds.loading}
            error={rounds.error}
            retry={rounds.reload}
            empty={
              !rounds.loading &&
              !rounds.error &&
              !rounds.data?.length &&
              "Results are published when a round closes."
            }
          />
          {rounds.data?.map((round) => (
            <Action
              key={round.id}
              secondary
              label={`Round ${round.roundNumber} · ${round.totalDeposited} USDC deposited`}
              run={async () => setSelectedRound(round.id)}
            />
          ))}
          <ResourceState
            loading={results.loading}
            error={results.error}
            retry={results.reload}
          />
          {results.data?.map((result) => (
            <Card key={result.rank}>
              <Text style={s.label}>
                #{result.rank} ·{" "}
                {result.song?.title || artistName(result.artist)}
              </Text>
              <Text style={s.muted}>
                {result.voteCount} votes · {result.amountPaid} USDC paid
              </Text>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
