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
}

export default class oAuthServices {
  static async tokenGenerationService({
    clientId,
    clientSecret,
    authCode,
  }: tokenGenerationPayload) {
    // look for client exits or not
    
    const { redirectUri } = await verifyClient(clientId);

    // const client = Object.keys(inMemoryTable).find((key) => key == clientId);
    const clientWithAuthCode = inMemoryTable[authCode];

    if (!clientWithAuthCode) {
      throw ApiError.notFound("No user with this authentication code exist");
    }
    // look for secret match with db or not
    if (clientWithAuthCode.clientSecret !== clientSecret) {
      throw ApiError.unauthorized("Client secret is not valid");
    }
    // check if short code is expired or not
    if (Date.now() > clientWithAuthCode.expiresAt) {
      throw ApiError.unauthorized("Authentication code is expired");
    }

    // not expired generate access and refresh Token
    const payload = {
      userId: clientWithAuthCode.userId,
      userEmail: clientWithAuthCode.userEmail
    };

    const accessToken = generateAccessToken(payload, getPrivateKey());
    const refreshToken = generateRefreshToken(payload, getPrivateKey());

    return ApiResponse.created("Tokens generated successully", {
      accessToken,
      refreshToken,
    });
  }

  static async authenticateUser({ clientId,userEmail, userId }: authenticateUserData) {
    const { clientSecret, redirectUri } = await verifyClient(clientId);

    const authenticationCode = crypto.randomBytes(32).toString("hex");

    inMemoryTable[authenticationCode] = {
      expiresAt: Date.now() + 1000 * 60,
      clientId,
      clientSecret,
      userId: userId,
      userEmail: userEmail
    };
    console.log(inMemoryTable)

    const responseUrl = new URL(redirectUri);
  
    return ApiResponse.success("User authenticated", {
      redirectUrl: responseUrl,
      shortCode: authenticationCode
    });
  }
}
