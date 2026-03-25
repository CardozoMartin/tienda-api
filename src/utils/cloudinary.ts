import cloudinary from '../config/cloudinary.config';

export const uploadImageToCloudinary = async (buffer: Buffer): Promise<string> => {
  console.log('DEBUG uploadImageToCloudinary buffer length:', buffer.length);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'changaya_profiles',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('DEBUG Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('DEBUG Cloudinary upload result:', result);
          resolve(result?.secure_url || '');
        }
      }
    );
    stream.end(buffer);
  });
};
