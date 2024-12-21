import {v2 as cloudinary} from "cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import fs from "fs"


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET_KEY
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return NULL;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })

        console.log("file is uploaded on cloudinary", response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)  // removev the locally saved temporary file as the uploaded operation got failed
        return null;
    }
}

const deleteInCloudinary = async (fileUrl) => {
    try {
        if(!fileUrl) {
            return null
        }
    
        const publicId = extractPublicId(fileUrl)
    
        if(!publicId) {
            return null
        }
    
        let resourceType = "image"
        if(fileUrl.match(/\.(mp4|mkv|mov|avi)$/)) {
            resourceType = "video";
        }
        else if (fileUrl.match(/\.(mp3|wav)$/)) {
            resourceType = "raw"
        }
    
        const res = await cloudinary.uploader.destroy(publicId , {resource_type : resourceType})
    
        return res;
    } catch (error) {
        return null
    }
}



export {
    uploadOnCloudinary,
    deleteInCloudinary
}
    


