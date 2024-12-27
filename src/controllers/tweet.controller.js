import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js";



const createTweet = asyncHandler(async (req, res) => {
    // get the detail from req.body
    // Check if already present or not
    // if not then create tweet from user model
    // save the tweet   
    // send the success response
     

    const { content } = req.body

    if(!content) {
        throw new ApiError(400, "input feild is required !!")
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user._id
    })

    if(!tweet) {
        throw new ApiError(400, "error while create and saving the video")
    }

    return res
    .status(200)
    .json ( new ApiResponse (
        200,
        tweet,
        "tweet is created !!"
    )
    )

})

const getUserTweet = asyncHandler(async (req, res) => {
     // get the user id
     // chech the user exixt or not
     // get all the user tweet
     // return the tweets

     const  userId = req.params?.userId
     console.log(userId)


     if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid UserId")
     }

     const tweet = await Tweet.find({owner:userId})
     console.log(tweet)

     if(tweet.length === 0) {
        throw new ApiError(404, "No tweets found !!")
     }

     return res
        .status(200)
        .json(new ApiResponse(
            200,
            {tweet},
            "Fetched Tweet"
        ))
})

const updateTweet = asyncHandler(async (req, res) => {
     // req content
     // verify the user if and owner
     // is same update 
     // send the response

     const { content } = req.body

     if(!content) {
        throw new ApiError(
            400,
            "Please fill the content box"
        )
     }

     const tweet = await Tweet.findById(req.params?.tweetId)

     if(!tweet) {
        throw new ApiError(
            400,
            "No tweet exixt"
        )
     }

     if(!((tweet?.owner).equals(req.user?._id))) {
        throw new ApiError(400, "You are not allowed to update the tweet ")
     }

     const newTweet = await Tweet.findByIdAndUpdate(
        tweet._id,
        {
            $set : {
                content
            }
        },
        {
            new : true
        }
     )

     return res
     .status(200)
     .json(
        new ApiResponse(200, newTweet, "tweet is updated")
     )
})

const deleteTweet = asyncHandler(async (req, res) => {
    // get the tweet
    // check the tweet is exist or not
    // verify the user and owner
    // if verified the delted the tweet
    // send the deleted response

    const tweetId = req.params?.tweetId
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiResponse(400, "Unable to find the tweet")
    }

    if(!((tweet.owner).equals(req.user?._id))) {
        throw new ApiError(400, "You are not authorized to delete tweet")
    }

    const response = await Tweet.findByIdAndDelete(tweet._id);
    if (!response) {
        throw new ApiError(
            400,
            "Error While Deleting the data"
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, response, "Tweet deleted ")
    )
})



export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}