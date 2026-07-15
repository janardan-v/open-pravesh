import jwt from "jsonwebtoken";
import ApiError from "./apiError";
import ApiResponse from "./apiResponse";

export const generateAccessToken = (payload: object, privateKey: Buffer) => {
  const accessToken = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1d",
  });
  return accessToken;
};

export const verifyAccessToken = (token: string, privateKey: Buffer) => {
  try {
    const accessToken = jwt.sign(token, privateKey);
    return ApiResponse.success("Token verified", accessToken);
  } catch (error) {
    throw ApiError.unauthorized("Invalid token");
  }
};
export const generateRefreshToken = (payload: object, privateKey: Buffer) => {
  const refreshToken = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
  });
  return refreshToken;
};
