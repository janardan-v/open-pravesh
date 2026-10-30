import type {
  clientRegisterData,
  clientLoginData,
  CreateAppData,
} from "./clientModel";
import { clientsTable } from "../../db/schema";
import db from "../../db/index";
import { eq, and } from "drizzle-orm";
import ApiError from "../../common/utils/apiError";
import ApiResponse from "../../common/utils/apiResponse";
import crypto from "crypto";
import { password as psw } from "bun";
import { generateClientToken } from "./clientUtils/jwt.utils";

export default class clientServices {
  static async register({
    clientName,
    email,
    password,
    hostedUri,
    redirectUri,
  }: clientRegisterData) {
    const existingClients = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    if (existingClients.length > 0) {
      throw ApiError.badRequest(
        "An account with this email already exists. Please sign in to your developer console.",
      );
    }

    const hashedPassword = await psw.hash(password);
    const clientSecret = crypto.randomBytes(32).toString("hex");

    const [insertResult] = await db
      .insert(clientsTable)
      .values({
        clientName,
        clientSecret,
        email,
        password: hashedPassword,
        hostedUri: hostedUri || "",
        redirectUri,
      })
      .returning({ id: clientsTable.id });

    if (!insertResult) {
      throw ApiError.internalServerError("Error while creating client application");
    }

    const token = generateClientToken({
      email,
      clientId: insertResult.id,
    });

    return ApiResponse.created("Client registered successfully", {
      clientId: insertResult.id,
      clientSecret,
      clientName,
      email,
      hostedUri: hostedUri || "",
      redirectUri,
      token,
      accessToken: token,
    });
  }

  static async login({ email, password: userPass }: clientLoginData) {
    const clients = await db
      .select({
        clientId: clientsTable.id,
        clientName: clientsTable.clientName,
        email: clientsTable.email,
        hashedPass: clientsTable.password,
        clientSecret: clientsTable.clientSecret,
        redirectUri: clientsTable.redirectUri,
        hostedUri: clientsTable.hostedUri,
      })
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    if (!clients || clients.length === 0) {
      throw ApiError.badRequest("No client account found with this email");
    }

    const primaryClient = clients[0];
    if (!primaryClient) {
      throw ApiError.badRequest("No client account found with this email");
    }

    const isPasswordValid = await psw.verify(userPass, primaryClient.hashedPass);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = generateClientToken({
      email: primaryClient.email,
      clientId: primaryClient.clientId,
    });

    return ApiResponse.success("Client authenticated successfully", {
      token,
      accessToken: token,
      email: primaryClient.email,
      clientId: primaryClient.clientId,
      clientName: primaryClient.clientName,
      clientSecret: primaryClient.clientSecret,
      clientSecrert: primaryClient.clientSecret, // compatibility fallback
      redirectUri: primaryClient.redirectUri,
      hostedUri: primaryClient.hostedUri,
      totalApplications: clients.length,
    });
  }

  static async getMe(email: string) {
    const clients = await db
      .select({
        clientId: clientsTable.id,
        clientName: clientsTable.clientName,
        email: clientsTable.email,
        redirectUri: clientsTable.redirectUri,
        hostedUri: clientsTable.hostedUri,
      })
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    if (!clients || clients.length === 0) {
      throw ApiError.notFound("Developer account not found");
    }

    return ApiResponse.success("Developer profile retrieved", {
      email,
      totalApplications: clients.length,
      applications: clients,
    });
  }

  static async getApplications(email: string) {
    const apps = await db
      .select({
        clientId: clientsTable.id,
        clientName: clientsTable.clientName,
        email: clientsTable.email,
        redirectUri: clientsTable.redirectUri,
        hostedUri: clientsTable.hostedUri,
      })
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    return ApiResponse.success("Registered applications retrieved", apps);
  }

  static async getApplicationById(email: string, clientId: string) {
    const [app] = await db
      .select({
        clientId: clientsTable.id,
        clientName: clientsTable.clientName,
        email: clientsTable.email,
        redirectUri: clientsTable.redirectUri,
        hostedUri: clientsTable.hostedUri,
      })
      .from(clientsTable)
      .where(and(eq(clientsTable.id, clientId), eq(clientsTable.email, email)));

    if (!app) {
      throw ApiError.notFound("Application not found or access denied");
    }

    return ApiResponse.success("Application details retrieved", app);
  }

  static async createApplication(
    email: string,
    { clientName, redirectUri, hostedUri }: CreateAppData,
  ) {
    const [owner] = await db
      .select({ password: clientsTable.password })
      .from(clientsTable)
      .where(eq(clientsTable.email, email));

    if (!owner) {
      throw ApiError.unauthorized("Developer account not found");
    }

    const clientSecret = crypto.randomBytes(32).toString("hex");

    const [insertResult] = await db
      .insert(clientsTable)
      .values({
        clientName,
        clientSecret,
        email,
        password: owner.password,
        hostedUri: hostedUri || "",
        redirectUri,
      })
      .returning({ id: clientsTable.id });

    if (!insertResult) {
      throw ApiError.internalServerError("Error creating application");
    }

    return ApiResponse.created("Application registered successfully", {
      clientId: insertResult.id,
      clientSecret,
      clientName,
      email,
      redirectUri,
      hostedUri: hostedUri || "",
    });
  }
}
