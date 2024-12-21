import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId) => {
    try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRrfreshToken()
      user.refreshToken  = refreshToken
      user.save({validBeforeSave : false})

      return { accessToken, refreshToken }
    } catch (error) {
      throw new ApiError(500, "Somthing went wrong while generating access token and refresh token !!")
    }
}

const registerUser = asyncHandler(async (req, res) => {

  // get user details from the frontend
  // validation -> not empty feild
  // check is user already existed -> username , email
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user ob - create entry in db
  // remove passwoed fron the feild and refresh token
  // check for user creation
  // return response


  const {fullName, email, username, password} = req.body;
  console.log("email : ", email,  "\npassword", password)

  // console.log("req.body ->    ", req.body);
  if(
    [fullName, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All feild is required !!")
  }

  const existedUser =await User.findOne({
    $or : [ { username} , { email }]
  })

  // console.log("Existed user :", existedUser);

  if(existedUser) {
    throw new ApiError(409, "User with email and usernane already existed !!")
  }
  // console.log("req.files ->   ", req.files);
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
  const avtarLocalPath = req.files?.avatar[0]?.path;
  console.log("avtare   ", avtarLocalPath)

  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avtarLocalPath) {
    throw new ApiError(400, "Avatar feild is required !!")
  }
  
  const avatar = await uploadOnCloudinary(avtarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  

  //  console.log("Avata -->>" , avatar)

  if(!avatar) {
    throw new ApiError(400, "Avatar feild is required !!")
  }


  const user =await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user !!")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser , "User registred")
  )

});

const loginUser = asyncHandler(async (req, res) => {
// values from the clinet side
// check for the empatiness
// check user exist or not if not then redirect to register user
// user validation
// assign access token and refresh token
// login done
// send success response 

const {email, username, password} = req.body;
if(!(username || email) ) {
  throw new ApiError(400, "username and password required !!")
}

const user = await User.findOne({
  $or : [{username} , {email}]
})

if(!user) {
  throw new ApiError(404, "User not exist !!")
}

const isPasswordValid = await user.isPasswordCorrect(password)

if(!isPasswordValid) {
  throw new ApiError(404, "Invalid user credentials !!")
}

const {  accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
console.log("refresh Token ------>>>>>> ", refreshToken, "accessToke ------>>>>>")

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options = {
  httpOnly : true,
  secure : true
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
  new ApiResponse(
    200,
    {
      user : loggedInUser, accessToken, refreshToken
    },
    "User successfully logged in"
  )
)

})


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset : {
        refreshToken : 1
      }
    },
    {
      new : true
    }
  )
  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200), {}, "User logged Out !!")

})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  console.log("Incoming token ",incomingRefreshToken)
  
  if(!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized error !!")
  }
  try {
  
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    console.log("decode token",decodedToken)
  
  
    if(!decodedToken) {
      throw new ApiError(401, "Unauthorized Access !!")
    }
  
    const user = await User.findById(decodedToken?._id)
    console.log("Uert ----->>>>>", user)
  
    if(!user) {
      throw new ApiError(401, "Invalid refresh token !!")
    }
  
    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, " Refresh   token is expired !!")
    }
  
    const options = {
      httpOnly : true,
      secure : true
    }
  
    const { accessToken , newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    console.log("new", newRefreshToken);
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken , refreshToken : newRefreshToken},
        "Access token refreshed"
      )
    )
  
  } catch (error) {
    throw new ApiError(401, "This is the",error?.message || "Invalid refresh token !!")
  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {username, email, oldPassword , newPassword } = req.body;
    console.log("req.body", req.body)
    const user = await User.findOne({
      $or: [{username}, {email}]
  })

    console.log("old -> ", oldPassword)
    console.log("new -> ", newPassword)
    console.log("user ->", user)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password !!")
    }

    user.password = newPassword
    await user.save({validBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is changed successfully !!"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    req.user,
    "User fetched successfully"
))
})


const updateAccountDetails = asyncHandler(async(req, res) => {
  const { username , fullName , email} = req.body;

  if(!fullName || !email) {
    throw new ApiError(400, "All feilds are required !!")
  }

  const user =await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        username,
        fullName,
        email : email 
      }
    },
    { new : true }
  
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Accounts updated successfully !!"))

})


const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path

  if(!avatarLocalPath ) {
    throw new ApiError(400, "Avatar file is missing !!")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  const user = await User.findByIdAndUpdate(
    req.user?.path,
    {
      $set : {
        avatar : avatar.url
      }
    },
    {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(ApiResponse(200, user, "Avatar updated !!"))

})


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath  = req.files?.path

  if(!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing !!")
  }

  const coverImage = await  uploadOnCloudinary(coverImageLocalPath)

  const user = await User.findByIdAndUpdate(
    req.files?.path,
    {
      $set : {
        coverImage : coverImage.url
      }
    },
    {new : true}
  ).select("-password")
  

  return res
  .status(200)
  .json(ApiResponse(200, user, "Cover image updated successfully !!"))
})

const getUserChannelProfile = asyncHandler(async(req , res) => {
   const { username } = req.params

   if(!username?.trim()) {
    throw new ApiError(400, "User is missing !!")
   }

   const channel = await User.aggregate([
    {
      $match : {
        username : username?.toLowerCase()
      }
    },
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "channel",
        as : "subscribers"
      }
    },
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "subscriber",
        as : "subscriberedTo"
      }
    },
    {
      $addFields : {
        subscribersCount : {
          $size : "$subscribers"
        },
        channelsSubscribedToCount : {
          $size : "$subscriberedTo"
        },
        isSubscribed : {
          $cond : {
            if : {$in : [req.user?._id, "$subscribers.subscriber", ]},
            then : true,
            else : false
          }
        }
      }
    },
    {
      $project : {
        fullName : 1,
        username : 1,
        subscribersCount : 1,
        channelsSubscribedToCount : 1,
        isSubscribed : 1,
        avatar : 1,
        coverImage : 1,
        email : 1
      }
    }
   ])

   if(!channel.length) {
    throw new ApiError(404, "channel dost not exists")
   }

   return res
   .status(200, channel[0], "channel details fetched successfully !!")
})


const getWatchHistory = asyncHandler(async (req, res) => {
   const user = await User.aggregate([
   { 
    $match : {
      _id :mongoose.Types.ObjectId(req.user._id)
    }
  },
  {
    $lookup : {
      from : "videos",
      localField : "watchHistory",
      foreignField : "_id",
      as : "watchHistory",
      pipeline : [
       { 
        $lookup : {
          from : "users",
          localField : "owner",
          foreignField : "_id",
          as : "owner",
          pipeline : [
            {
              $project : {
                fullName : 1,
                username : 1,
                avatar : 1
              }
            },
            {
              $addFields : {
                owner : {
                  $first : "$owner"
                }
              }
            }
          ]
        }
      }
      ]
    }
  }
   ])

  return res
  .status(200)
  .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched  successfully !!"))
  })

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,updateUserCoverImage, getUserChannelProfile, getWatchHistory}; 
