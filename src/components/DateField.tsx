import { Field } from "./ui";
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      label={`${label} (local time)`}
      placeholder="2026-10-20T18:00"
      value={value}
      onChangeText={onChange}
      autoCapitalize="none"
    />
  );
}
