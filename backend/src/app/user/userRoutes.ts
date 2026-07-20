import Router from "express"
import userController from "./userController"
import { verifyClient } from "../../common/middlewares/verifyClient"
import oauthController from "../oauth/oAuthController"

const userRouter = Router()

userRouter.post("/register", userController.register) // done
userRouter.post("/login/:clientId/", verifyClient, userController.login, oauthController.authenticate) // done
userRouter.get("/userInfo", userController.getUserInfo)