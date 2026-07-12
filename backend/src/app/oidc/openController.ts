import type { Request, Response, NextFunction } from "express";
import ApiResponse from "../../common/utils/apiResponse";
import { authenticateUserSchema } from "./openModel";
import ApiError from "../../common/utils/apiError";
import openServices from "./openServices";

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

  public static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // get client id
      // get short code
      // check expirty of short code
      // check in inMemoryTable => clientId
      const [clientId] = req.params.clientId!;

      if (!clientId) {
        throw ApiError.badRequest("ClientId is required");
      }

      const result = await openServices.authenticateUser({ clientId });

      if (!result.data) {
        throw ApiError.internalServerError(
          result.message || "Somethig went wrong while redirecting",
        );
      }
      res.redirect(result.data.redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  public static async generateToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // get client id
      // get client secret
      // get short code
      // if any not exist, redirect back
      
      // call openServices
      // give access and refresh tokens 
    } catch (error) {
      next(error);
    }
  }
}
