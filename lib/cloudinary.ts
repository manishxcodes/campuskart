import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export function extractPublicId(url: string): string {
  if (!url.startsWith("http")) return url;

  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/");

    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return url;

    let startIdx = uploadIdx + 1;

    if (parts[startIdx] && /^v\d+$/.test(parts[startIdx])) {
      startIdx++;
    }

    const publicIdWithExt = parts.slice(startIdx).join("/");
    return publicIdWithExt.replace(/\.[^/.]+$/, "");
  } catch {
    return url;
  }
}

export async function uploadImageToCloudinary(
  file: string,
  folder: string = "campuskart/avatars"
) {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function uploadProductImage(file: string) {
  const result = await cloudinary.uploader.upload(file, {
    folder: "campuskart/products",
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteImageFromCloudinary(urlOrPublicId: string) {
  const publicId = extractPublicId(urlOrPublicId);
  await cloudinary.uploader.destroy(publicId);
}

export async function deleteProductImages(urls: string[]) {
  const deletePromises = urls.map((url) => deleteImageFromCloudinary(url));
  await Promise.allSettled(deletePromises);
}