import db from "../../db"
import { clientsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/apiError";

const verifyClient = async (clientId: string) => {
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

  return { clientSecret, redirectUri };
};

export default verifyClient