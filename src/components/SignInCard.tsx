import { router } from "expo-router";
import { Text } from "react-native";
import { Button, Card, s } from "./ui";
export function SignInCard() {
  return (
    <Card>
      <Text style={s.title}>Make it yours.</Text>
      <Text style={s.muted}>
        Sign in to save tracks, support artists, and join the community.
      </Text>
      <Button onPress={() => router.push("/sign-in")}>Sign in</Button>
    </Card>
  );
}
