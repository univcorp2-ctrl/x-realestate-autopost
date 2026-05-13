type OAuthSecrets = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function createOAuth1Header(method: string, url: string, secrets: OAuthSecrets): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: secrets.apiKey,
    oauth_nonce: randomNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: secrets.accessToken,
    oauth_version: "1.0"
  };

  const paramString = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(secrets.apiSecret)}&${percentEncode(secrets.accessTokenSecret)}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(baseString));
  const oauthSignature = arrayBufferToBase64(signatureBuffer);

  const headerParams = { ...oauthParams, oauth_signature: oauthSignature };
  return "OAuth " + Object.entries(headerParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ");
}
