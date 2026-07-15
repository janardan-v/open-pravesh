import ApiError from "../../common/utils/apiError";
import inMemoryTable from "../../db/inMemory";
import verifyClient from "../../common/utils/verifyClient";
import type { authenticateUserData } from "./oAuthModel";
import crypto from "crypto";
import ApiResponse from "../../common/utils/apiResponse";
import { getPrivateKey } from "../../common/utils/pemTojwk";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../common/utils/jwtUtils";

interface tokenGenerationPayload {
  clientId: string;
  clientSecret: string;
  authCode: string;
  userId: string;
}

export default class oAuthServices {
  static async tokenGenerationService({
    clientId,
    clientSecret,
    authCode,
    userId,
  }: tokenGenerationPayload) {
    // look for client exits or not
    const { redirectUri } = await verifyClient(clientId);

    // const client = Object.keys(inMemoryTable).find((key) => key == clientId);
    const client = inMemoryTable[clientId];

    if (!client) {
      throw ApiError.notFound("No user from this client exist");
    }
    // look for secret match with db or not
    if (client.clientSecret !== clientSecret) {
      throw ApiError.unauthorized("Client secret is not valid");
    }
    if (client.authentication.code != authCode) {
      throw ApiError.forbidden("Invalid code");
    }
    // check if short code is expired or not
    if (Date.now() > client.authentication.expiresAt) {
      throw ApiError.unauthorized("Authentication code is expired");
    }

    // not expired generate access and refresh Token
    const payload = {
      userId,
    };

    const accessToken = generateAccessToken(payload, getPrivateKey());
    const refreshToken = generateRefreshToken(payload, getPrivateKey());

    return ApiResponse.created("Tokens generated successully", {
      accessToken,
      refreshToken,
    });
  }

  static async authenticateUser({ clientId }: authenticateUserData) {
    const { clientSecret, redirectUri } = await verifyClient(clientId);

    const authenticationCode = crypto.randomBytes(32).toString("hex");

    inMemoryTable[clientId] = {
      clientSecret,
      authentication: {
        code: authenticationCode,
        expiresAt: Date.now() + 1000 * 60,
      },
    };

    const responseUrl = new URL(redirectUri);
  
    responseUrl.searchParams.set("code", authenticationCode);

    return ApiResponse.success("User authenticated", {
      redirectUrl: responseUrl.toString(),
    });
  }
}
