import JWT from "jsonwebtoken";

export const createClientId = (payload: { id: string }): string => {
  const secret = process.env.CLIENT_TOKEN_SECRET;

  if (!secret) {
    throw new Error("CLIENT_TOKEN_SECRET is not defined");
  }

  return JWT.sign(payload, secret);
};
