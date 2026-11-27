import { OAuth2Client } from "google-auth-library";

export interface GoogleVerifiedUser {
  email: string;
  name: string;
  sub: string;
}

/**
 * Verify a Google ID token (credential) using google-auth-library.
 * Returns the verified user payload, or null if verification fails / not configured.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleVerifiedUser | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) return null;
    return {
      email: payload.email,
      name: payload.name || payload.email,
      sub: payload.sub || ""
    };
  } catch {
    return null;
  }
}
