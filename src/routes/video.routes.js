import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVidos, togglePublishStaus, updatVideo } from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";




const router = Router();

router.use(verifyJWT); // appling verifyJWT middleware to all the routes in the file 

router
.route("/")
.get(getAllVideos)
.post(
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1,
        },
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]),
    publishAVidos
)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updatVideo)


router.route("/toggle/publish/:videoId").patch(togglePublishStaus)



export default router

