import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Compresses an image using a canvas-based approach to reduce file size.
 * @param file The original File object from an input field.
 * @param maxWidth Maximum width of the compressed image.
 * @param quality Compression quality (0 to 1).
 */
export const compressImage = (file: File, maxWidth = 1024, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob conversion failed'));
          },
          'image/jpeg',
          quality
        );
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Resolves a relative storage path to a full URL.
 * In the future, this can be changed to point to a custom domain or S3.
 */
export const resolveStorageUrl = async (path: string): Promise<string> => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a URL
  
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('Could not resolve storage path:', path);
    return '';
  }
};

/**
 * Uploads a file and returns the RELATIVE path for database storage.
 */
export const uploadFile = async (file: Blob | File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return path; // Return the path, NOT the download URL
};
