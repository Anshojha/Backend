// require('dotenv').config()
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})




connectDB()
.then(process.env.PORT || 8000, ()=> {
    console.log(`Server is running at port ${process.env.PORT}`)
})
.catch((err) => {
    console.log("MONGO db connectio failed !!", err)
})









// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";

// const app = express()

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//         console.log("ERR", error)
//         throw error
//     })

//     app.listen(process.env.PORT , () => {
//         console.log(`App is listining on port ${process.env.PORT}`)
//     })
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// })();
