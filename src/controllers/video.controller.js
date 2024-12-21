import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { deleteInCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { availableParallelism } from "os";




const getAllVideos = asyncHandler(async (req, res) => {
      const { userId , page = 1, limit = 10, query , sortBy } = req.query

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
            $unwind : "$creatrdBy"
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
                [sortBy] : sortType === 'asc' ? 1 : 1
            }
        },
        {
            $skip : (page - 1)*limit
        },
        {
            $limit : parseInt(limit)
        }
      ])


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

    if(!(description || title)) {
        throw new ApiError(400 , "thumbnail and title required !!")
    }

    const videoFileLocatePath = req?.files?.videoFile[0]?.path

    if(!videoFileLocatePath) {
        throw new ApiError(400, "Video file not found !!")
    }

    const videoFile =await uploadOnCloudinary(videoFileLocatePath);

    if(!videoFile.url) {
        throw new ApiError(400, "uploading of video file failed !!")
    }

    const thumbnailLocalPath = req?.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnai not found !!")
    }
 
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail.url) {
        throw new ApiError(400, "Error while Uplaoding thumbnail is failed !!")
    }


    const saveVideo = await Video.create({
        videoFile : videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration : videoFile.duration,
        owner : req.body._id
    })


    if(!saveVideo) {
        throw new Apierror(500, "Error while saving the video !!")
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

    if(!videoId) {
        throw new ApiError(400, "Video id required to get the video")

    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "Video not fonund !!")
    }

    return res
    .status(200)
    .json(
        200,
        {video},
        "Video found successfully !!"
    )
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
    const { videoId} = req.params

    if(!videoId) {
        throw new ApiError(400, "VideoId doesn't exist !! ")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "Video doesn't exist !!")
    }

    if(!(video?.owner).equals(req.user?._id)) {
        throw new ApiError(400, "You are not allowed to delete !!")
    }

    const videoDelete = await deleteInCloudinary(videoId.videoFile)

    if(videoDelete.result !== 'ok') {
        throw new ApiError(400, "Not able to delete video file !!")
    }

    const thumbnailDelete = await deleteInCloudinary(videoId.thumbnail)

    if(thumbnailDelete.result !== 'ok') {
        throw new ApiError(400, "Not able to delte thumbnail !!")
    }

    const deletedVideo = Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
       new ApiResponse(200, deletedVideo, "Video has been deleted successfully !!")
    )
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