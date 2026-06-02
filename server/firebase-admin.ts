import { Request } from "express";

export function getFirebaseBucket() {
  console.warn("getFirebaseBucket called. GCS storage is disabled as cPanel VPS FTP Storage is active.");
  return null;
}

export const ensureAdminInitialized = () => {
  // No-Op since firebase is disabled
};

export const decodeJwtSafely = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1];
    const decodedPayload = Buffer.from(payloadB64, 'base64').toString('utf-8');
    return JSON.parse(decodedPayload);
  } catch (e) {
    console.error("Failed to parse JWT payload manually:", e);
    return null;
  }
};

export const verifyAdminRole = async (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization credential header");
  }
  const idToken = authHeader.split("Bearer ")[1];
  
  const decodedToken = decodeJwtSafely(idToken);
  if (!decodedToken || !decodedToken.uid) {
    throw new Error("Failed to verify credentials identity token");
  }
  
  const { getUser } = await import("./db");
  const user = await getUser(decodedToken.uid);
  if (!user) {
    throw new Error("Associated system profile record was not found or was removed");
  }
  const role = user.role;
  if (!["super_admin", "admin", "host", "agent"].includes(role || "")) {
    throw new Error("Requires administrative or portal personnel privileges");
  }
  return {
    uid: decodedToken.uid,
    email: decodedToken.email || user.email,
    role,
    displayName: user.displayName || "Administrative Officer"
  };
};
