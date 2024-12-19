import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playListSchema = new Schema (
        {
            name : {
                type : String,
                required : true
            },
            description : {
                type : String,
                required : true
            },
            vides : [
               { 
                type : Schema.Types.ObjectId,
                ref : "Vidoe"
            }
            ],
            owner : {
                type : Schema.Types.ObjectId,
                ref : "User"
            }
        },{timestamps : true}
)
export const PlayList = mongoose.model("User", playListSchema);
