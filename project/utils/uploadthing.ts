import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

const url = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/uploadthing` 
  : "http://localhost:3001/api/uploadthing";

export const UploadButton = generateUploadButton({ url });
export const UploadDropzone = generateUploadDropzone({ url });
