import { Router } from "express";
import clientController from "./clientController";
import { verifyClientAuth } from "../../common/middlewares/verifyClientAuth";

const clientRouter = Router();

// Public developer client authentication routes
clientRouter.post("/client-register", clientController.register);
clientRouter.post("/client-login", clientController.login);

// Protected developer console endpoints (requires Bearer token)
clientRouter.get("/client/me", verifyClientAuth, clientController.getMe);
clientRouter.get("/client/applications", verifyClientAuth, clientController.getApplications);
clientRouter.get("/client/applications/:clientId", verifyClientAuth, clientController.getApplicationById);
clientRouter.post("/client/applications", verifyClientAuth, clientController.createApplication);

export default clientRouter;
