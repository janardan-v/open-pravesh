import Router from "express"
import userController from "./userController"
import { verifyClient } from "../../common/middlewares/verifyClient"
import oauthController from "../oauth/oAuthController"

const userRouter = Router()

userRouter.post("/register", userController.register)
userRouter.post("/login/:clientId/:shortCode", verifyClient, userController.login, oauthController.authenticate)
userRouter.post("/userInfo", userController.getUserInfo)