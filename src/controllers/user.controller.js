import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
  const avtarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;


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
if( !(username || email) ) {
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

const { refreshToken , accessToken } = await generateAccessAndRefreshToken(user._id)

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
      $set : {
        refreshToken : undefined
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

export { registerUser, loginUser, logoutUser};
