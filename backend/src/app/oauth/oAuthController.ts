import type { Request, Response, NextFunction } from "express";
import ApiError from "../../common/utils/apiError";
import oAuthServices from "./oAuthServices";

export default class oauthController {
  public static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // get client id
      // generate auth code
      // return auth code
      const [clientId] = req.params.clientId!;

      if (!clientId) {
        throw ApiError.badRequest("ClientId is required");
      }

      const result = await oAuthServices.authenticateUser({ clientId });

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
      const { clientId, clientSecret, authCode, userId } = req.query as {
        clientId: string;
        clientSecret: string;
        authCode: string;
        userId: string;
      };

      // get client secret
      // get short code
      if (
        !clientId ||
        !clientId.trim() ||
        !clientSecret ||
        !clientSecret.trim() ||
        !authCode ||
        !authCode.trim() ||
        !userId ||
        !userId.trim()
      ) {
        throw ApiError.badRequest("Invalid query parameters");
      }

      // call openServices
      // give access and refresh tokens
      const result = await oAuthServices.tokenGenerationService({
        clientId,
        clientSecret,
        authCode,
        userId,
      });
      const accessToken = result.data?.accessToken;
      const refreshToken = result.data?.refreshToken;

      res.status(200).json({
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
}
