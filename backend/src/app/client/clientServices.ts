import type { clientRegisterData, clientLoginData } from "./clientModel";
import { clientsTable } from "../../db/schema";
import db from "../../db/index";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/apiError";
import ApiResponse from "../../common/utils/apiResponse";
import crypto from "crypto";

import { password as psw } from "bun"; // using inBuilt library of bun to hash and verify the password

export default class clientServices {
  static async register({
    clientName,
    email,
    password,
    hostedUri,
    redirectUri,
  }: clientRegisterData) {
    const clientEmailResult = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    if (clientEmailResult.length > 0) {
      throw ApiError.badRequest("Email already exists");
    }

    const hashedPassword = await psw.hash(password);
    const clientSecret = crypto.createHash("sha256").digest("hex");
    const [insertResult] = await db
      .insert(clientsTable)
      .values({
        clientName,
        clientSecret,
        email,
        password: hashedPassword,
        hostedUri,
        redirectUri,
      })
      .returning({ id: clientsTable.id });

    if (!insertResult) {
      throw ApiError.internalServerError("Error while creating client");
    }

    return ApiResponse.created("Client registered successfully", {
      clientId: insertResult.id,
      clientSecret,
      hostedUri,
      redirectUri,
    });
  }

  static async login({ email, password: userPass }: clientLoginData) {
    // take credentials and look for user in db
    const [clientEmailResult] = await db
      .select({
        clientId: clientsTable.id,
        email: clientsTable.email,
        hashedPass: clientsTable.password,
        clientSecrert: clientsTable.clientSecret,
        redirectUri: clientsTable.redirectUri,
        hostedUri: clientsTable.hostedUri,
      })
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    // if user not found, throw error
    if (!clientEmailResult) {
      throw ApiError.badRequest("Client do not exists");
    }

    // if user found, check for password
    const isPasswordValid = await psw.verify(
      userPass,
      clientEmailResult.hashedPass!,
    );

    //  invalid password, throw error
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // if all good
    // generate a short code
    // return it in url
    return ApiResponse.success("Client found successfully", {
      clientId: clientEmailResult.clientId,
      clientSecret: clientEmailResult.clientSecrert,
      clientSecrert: clientEmailResult.clientSecrert,
      redirectUri: clientEmailResult.redirectUri,
      hostedUri: clientEmailResult.hostedUri,
    });
  }

}
