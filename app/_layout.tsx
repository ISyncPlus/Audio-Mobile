import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../src/lib/auth";
import { PlayerProvider } from "../src/lib/player";
import { colors } from "../src/components/ui";
import { ActivityIndicator, Platform, View } from "react-native";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { MiniPlayer } from "../src/components/MiniPlayer";
export default function RootLayout() {
  const segments = useSegments();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fontsLoaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.pink} />
      </View>
    );
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: Platform.OS === "web" ? 440 : undefined,
          alignSelf: "center",
        }}
      >
        <AuthProvider>
          <PlayerProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: "white",
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ title: "AudioBlocks" }} />
              <Stack.Screen
                name="sign-in"
                options={{ title: "Welcome back", presentation: "modal" }}
              />
              <Stack.Screen
                name="player"
                options={{ title: "Now playing", presentation: "modal" }}
              />
              <Stack.Screen
                name="room/[id]"
                options={{ title: "Listening Room" }}
              />
              <Stack.Screen name="artist/[id]" options={{ title: "Artist" }} />
              <Stack.Screen
                name="artist-hub"
                options={{ title: "Artist Hub" }}
              />
              <Stack.Screen
                name="upload"
                options={{ title: "Upload a track" }}
              />
              <Stack.Screen
                name="create-room"
                options={{ title: "Create a Room" }}
              />
              <Stack.Screen
                name="collaborations"
                options={{ title: "Collaborations" }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{ title: "Edit profile" }}
              />
              <Stack.Screen name="admin" options={{ title: "Manage rounds" }} />
            </Stack>
            {segments[0] !== "(tabs)" && segments[0] !== "player" && (
              <SafeAreaView
                edges={["bottom"]}
                style={{ backgroundColor: colors.bg }}
              >
                <MiniPlayer />
              </SafeAreaView>
            )}
          </PlayerProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
