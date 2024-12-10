import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({
    videoFile : {
        type : String, // Cloudinary URL
        required : true
    },
    thumbnail : {
        type : String, // Cloudinary URL
        required : true
    },
    title : {
        type : String, // Cloudinary URL
        required : true
    },
    description : {
        type : String, // Cloudinary URL
        required : true
    },
    duration : {
        type : Number,
    },
    views : {
        type : Number,
        default : 0
    },
    isPublished : {
        type : Boolean,
        default : true
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
},
{timeStamps : true}

)

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model('Video', videoSchema);