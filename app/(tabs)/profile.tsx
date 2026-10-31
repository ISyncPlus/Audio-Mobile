import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useResource } from "../../src/lib/useResource";
import { useSession } from "../../src/lib/session";
import {
  Artwork,
  Action,
  Banner,
  Button,
  Card,
  Heading,
  ResourceState,
  Screen,
  s,
} from "../../src/components/ui";
import { SignInCard } from "../../src/components/SignInCard";
export default function Profile() {
  const { profile, logout, sync, error, syncing } = useSession();
  const wallet = useResource<{ balance: string; walletAddress: string }>(
    profile ? "/api/wallet/balance" : null,
  );
  if (!profile)
    return (
      <Screen>
        <Banner
          title="Your sound. Your space."
          subtitle="Save your favorites and support the artists you love."
        />
        <ResourceState loading={syncing} error={error} />
        {error && <Action label="Retry account setup" run={() => sync()} />}
        <SignInCard />
        <Button secondary onPress={() => router.push("/welcome")}>
          About AudioBlocks
        </Button>
      </Screen>
    );
  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 12 }}>
        <Artwork
          uri={profile.profileImage}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text style={s.title}>
          {profile.username ||
            profile.name ||
            profile.email?.split("@")[0] ||
            "Music lover"}
        </Text>
        <Text style={s.muted}>{profile.role.toUpperCase()}</Text>
      </View>
      {profile.bio && <Text style={s.text}>{profile.bio}</Text>}
      <Card>
        <Heading title="Your wallet" subtitle="USDC on Arc" />
        <Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>
          {wallet.data?.balance ?? "—"} USDC
        </Text>
        <Text selectable style={s.muted}>
          {profile.walletAddress}
        </Text>
        <Action
          secondary
          label="Copy wallet address"
          run={() => Clipboard.setStringAsync(profile.walletAddress || "")}
        />
        <ResourceState
          loading={wallet.loading}
          error={wallet.error}
          retry={wallet.reload}
        />
      </Card>
      <View style={s.row}>
        {[
          ["Rewards", profile.rewardPoints],
          ["Streams", profile.totalStreams],
          ["Listeners", profile.uniqueListeners],
        ].map(([label, value]) => (
          <Card key={label} style={{ flex: 1, padding: 12 }}>
            <Text style={s.title}>{value || 0}</Text>
            <Text style={[s.muted, { fontSize: 10 }]}>{label}</Text>
          </Card>
        ))}
      </View>
      {profile.role === "artist" ? (
        <>
          <Button onPress={() => router.push("/artist-hub")}>
            Open Artist Hub ↗
          </Button>
          <Button secondary onPress={() => router.push("/edit-profile")}>
            Edit profile
          </Button>
        </>
      ) : profile.role === "listener" ? (
        <Card>
          <Heading
            title="Make your voice heard"
            subtitle="Become an artist to release music and host Rooms."
          />
          <Action
            label="Join as Artist"
            run={() => sync("artist")}
            onSuccess={() => router.push("/artist-hub")}
          />
          <Text style={s.muted}>
            Switches your account to artist, including its wallet and artist
            features.
          </Text>
        </Card>
      ) : (
        <Button onPress={() => router.push("/admin")}>Manage rounds</Button>
      )}
      <Button secondary onPress={() => router.push("/welcome")}>
        About AudioBlocks
      </Button>
      <Action
        secondary
        label="Sign out"
        run={logout}
        onSuccess={() => {
          Alert.alert("Signed out");
          router.replace("/");
        }}
      />
    </Screen>
  );
}
