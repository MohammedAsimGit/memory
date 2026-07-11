import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: 'our-story',
    resource_type: 'auto',
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}

export async function uploadVideo(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: 'our-story',
    resource_type: 'video',
    eager: [
      { streaming_profile: 'hd', format: 'mp4' },
    ],
    eager_async: true,
  });

  return result.secure_url;
}

export async function uploadPdf(buffer: Buffer, filename: string): Promise<string> {
  const base64 = `data:application/pdf;base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: 'our-story/books',
    resource_type: 'raw',
    public_id: filename,
  });

  return result.secure_url;
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
