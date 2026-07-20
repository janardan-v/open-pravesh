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
      const userId = res.locals.userId;
      const userEmail = res.locals.userEmail;


      if (!clientId || !userId || !userEmail) {
        throw ApiError.badRequest("All fields are required");
      }

      const result = await oAuthServices.authenticateUser({ clientId, userId, userEmail });

      if (!result.data) {
        throw ApiError.internalServerError(
          result.message || "Somethig went wrong while redirecting",
        );
      }

      const responseUrl = result.data.redirectUrl;
      responseUrl.searchParams.set("code", result.data.shortCode);

      return res.redirect(responseUrl.toString());
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
      const { clientId, clientSecret, authCode } = req.params as {
        clientId: string;
        clientSecret: string;
        authCode: string;
      };

      // get client secret
      // get short code
      if (
        !clientId ||
        !clientId.trim() ||
        !clientSecret ||
        !clientSecret.trim() ||
        !authCode ||
        !authCode.trim()
      ) {
        throw ApiError.badRequest("Invalid query parameters");
      }

      // call openServices
      // give access and refresh tokens
      const result = await oAuthServices.tokenGenerationService({
        clientId,
        clientSecret,
        authCode,
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
