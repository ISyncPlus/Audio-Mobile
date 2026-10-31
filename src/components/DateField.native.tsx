import { useState } from "react";
import { Platform, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, s } from "./ui";
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<"date" | "time" | "datetime" | null>(null);
  const date = value ? new Date(value) : new Date();
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <Button
        secondary
        onPress={() => {
          if (!value) onChange(date.toISOString());
          setMode(Platform.OS === "ios" ? "datetime" : "date");
        }}
      >
        {value ? date.toLocaleString() : "Choose date and time"}
      </Button>
      {mode && (
        <>
          <DateTimePicker
            themeVariant="dark"
            value={date}
            mode={mode}
            onChange={(event, selected) => {
              if (event.type === "dismissed") {
                setMode(null);
                return;
              }
              if (selected) onChange(selected.toISOString());
              if (Platform.OS === "android")
                setMode(mode === "date" ? "time" : null);
            }}
          />
          {Platform.OS === "ios" && (
            <Button secondary onPress={() => setMode(null)}>
              Done
            </Button>
          )}
        </>
      )}
    </View>
  );
}
