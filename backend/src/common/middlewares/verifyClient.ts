import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError.ts";
import db from "../../db/index.ts";
import { clientsTable } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export const verifyClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const clientId = req.query.client_id;

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
