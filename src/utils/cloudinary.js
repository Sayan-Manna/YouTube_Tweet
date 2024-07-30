import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // Node.js file system module
import { request } from "http";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null; // immediately return null if no file path is provided
            throw new Error("Local file path is required");
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically determine the type of file
        });

        // console.log("Upload successful: ", response.url);
        fs.unlinkSync(localFilePath); // remove the locally saved temp file
        return response;
    } catch (error) {
        // At this stage, file is there in my server but maybe it is not uploaded to cloudinary
        // so to cleanup -> remove local file from my server 1st
        fs.unlinkSync(localFilePath); // remove the locally saved temp file
        console.error("Upload Error:", error);
        return null;
    }
};

export { uploadOnCloudinary };

// (async function () {

//     // Upload an image
//     const uploadResult = await cloudinary.uploader
//         .upload(
//             "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//             {
//                 public_id: "shoes",
//             }
//         )
//         .catch((error) => {
//             console.log(error);
//         });

//     console.log(uploadResult);

//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url("shoes", {
//         fetch_format: "auto",
//         quality: "auto",
//     });

//     console.log(optimizeUrl);

//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url("shoes", {
//         crop: "auto",
//         gravity: "auto",
//         width: 500,
//         height: 500,
//     });

//     console.log(autoCropUrl);
// })();
