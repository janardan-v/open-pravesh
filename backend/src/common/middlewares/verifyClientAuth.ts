import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";
import { verifyClientToken } from "../../app/client/clientUtils/jwt.utils";

export const verifyClientAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Authentication required. Please sign in.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw ApiError.unauthorized("Authentication token not found.");
    }

    const decoded = verifyClientToken(token);
    if (!decoded || !decoded.email) {
      throw ApiError.unauthorized("Invalid client session.");
    }

    res.locals.clientEmail = decoded.email;
    if (decoded.clientId) {
      res.locals.clientId = decoded.clientId;
    }

    next();
  } catch (error) {
    next(error);
  }
};
