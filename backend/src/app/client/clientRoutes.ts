import {Router} from "express"
import clientController from "./clientController"

const clientRouter = Router()


clientRouter.post("/client-register", clientController.register) // sorted
clientRouter.post("/client-login", clientController.login)  // sorted

export default clientRouter