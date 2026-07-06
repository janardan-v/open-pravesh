import ApiError from "../../common/utils/apiError.ts";
import type { RegisterData, LoginData } from "./userModel.ts";
import { registerSchema, loginSchema } from "./userModel.ts";
import userServices from "./userServices.ts";
import type { Request, Response, NextFunction } from "express";;

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

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw ApiError.unauthorized("Invalid token");
      }
      const accessToken = authHeader.split(" ")[1];
      const result = await userServices.getUser(accessToken!);
    } catch (error) {}
  }
}
