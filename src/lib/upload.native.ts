import { File, Paths } from "expo-file-system";
import type { DocumentPickerAsset } from "expo-document-picker";
export function appendAsset(
  form: FormData,
  field: string,
  asset: Pick<DocumentPickerAsset, "uri" | "name" | "mimeType">,
) {
  form.append(field, {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "application/octet-stream",
  } as unknown as Blob);
}
export async function uploadChunks(
  asset: DocumentPickerAsset,
  fileId: string,
  send: (body: FormData) => Promise<unknown>,
  progress: (value: number) => void,
) {
  const source = new File(asset.uri);
  const chunkSize = 1024 * 1024;
  const count = Math.ceil(source.size / chunkSize);
  if (!count) throw new Error("The selected file is empty.");
  for (let i = 0; i < count; i++) {
    const chunk = new File(Paths.cache, `${fileId}-${i}`);
    try {
      chunk.write(
        new Uint8Array(
          await source.slice(i * chunkSize, (i + 1) * chunkSize).arrayBuffer(),
        ),
      );
      const body = new FormData();
      body.append("fileId", fileId);
      body.append("chunkIndex", String(i));
      appendAsset(body, "chunk", {
        uri: chunk.uri,
        name: `${fileId}-${i}`,
        mimeType: "application/octet-stream",
      });
      await send(body);
      progress(Math.round(((i + 1) / count) * 100));
    } finally {
      if (chunk.exists) chunk.delete();
    }
  }
  return count;
}
