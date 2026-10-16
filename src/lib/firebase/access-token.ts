import { sign } from "node:crypto";

const tokenUrl = "https://oauth2.googleapis.com/token";

export async function serviceAccountAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = encode({ alg: "RS256", typ: "JWT" }) + "." + encode({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/userinfo.email",
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  });
  const assertion = unsigned + "." + sign("RSA-SHA256", Buffer.from(unsigned), privateKey).toString("base64url");
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok || typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    // Never include the assertion, private key, or token in diagnostics.
    const code = typeof data.error === "string" && /^[a-z_]+$/.test(data.error) ? data.error : "invalid_response";
    throw new Error(`Google service-account OAuth failed: HTTP ${response.status}, ${code}`);
  }
  return { access_token: data.access_token, expires_in: data.expires_in };
}
