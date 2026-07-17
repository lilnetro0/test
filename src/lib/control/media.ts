/** Client helper — File → base64 for adminUploadHubMedia. */
export async function fileToBase64(file: File): Promise<{ base64: string; contentType: string }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return { base64: btoa(binary), contentType: file.type || "application/octet-stream" };
}
