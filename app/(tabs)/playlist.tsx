import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Banner, ResourceState, Screen } from "../../src/components/ui";
import { Songs } from "../../src/components/Songs";
import { useResource } from "../../src/lib/useResource";
import { useSession } from "../../src/lib/session";
import type { Song } from "../../src/lib/types";
import { SignInCard } from "../../src/components/SignInCard";
export default function Playlist() {
  const { profile } = useSession();
  const songs = useResource<Song[]>(profile ? "/api/song" : null);
  useFocusEffect(
    useCallback(() => {
      songs.reload();
    }, [songs.reload]),
  );
  const liked = songs.data?.filter((s) => s.isLiked) || [];
  return (
    <Screen>
      <Banner
        title="My Playlist"
        palette={["#6E0596", "#580577"]}
        subtitle={`${liked.length} liked ${liked.length === 1 ? "song" : "songs"} · Your sound, in one place.`}
      />
      {!profile ? (
        <SignInCard />
      ) : (
        <>
          <ResourceState
            loading={songs.loading}
            error={songs.error}
            retry={songs.reload}
            empty={
              !songs.loading &&
              !songs.error &&
              !liked.length &&
              "Tap the heart on a track to add it to your playlist."
            }
          />
          <Songs songs={liked} />
        </>
      )}
    </Screen>
  );
}
