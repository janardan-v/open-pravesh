import type { authenticateUserData } from "./openModel";
import crypto from "crypto";
import inMemoryTable from "../../db/inMemory";
import db from "../../db/";
import { clientsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/apiError";
import ApiResponse from "../../common/utils/apiResponse";

export default class openServices {
  static async authenticateUser({ clientId }: authenticateUserData) {
    const [clientResult] = await db
      .select({
        id: clientsTable.id,
        clientSecret: clientsTable.clientSecret,
        redirectUri: clientsTable.redirectUri,
      })
      .from(clientsTable)
      .where(eq(clientsTable.id, clientId));

    if (!clientResult) {
      throw ApiError.badRequest("Client not found");
    }
    const { clientSecret, redirectUri } = clientResult;

    const authenticationCode = crypto.randomBytes(32).toString("hex");

    inMemoryTable[clientId] = {
      clientSecret,
      authenticationCode,
    };

    const responseUrl = new URL(redirectUri);
    responseUrl.searchParams.set("code", authenticationCode);

    return ApiResponse.success("User found", {
      redirectUrl: responseUrl.toString(),
    });
  }
}
