import Router from "express"
import userController from "./userController"
import openController from "../oidc/openController"
import { verifyClient } from "../../common/middlewares/verifyClient"

const userRouter = Router()

userRouter.post("/register", userController.register)
userRouter.post("/login/:clientId", verifyClient, userController.register, openController.authenticate)