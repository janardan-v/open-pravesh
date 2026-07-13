import jwt from "jsonwebtoken";

export const generateAccessToken = (payload: object, privateKey: Buffer) => {
  const accessToken = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1d",
  });
  return accessToken;
};
export const generateRefreshToken = (payload: object, privateKey: Buffer) => {
  const refreshToken = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
  });
  return refreshToken;
};


