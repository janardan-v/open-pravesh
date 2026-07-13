import crypto from "crypto";
import inMemoryTable from "../../db/inMemory";
import db from "../../db/";
import { clientsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/apiError";
import ApiResponse from "../../common/utils/apiResponse";
import verifyClient from "../../common/utils/verifyClient"

export default class openServices {
  
  
  // static async generatePublicKey() {
  //   const publicKeys = await getPublicJWK();

  //   return ApiResponse.created("Public keys created", {
  //     keys: publicKeys,
  //   });
  // }
}
