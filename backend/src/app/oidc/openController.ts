import type { Request, Response, NextFunction } from "express";
import ApiResponse from "../../common/utils/apiResponse";
import ApiError from "../../common/utils/apiError";
import openServices from "./openServices";
import { clientsTable } from "../../db/schema";
import { getPublicJWKS } from "../../common/utils/pemTojwk";

export default class openController {
  public static serviceDiscovery(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    return res.status(200).json({
      issuer: "http://localhost:3000",

      authorization_endpoint: "http://localhost:3000/v1/auth",

      token_endpoint: "http://localhost:3000/v1/token",
      userinfo_endpoint: "http://localhost:3000/v1/userinfo",
      jwks_uri: "http://localhost:3000/v1/certs",
    });
  }

  public static async publicKey(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = getPublicJWKS();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
