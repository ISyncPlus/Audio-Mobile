import { Card, s } from "./ui";
import { Text } from "react-native";
export function LoginForm() {
  return (
    <Card>
      <Text style={s.text}>
        Sign-in is available in the iOS and Android development builds.
      </Text>
      <Text style={s.muted}>
        Browser preview supports browsing the public screens. Configure the
        mobile Privy client in Audio-Mobile/.env before building.
      </Text>
    </Card>
  );
}
