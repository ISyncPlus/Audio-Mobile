import type { DocumentPickerAsset } from "expo-document-picker";
export function appendAsset(
  form: FormData,
  field: string,
  asset: DocumentPickerAsset,
) {
  if (!asset.file) throw new Error("Select the file again to upload.");
  form.append(field, asset.file, asset.name);
}
export async function uploadChunks(
  asset: DocumentPickerAsset,
  fileId: string,
  send: (body: FormData) => Promise<unknown>,
  progress: (value: number) => void,
) {
  if (!asset.file) throw new Error("Select the audio file again.");
  const size = 1024 * 1024;
  const count = Math.ceil(asset.file.size / size);
  if (!count) throw new Error("The selected file is empty.");
  for (let i = 0; i < count; i++) {
    const body = new FormData();
    body.append("fileId", fileId);
    body.append("chunkIndex", String(i));
    body.append(
      "chunk",
      asset.file.slice(i * size, (i + 1) * size),
      `${fileId}-${i}`,
    );
    await send(body);
    progress(Math.round(((i + 1) / count) * 100));
  }
  return count;
}
