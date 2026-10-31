import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Banner,
  Button,
  Card,
  Heading,
  Screen,
  colors,
  s,
} from "../src/components/ui";
export default function Welcome() {
  return (
    <Screen>
      <View
        style={{ height: 280, alignItems: "center", justifyContent: "center" }}
      >
        <Image
          source={require("../assets/frame2.jpg")}
          style={{
            position: "absolute",
            width: 210,
            height: 210,
            borderRadius: 20,
            transform: [
              { rotate: "-9deg" },
              { translateX: -24 },
              { translateY: -20 },
            ],
            borderWidth: 1,
            borderColor: colors.purple,
          }}
        />
        <Image
          source={require("../assets/frame1.jpg")}
          style={{
            width: 210,
            height: 210,
            borderRadius: 20,
            transform: [
              { rotate: "5deg" },
              { translateX: 24 },
              { translateY: 20 },
            ],
            borderWidth: 1,
            borderColor: colors.soft,
          }}
        />
      </View>
      <Banner
        eyebrow="LISTEN DIFFERENTLY"
        title={"Discover Tomorrow’s\nTalent Today"}
        subtitle="Ad-free streaming where listeners vote each round and fund a community pool — the artists with the most votes split it, paid out in USDC."
      >
        <Button onPress={() => router.replace("/")}>Stream Now ↗</Button>
        <Button secondary onPress={() => router.push("/artist-hub")}>
          Join as Artist ↗
        </Button>
      </Banner>
      <Heading
        title="Key Features Overview"
        subtitle="For artists and music lovers alike."
      />
      {[
        [
          "Vote & Payout Pool",
          "Vote each round and fund a USDC pool that pays the top artists directly.",
        ],
        [
          "Seamless Listening Platform",
          "Enjoy uninterrupted, high-quality streaming with zero ads.",
        ],
        [
          "Exclusive Rooms",
          "Unlock unreleased tracks directly from your favorite artists, paid in crypto or cash.",
        ],
      ].map(([title, text]) => (
        <Card key={title}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.muted}>{text}</Text>
        </Card>
      ))}
      <Heading
        title="The Collective"
        subtitle="Where emerging artists and listeners meet."
      />
      <Text style={s.text}>
        Discover independent voices, connect through music, and help the next
        generation of artists grow.
      </Text>
      <Heading title="Frequently asked questions" />
      {[
        [
          "How do I support an artist?",
          "Vote for a released track during an open round. You can also fund the community pool or purchase a Room ticket.",
        ],
        [
          "Do I need a crypto wallet?",
          "Your AudioBlocks wallet is created automatically when you sign in. Card and Naira checkout are also available.",
        ],
        [
          "How do Rooms work?",
          "Purchase a ticket to hear an unreleased track during the access window shown on its Room.",
        ],
        [
          "Where are events and merch?",
          "The web app currently shows preview content for these. Live listings will be available when the backend supports them.",
        ],
      ].map(([title, text]) => (
        <Card key={title}>
          <Text style={s.label}>{title}</Text>
          <Text style={s.muted}>{text}</Text>
        </Card>
      ))}
    </Screen>
  );
}
