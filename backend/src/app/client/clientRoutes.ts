import {Router} from "express"
import clientController from "./clientController.ts"

const clientRouter = Router()


clientRouter.post("/client-register", clientController.register)
clientRouter.post("/client-login", clientController.login)

export default clientRouter