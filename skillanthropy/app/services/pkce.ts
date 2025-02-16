import crypto from "crypto";

// PKCE adds an extra layer of security to ensure only the original client can exchange the authorization code for tokens.
// Generate code verifier and code challenge when using Authorization with PKCE flow in zitadel
export function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}
