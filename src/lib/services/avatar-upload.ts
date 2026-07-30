import { supabaseAdmin, AVATAR_BUCKET } from "@/lib/supabase-admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

let bucketEnsured = false;

/** Creates the public "avatars" bucket the first time it's needed. Idempotent - cheap to call every upload. */
async function ensureBucketExists() {
  if (bucketEnsured) return;

  const { data: existing } = await supabaseAdmin.storage.getBucket(AVATAR_BUCKET);
  if (!existing) {
    const { error } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    // A concurrent request may have created it between getBucket and here -
    // only a genuine failure (not "already exists") should surface.
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Não foi possível preparar o armazenamento: ${error.message}`);
    }
  }
  bucketEnsured = true;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato de imagem não suportado (use JPG, PNG, WEBP ou GIF)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Imagem muito grande (máximo 5MB)");
  }

  await ensureBucketExists();

  const extension = file.type.split("/")[1];
  const path = `${userId}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) {
    throw new Error(`Falha no upload: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
