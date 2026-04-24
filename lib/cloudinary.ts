import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadImageToCloudinary (file: string, folder: string = "campuskart/avatars") {
    const result = await cloudinary.uploader.upload(file, {
        folder,
        transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
        ],
    });

    return {
        url: result.secure_url,
        publicId: result.public_id
    };
}

export async function deleteImageFromCloudinary(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
}