import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Artwork,
  Heading,
  ResourceState,
  Screen,
  s,
} from "../../src/components/ui";
import { Songs } from "../../src/components/Songs";
import { useResource } from "../../src/lib/useResource";
import { artistName, type Artist, type Song } from "../../src/lib/types";
export default function ArtistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const artist = useResource<Artist>(`/api/artist/${encodeURIComponent(id)}`);
  const songs = useResource<Song[]>(
    `/api/song?artistId=${encodeURIComponent(id)}`,
  );
  return (
    <Screen>
      <ResourceState
        loading={artist.loading}
        error={artist.error}
        retry={artist.reload}
      />
      {artist.data && (
        <>
          <Artwork
            uri={artist.data.pageCover || artist.data.profileImage}
            style={{ width: "100%", height: 240, borderRadius: 18 }}
          />
          <Heading
            title={artistName(artist.data)}
            subtitle="Independent artist · AudioBlocks"
          />
          {artist.data.bio && <Text style={s.text}>{artist.data.bio}</Text>}
        </>
      )}
      <Heading title="Discography" />
      <ResourceState
        loading={songs.loading}
        error={songs.error}
        retry={songs.reload}
        empty={
          !songs.loading &&
          !songs.error &&
          !songs.data?.length &&
          "This artist has no released tracks yet."
        }
      />
      <Songs songs={songs.data || []} />
    </Screen>
  );
}
