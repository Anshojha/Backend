import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { deleteInCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";





const getAllVideos = asyncHandler(async (req, res) => {
      const { page = 1, limit = 10,  query , sortBy , sortType, userId} = req.query
      console.log(req.body)
      const videos = await Video.aggregate([
        {
            $match : {
                $or : [
                    {title : {$regex:query, $options : "i"}},
                    {description : {$regex:query, $options : "i"}}
                ]
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "createdBy"
            }
        },
        {
            $unwind : "$createdBy"
        },
        {
            $project : {
                thumbnail : 1,
                videoFile : 1,
                title : 1,
                description : 1,
                createdBy : {
                    fullName : 1,
                    username : 1,
                    avatar : 1
                }
            }
        },
        {
            $sort : {
                [sortBy]: sortType === 'asc' ? 1 : -1
            }
        },
        {
            $skip : (parseInt(page) - 1)*parseInt(limit)
        },
        {
            $limit : parseInt(limit)
        }
      ])

      console.log(videos)


      return res
      .status(200)
      .json(
        new ApiResponse (
            200,
            {videos},
            "Fetch All the videos"
        )
      )

})


const publishAVidos = asyncHandler(async (req, res) => {
    const { description, title } = req.body;

    console.log(req.body)

    if(!(description || title)) {
        throw new ApiError(400 , "thumbnail and title required !!")
    }

    const videoFileLocatePath = req?.files?.videoFile[0]?.path

    console.log("videoFileLocatePath   ",videoFileLocatePath)

    if(!videoFileLocatePath) {
        throw new ApiError(400, "Video file not found !!")
    }

    const videoFile =await uploadOnCloudinary(videoFileLocatePath);

    console.log("videoFile   ",videoFile)

    if(!videoFile.url) {
        throw new ApiError(400, "uploading of video file failed !!")
    }

    const thumbnailLocalPath = req?.files?.thumbnail[0]?.path
    console.log("ThumbnailPath   ", thumbnailLocalPath)

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnai not found !!")
    }
 
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    console.log("Thumbnail  " , thumbnail)
    if(!thumbnail.url) {
        throw new ApiError(400, "Error while Uplaoding thumbnail is failed !!")
    }


    const saveVideo = await Video.create({
        videoFile : videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration : videoFile.duration,
        owner : req.user?._id
    })
    

    console.log("saveVideo   ", saveVideo)

    if(!saveVideo) {
        throw new ApiError(500, "Error while saving the video !!")
    }

    return res
    .status(200)
    .json (
        new ApiResponse(
            200,
            {saveVideo},
            "Video published successfully !!"
        )
    )

})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        console.log("VideoId  ",videoId)
    
        if(!videoId) {
            throw new ApiError(400, "Video id required to get the video")
        }
    
        const video = await Video.findById(videoId)

        console.log(video)
    
        if(!video) {
            throw new ApiError(400, "Video not fonund !!")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {video},
            "Video sent")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Error while sending video")
    }
})



const updatVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { title , description } = req.body;

    const video =await Video.findById(videoId);

    if(!video) {
        throw new ApiError(400, "Video not found !!")
    }

    if(!((video?.owner).equals(req.user?._id))) {
        throw new ApiErro(400, "You cannot update the details")
    }


    const deleteOldThumbNail = deleteInCloudinary(video.videoFile) 


    if(deleteOldThumbNail.result !== 'ok') {
        throw new ApiError(400, "Old thumbnail not deleted !!")
    }

    const newThumbnailLocationFile = req?.file?.path

    if(!newThumbnailLocationFile) {
        throw new ApiError(400, "new thumbnail path not foune")
    }

    const newThumbnail = uploadOnCloudinary(newThumbnailLocationFile)

    if(!newThumbnail) {
        throw new ApiError(400, "New thumbnail not uploaded !!")
    }

    const videoToUpdate = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail : newThumbnail.url
            }
        },
        {
            new : true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        videoToUpdate,
        "Details of video to be updated !!"
    )
    )

})


const deleteVideo = asyncHandler(async (req, res) => {
    // const { videoId} = req.params

    // try {
    //     if(!videoId) {
    //         throw new ApiError(400, "VideoId doesn't exist !! ")
    //     }
    //     console.log(videoId)
    //     const video = await Video.findById(videoId)
    //     console.log(video)
    //     if(!video) {
    //         throw new ApiError(400, "Video doesn't exist !!")
    //     }
    //     console.log("Video owner " , video?.owner)
    
    //     if(!(video?.owner).equals(req.user?._id)) {
    //         throw new ApiError(400, "You are not allowed to delete !!")
    //     }
    
    //     const videoDelete = await deleteInCloudinary(video.videoFile)
    //     console.log("videoDelete", videoDelete)
    
    //     if(videoDelete.result !== 'ok') {
    //         throw new ApiError(400, "Not able to delete video file !!")
    //     }
    
    //     const thumbnailDelete = await deleteInCloudinary(video.thumbnail)
    
    //     if(thumbnailDelete.result !== 'ok') {
    //         throw new ApiError(400, "Not able to delte thumbnail !!")
    //     }
    
    //     const deletedVideo = Video.findByIdAndDelete(videoId)
    
    //     return res
    //     .status(200)
    //     .json(
    //        new ApiResponse(200, {deletedVideo}, "Video has been deleted successfully !!")
    //     )
    // } catch (error) {
    //     throw new ApiError(400, "Error while deleting the video")
    // }

    res.status(200).send('Delete route works');
})


const togglePublishStaus = asyncHandler(async (req, res) => {
    const { videoId }  = req.params

    if(!videoId) {
        throw new ApiError(400, "Video id not found!!")
    }

    const video = await Video.findById(videoId)

    if(!((video.owner).equals(req.user?._id))) {
        throw new ApiError(400, "You can't delete the video")
    }
    

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                isPublished : !video.isPublished
            }
        },
        {
            new : true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Published status has been updated !!"
        )
    )

})


export {
    getAllVideos,
    publishAVidos,
    getVideoById,
    updatVideo,
    deleteVideo,
    togglePublishStaus
} 