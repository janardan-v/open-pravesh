import JWT, { type SignOptions } from "jsonwebtoken";
import ApiError from "../../../common/utils/apiError";

export interface ClientTokenPayload {
  email: string;
  clientId?: string;
}

export const createClientId = (payload: { id: string }): string => {
  const secret = process.env.CLIENT_TOKEN_SECRET;

  if (!secret) {
    throw new Error("CLIENT_TOKEN_SECRET is not defined");
  }

  return JWT.sign(payload, secret);
};

export const generateClientToken = (
  payload: ClientTokenPayload,
  expiresIn: SignOptions["expiresIn"] = "7d",
): string => {
  const secret = process.env.CLIENT_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CLIENT_TOKEN_SECRET is not defined");
  }
  return JWT.sign(payload, secret, { expiresIn });
};

export const verifyClientToken = (token: string): ClientTokenPayload => {
  const secret = process.env.CLIENT_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CLIENT_TOKEN_SECRET is not defined");
  }
  try {
    const decoded = JWT.verify(token, secret) as ClientTokenPayload;
    return decoded;
  } catch (error) {
    throw ApiError.unauthorized("Invalid or expired client session token");
  }
};
