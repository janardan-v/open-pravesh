import {
  clientRegisterSchema,
  clientLoginSchema,
  createAppSchema,
} from "./clientModel";
import ApiError from "../../common/utils/apiError";
import clientServices from "./clientServices";
import type { Response, Request, NextFunction } from "express";

export default class clientController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = clientRegisterSchema.safeParse(req.body);

      if (!parsed.success) {
        throw ApiError.badRequest(
          parsed.error.issues[0]?.message || "All data fields are required",
        );
      }

      const result = await clientServices.register(parsed.data);

      if (!result || !result.success || !result.data) {
        throw ApiError.internalServerError("Error while creating client");
      }

      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = clientLoginSchema.safeParse(req.body);

      if (!parsed.success) {
        throw ApiError.badRequest(
          parsed.error.issues[0]?.message || "Valid email and password are required",
        );
      }

      const result = await clientServices.login(parsed.data);

      if (!result) {
        throw ApiError.internalServerError("Error while authenticating client");
      }

      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const clientEmail = res.locals.clientEmail;
      if (!clientEmail) {
        throw ApiError.unauthorized("Authentication required");
      }

      const result = await clientServices.getMe(clientEmail);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const clientEmail = res.locals.clientEmail;
      if (!clientEmail) {
        throw ApiError.unauthorized("Authentication required");
      }

      const result = await clientServices.getApplications(clientEmail);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const clientEmail = res.locals.clientEmail;
      const rawClientId = req.params.clientId;
      const clientId = Array.isArray(rawClientId) ? rawClientId[0] : rawClientId;

      if (!clientEmail) {
        throw ApiError.unauthorized("Authentication required");
      }
      if (!clientId) {
        throw ApiError.badRequest("Client ID is required");
      }

      const result = await clientServices.getApplicationById(clientEmail, clientId);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const clientEmail = res.locals.clientEmail;
      if (!clientEmail) {
        throw ApiError.unauthorized("Authentication required");
      }

      const parsed = createAppSchema.safeParse(req.body);
      if (!parsed.success) {
        throw ApiError.badRequest(
          parsed.error.issues[0]?.message || "Invalid application data",
        );
      }

      const result = await clientServices.createApplication(clientEmail, parsed.data);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }
}
