import { Tabs } from "expo-router";
import { Image, View } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { MiniPlayer } from "../../src/components/MiniPlayer";
import { colors, Icon } from "../../src/components/ui";
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: "white",
        headerShadowVisible: false,
        headerTitle: () => (
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 100, height: 46 }}
            resizeMode="contain"
            accessibilityLabel="AudioBlocks"
          />
        ),
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: "#858585",
        tabBarStyle: { backgroundColor: "#161616", borderTopColor: "#292929" },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <Icon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="playlist"
        options={{
          title: "My Playlist",
          tabBarIcon: ({ color }) => (
            <Icon name="musical-notes-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color }) => (
            <Icon name="headset-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) => (
            <Icon name="people-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Icon name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
