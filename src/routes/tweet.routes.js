import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweet, updateTweet } from "../controllers/tweet.controller.js";



const router = Router()

router.use(verifyJWT)

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweet);
router.route("/:tweerId").patch(updateTweet).delete(deleteTweet)

export default router
