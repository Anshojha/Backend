import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };