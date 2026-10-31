import { useState } from "react";
import { Text, View } from "react-native";
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
import { SignInCard } from "../src/components/SignInCard";
import { useSession } from "../src/lib/session";
import { useResource } from "../src/lib/useResource";
import { collaborationShares } from "../src/lib/logic";
import {
  artistName,
  type Artist,
  type Collection,
  type Song,
} from "../src/lib/types";
type Invite = {
  collectionId: string;
  title: string;
  splitBps: number;
  invitedBy: Artist | null;
};
export default function Collaborations() {
  const { profile, request } = useSession();
  const isArtist = profile?.role === "artist";
  const collections = useResource<Collection[]>(
    isArtist ? "/api/collections/mine" : null,
  );
  const invites = useResource<Invite[]>(
    isArtist ? "/api/collections/invites/pending" : null,
  );
  const artists = useResource<Artist[]>(isArtist ? "/api/pool/artists" : null);
  const songs = useResource<Song[]>(
    isArtist ? `/api/song?artistId=${profile.id}` : null,
  );
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState<
    { userId: string; splitBps: number }[]
  >([]);
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [creatorSplit, setCreatorSplit] = useState("50");
  const [selected, setSelected] = useState<string | null>(null);
  const refresh = () => {
    collections.reload();
    invites.reload();
  };
  if (!profile)
    return (
      <Screen>
        <SignInCard />
      </Screen>
    );
  if (!isArtist)
    return (
      <Screen>
        <Text style={s.text}>Join as an artist to collaborate on music.</Text>
      </Screen>
    );
  return (
    <Screen>
      <Heading
        title="Create together"
        subtitle="Agree on your shares. Payouts split automatically when a collaboration is active."
      />
      <ResourceState
        loading={invites.loading}
        error={invites.error}
        retry={invites.reload}
      />
      {invites.data?.map((invite) => (
        <Card key={invite.collectionId}>
          <Text style={s.label}>{invite.title}</Text>
          <Text style={s.muted}>
            {artistName(invite.invitedBy)} invited you · Your share:{" "}
            {invite.splitBps / 100}%
          </Text>
          <Action
            label="Accept invitation"
            run={() =>
              request(`/api/collections/${invite.collectionId}/respond`, {
                method: "POST",
                authenticated: true,
                body: { status: "accepted" },
              })
            }
            onSuccess={refresh}
          />
          <Action
            secondary
            label="Decline"
            run={() =>
              request(`/api/collections/${invite.collectionId}/respond`, {
                method: "POST",
                authenticated: true,
                body: { status: "declined" },
              })
            }
            onSuccess={refresh}
          />
        </Card>
      ))}
      <Heading title="Your collaborations" />
      <ResourceState
        loading={collections.loading}
        error={collections.error}
        retry={collections.reload}
        empty={
          !collections.loading &&
          !collections.error &&
          !collections.data?.length &&
          "Create your first collaboration below."
        }
      />
      {collections.data?.map((collection) => (
        <Card key={collection.id}>
          <Text style={s.title}>{collection.title}</Text>
          <Text style={s.muted}>{collection.status}</Text>
          {collection.members.map((member) => (
            <Text key={member.userId} style={s.muted}>
              {artistName(member)} · {member.splitBps / 100}% · {member.status}
            </Text>
          ))}
          {collection.status === "active" && (
            <Button
              secondary
              onPress={() =>
                setSelected(selected === collection.id ? null : collection.id)
              }
            >
              {selected === collection.id
                ? "Hide tracks"
                : "Add one of your tracks"}
            </Button>
          )}
          {selected === collection.id && (
            <>
              <ResourceState
                loading={songs.loading}
                error={songs.error}
                retry={songs.reload}
                empty={
                  !songs.loading &&
                  !songs.error &&
                  !songs.data?.length &&
                  "Upload a track before attaching it."
                }
              />
              {songs.data?.map((song) => (
                <Action
                  key={song.id}
                  secondary
                  label={`Attach ${song.title}`}
                  run={() =>
                    request(`/api/collections/${collection.id}/songs`, {
                      method: "POST",
                      authenticated: true,
                      body: { songId: song.id },
                    })
                  }
                  onSuccess={() => setSelected(null)}
                />
              ))}
            </>
          )}
        </Card>
      ))}
      <Card>
        <Heading title="New collaboration" />
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field
          label="Your share (%)"
          keyboardType="decimal-pad"
          value={creatorSplit}
          onChangeText={setCreatorSplit}
        />
        <Text style={s.muted}>
          Select artists, then enter their shares. All shares must total 100%.
        </Text>
        <ResourceState
          loading={artists.loading}
          error={artists.error}
          retry={artists.reload}
        />
        {artists.data
          ?.filter((a) => a.id !== profile.id)
          .map((artist) => {
            const included = members.some((m) => m.userId === artist.id);
            return (
              <View key={artist.id} style={{ gap: 10 }}>
                <Button
                  secondary={!included}
                  onPress={() =>
                    setMembers((prev) =>
                      included
                        ? prev.filter((m) => m.userId !== artist.id)
                        : [...prev, { userId: artist.id, splitBps: 0 }],
                    )
                  }
                >
                  {included ? "✓ " : ""}
                  {artistName(artist)}
                </Button>
                {included && (
                  <Field
                    label={`${artistName(artist)} share (%)`}
                    value={splits[artist.id] || ""}
                    onChangeText={(v) =>
                      setSplits((prev) => ({ ...prev, [artist.id]: v }))
                    }
                    keyboardType="decimal-pad"
                  />
                )}
              </View>
            );
          })}
        <Action
          label="Send collaboration invites"
          disabled={!title.trim() || !members.length}
          run={async () => {
            const shares = collaborationShares(
              creatorSplit,
              members.map((m) => ({
                userId: m.userId,
                percent: splits[m.userId] || "",
              })),
            );
            await request("/api/collections", {
              method: "POST",
              authenticated: true,
              body: { title: title.trim(), ...shares },
            });
            setTitle("");
            setMembers([]);
            setSplits({});
            refresh();
          }}
        />
      </Card>
    </Screen>
  );
}
