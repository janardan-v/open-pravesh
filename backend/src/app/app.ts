import express from "express";
import type { Express } from "express";
import errorHandler from "../common/middlewares/errorHandler";
import openRouter from "./oidc/openRoute";

function createServerApplication(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  app.get("/", (_, res) => {
    res.send("Hello").status(200);
  });

  app.use(openRouter);
  app.use(errorHandler);
  return app;
}
export default createServerApplication;
