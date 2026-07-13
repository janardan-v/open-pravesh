import fs from "fs";
import jose from "node-jose";
import ApiError from "./apiError";

import dotenv from "dotenv";
dotenv.config();

let publicJWKS: object;
let privateKey: Buffer;

async function initialiseJWKS() {
  const publicKeyPath = process.env.PUBLIC_KEY_PATH;
  const privateKeyPath = process.env.PRIVATE_KEY_PATH;

  if (!publicKeyPath) {
    throw ApiError.notFound("PUBLIC_KEY_PATH is not defined");
  }
  if (!privateKeyPath) {
    throw ApiError.notFound("PRIVATE_KEY_PATH is not defined");
  }

  const publicKey = fs.readFileSync(publicKeyPath);

  const keystore = jose.JWK.createKeyStore();

  await keystore.add(publicKey, "pem");

  privateKey = fs.readFileSync(privateKeyPath);

  // false => Don't include private key fields
  publicJWKS = keystore.toJSON(false);
}

function getPrivateKey() {
  return privateKey;
}

function getPublicJWKS() {
  return publicJWKS;
}

export { initialiseJWKS, getPrivateKey, getPublicJWKS };
