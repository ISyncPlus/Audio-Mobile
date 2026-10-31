import { useState, type PropsWithChildren, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

export const colors = {
  bg: "#090909",
  card: "#1A1A1A",
  input: "#242424",
  line: "#303030",
  text: "#FFFFFF",
  muted: "#A3A3A3",
  pink: "#D2045B",
  purple: "#885FA8",
  soft: "#F2AFC9",
};
export const fallbackArt = require("../../assets/AFRO.jpg");
export function Artwork({
  uri,
  fallback = fallbackArt,
  style,
}: {
  uri?: string | null;
  fallback?: ImageSourcePropType;
  style?: ComponentProps<typeof Image>["style"];
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={uri && !failed ? { uri } : fallback}
      onError={() => setFailed(true)}
      style={style}
      accessibilityIgnoresInvertColors
    />
  );
}
export function Icon({
  name,
  color = colors.text,
  size = 22,
}: {
  name: ComponentProps<typeof Ionicons>["name"];
  color?: string;
  size?: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  label,
  onPress,
  color,
  disabled,
}: {
  name: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        { opacity: disabled ? 0.35 : pressed ? 0.65 : 1 },
      ]}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
}: PropsWithChildren<{
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled || busy ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={s.buttonText}>{children}</Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  ...props
}: ComponentProps<typeof TextInput> & { label?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        placeholderTextColor="#777"
        accessibilityLabel={label || props.placeholder}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Chips({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {items.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === item }}
          onPress={() => onSelect(item)}
          style={[
            s.chip,
            item === selected && {
              backgroundColor: colors.pink,
              borderColor: colors.pink,
            },
          ]}
        >
          <Text
            style={{
              color: item === selected ? "white" : colors.muted,
              fontSize: 12,
            }}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.heading}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.muted}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}
export function Banner({
  eyebrow,
  title,
  subtitle,
  children,
  palette,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle: string;
  palette?: [string, string, ...string[]];
}>) {
  return (
    <LinearGradient
      colors={palette || ["#490D3E", "#1E1327", "#161616"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.banner}
    >
      {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
      <Text style={s.bannerTitle}>{title}</Text>
      <Text style={[s.muted, { lineHeight: 22 }]}>{subtitle}</Text>
      {children}
    </LinearGradient>
  );
}
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["left", "right"]} style={s.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function ResourceState({
  loading,
  error,
  empty,
  retry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string | false;
  retry?: () => void;
}) {
  if (loading)
    return (
      <ActivityIndicator
        color={colors.pink}
        style={{ margin: 24 }}
        accessibilityLabel="Loading"
      />
    );
  if (!error && !empty) return null;
  return (
    <Card>
      <Icon
        name={error ? "cloud-offline-outline" : "musical-notes-outline"}
        color={colors.purple}
      />
      <Text style={s.muted}>{error || empty}</Text>
      {error && retry && (
        <Button secondary onPress={retry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
export function Action({
  label,
  run,
  onSuccess,
  secondary,
  disabled,
}: {
  label: string;
  run: () => Promise<unknown>;
  onSuccess?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <Button
        secondary={secondary}
        disabled={disabled}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await run();
            onSuccess?.();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {label}
      </Button>
      {error && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{ color: colors.soft, fontSize: 13, lineHeight: 20 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 24, paddingBottom: 36 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#252525",
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.6,
  },
  text: {
    fontFamily: "Inter_400Regular",
    color: "white",
    fontSize: 14,
    lineHeight: 22,
  },
  muted: {
    fontFamily: "Inter_400Regular",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    fontFamily: "Inter_400Regular",
    color: "white",
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 48,
  },
  button: {
    borderRadius: 28,
    backgroundColor: colors.pink,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#694258",
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#1A1A1A",
  },
  banner: {
    borderRadius: 20,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: "#4D2642",
  },
  bannerTitle: {
    fontFamily: "Inter_700Bold",
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 38,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    color: colors.soft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
