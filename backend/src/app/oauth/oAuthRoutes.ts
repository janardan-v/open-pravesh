import { Router } from "express";
import oauthController from "./oAuthController";
import inMemoryTable from "../../db/inMemory";

const oAuthRouter = Router();

oAuthRouter.post("/v1/token/:clientId/:clientSecret/:authCode", oauthController.generateToken);  
oAuthRouter.get("/debug/inmemory", (req, res) => {
    res.json(inMemoryTable);
});
export default oAuthRouter;
