import { writeAsyncIterableToWritable } from "@remix-run/node";
import cloudinary from "cloudinary";

// configure and authenticate into cloudinary environment 
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export async function uploadImage(data: AsyncIterable<Uint8Array>) {
    //create a promise to handle asynchronous upload of data use upload_stream
  const uploadPromise = new Promise(async (resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
        // specify options for uploaded image to cloudinary
      {
        folder: "remix",
        transformation: ["transform-avatar"]
        
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
    
    await writeAsyncIterableToWritable(data, uploadStream);

  });

  return uploadPromise;
}

export async function getUserAvatar(id: string) {
    const avatarId = await cloudinary.v2.api.resources_by_asset_ids(id, {})
    return avatarId
    
}
