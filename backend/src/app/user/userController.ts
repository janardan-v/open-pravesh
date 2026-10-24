import ApiError from "../../common/utils/apiError";
import { verifyAccessToken } from "../../common/utils/jwtUtils";
import { getPrivateKey } from "../../common/utils/pemTojwk";
import { registerSchema, loginSchema } from "./userModel";
import userServices from "./userServices";
import type { Request, Response, NextFunction } from "express";

export default class userController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.safeParse(req.body);

      if (!data.success) {
        throw ApiError.badRequest(
          data.error.issues[0]?.message || "Invalid request data",
        );
      }

      const response = await userServices.register(data.data);

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.safeParse(req.body);

      if (!data.success) {
        throw ApiError.badRequest(
          data.error.issues[0]?.message || "Invalid request data",
        );
      }

      const response = await userServices.login(data.data);
      if (!response.data) {
        throw ApiError.internalServerError(response.message);
      }
      res.locals.userId = response.data.id;
      res.locals.userEmail = response.data.email;
  
      if (data.success) {
        next();
      }

    } catch (error) {
      next(error);
    }
  }

  static async getUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw ApiError.unauthorized("Invalid token");
      }
      const accessToken = authHeader.split(" ")[1];
      if (!accessToken) {
        throw ApiError.unauthorized("Token not found");
      }
      const response = verifyAccessToken(accessToken, getPrivateKey());
      return res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  }
}
