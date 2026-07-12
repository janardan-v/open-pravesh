import express from "express";
import { Router } from "express";
import openController from "./openController"

const openRouter = Router();


openRouter.get("/.well-known/openid-configuration", openController.serviceDiscovery )
openRouter.post("/token-endpoint", openController.generateToken )


export default openRouter