import { Router } from "express";
import openController from "./openController"

const openRouter = Router();


openRouter.get("/.well-known/openid-configuration", openController.serviceDiscovery ) // sorted
openRouter.get("/v1/certs", openController.publicKey )  // sorted
 

export default openRouter