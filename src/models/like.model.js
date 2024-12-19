import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema (
    {
        Video : {
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        comment : {
            type : Schema.Types.ObjectId,
            ref : "Comment"
        },
        tweet : {
            types : Schema.Types.ObjectId,
            ref : "Tweet"
        },
        likedBy : {
            types : Schema.Types.ObjectId,
            ref : "Like"
        }
    }, {timestamps : true}
)


export const Like = mongoose.model("Like", likeSchema)