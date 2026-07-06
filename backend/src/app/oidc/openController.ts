import type { Request, Response, NextFunction } from "express";
import ApiResponse from "../../common/utils/apiResponse";

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
      revocation_endpoint: "http://localhost:3000/v1/revoke",
      jwks_uri: "http://localhost:3000/v1/certs",
    });
  }
}
