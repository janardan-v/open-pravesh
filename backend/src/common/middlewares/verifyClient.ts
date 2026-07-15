import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";
import db from "../../db/index";
import { clientsTable } from "../../db/schema";
import { eq } from "drizzle-orm";

export const verifyClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const clientId = req.params.client_id;

  if (!clientId || typeof clientId !== "string" || clientId.trim() === "") {
    throw ApiError.badRequest("Client ID is required");
  }

  const [clientIdSearchResult] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId));

  if (!clientIdSearchResult) {
    throw ApiError.notFound("No client exists with this client id");
  }

  next();
};
