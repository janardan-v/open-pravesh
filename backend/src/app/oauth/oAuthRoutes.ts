import { Router } from "express";
import oauthController from "./oAuthController";

const oAuthRouter = Router();

oAuthRouter.post("/v1/token", oauthController.generateToken);
