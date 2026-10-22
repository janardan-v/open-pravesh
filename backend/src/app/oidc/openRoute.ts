import { Router } from "express";
import openController from "./openController"

const openRouter = Router();


openRouter.get("/.well-known/openid-configuration", openController.serviceDiscovery )
openRouter.get("/v1/certs", openController.publicKey )  
 

export default openRouter