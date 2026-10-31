import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Action, Field, Screen, s } from "../src/components/ui";
import { SignInCard } from "../src/components/SignInCard";
import { useSession } from "../src/lib/session";
import { appendAsset } from "../src/lib/upload";
export default function EditProfile() {
  const { profile, request, sync } = useSession();
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [instagram, setInstagram] = useState(profile?.instagram || "");
  const [avatar, setAvatar] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [cover, setCover] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );
  const choose = async (target: "avatar" | "cover") => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "image/webp"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset.size || asset.size > 8 * 1024 * 1024)
        throw new Error("Choose an image under 8MB.");
      target === "avatar" ? setAvatar(asset) : setCover(asset);
    }
  };
  if (!profile)
    return (
      <Screen>
        <SignInCard />
      </Screen>
    );
  if (profile.role !== "artist")
    return (
      <Screen>
        <Text style={s.text}>
          Profile editing is currently available for artists.
        </Text>
      </Screen>
    );
  return (
    <Screen>
      <Field label="Artist name" value={username} onChangeText={setUsername} />
      <Field label="Bio" multiline value={bio} onChangeText={setBio} />
      <Field
        label="Instagram"
        autoCapitalize="none"
        value={instagram}
        onChangeText={setInstagram}
      />
      <Action
        secondary
        label={avatar?.name || "Choose profile image"}
        run={() => choose("avatar")}
      />
      <Action
        secondary
        label={cover?.name || "Choose page cover"}
        run={() => choose("cover")}
      />
      <Action
        label="Save changes"
        disabled={!username.trim()}
        run={async () => {
          const body = new FormData();
          body.append("username", username.trim());
          body.append("bio", bio);
          body.append("instagram", instagram);
          if (avatar) appendAsset(body, "profileImage", avatar);
          if (cover) appendAsset(body, "pageCover", cover);
          await request("/api/artist/update-profile", {
            method: "PATCH",
            body,
            authenticated: true,
          });
          await sync();
          router.back();
        }}
      />
    </Screen>
  );
}
