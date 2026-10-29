import express from "express";
import type { Express } from "express";
import errorHandler from "../common/middlewares/errorHandler";
import openRouter from "./oidc/openRoute";
import userRouter from "./user/userRoutes";
import oAuthRouter from "./oauth/oAuthRoutes";
import clientRouter from "./client/clientRoutes";
import cors from "cors";

function createServerApplication(): Express {
  const app = express();
  app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://open-pravesh.vercel.app"
  ],
  credentials: true
}));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));  

  app.get("/", (_, res) => {
    res.send("Hello").status(200);
  });

  app.use(openRouter);
  app.use(userRouter);
  app.use(oAuthRouter);
  app.use(clientRouter);

  
  app.use(errorHandler);
  return app;
}
export default createServerApplication;
