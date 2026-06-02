import { Router } from "express";
import * as dbBridge from "../db";

const router = Router();

// Helper to generate a compliant JWT-styled token that decodeJwtSafely can decode manually
function generateMockToken(uid: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(JSON.stringify({ uid, email, iat: Math.floor(Date.now() / 1000) })).toString("base64");
  const signature = "mock_secure_local_signature";
  return `${header}.${payload}.${signature}`;
}

// 1. Password Registration Endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail and password are required fields." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const existing = await dbBridge.getUserByEmail(trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: "A user profile with this email address already exists on the portal." });
    }

    const uid = "user_" + Math.random().toString(36).substring(2, 15);
    const userProfile = {
      uid,
      email: trimmedEmail,
      password: password, // For human-readable/direct verification as requested by panel
      displayName: displayName || "Portal Client",
      role: trimmedEmail === "fakharalimirza@gmail.com" ? "super_admin" : "guest",
      createdAt: new Date().toISOString(),
      wishlist: []
    };

    await dbBridge.saveUser(uid, userProfile);

    const token = generateMockToken(uid, trimmedEmail);
    res.json({
      success: true,
      token,
      user: {
        uid,
        email: trimmedEmail,
        displayName: userProfile.displayName,
        role: userProfile.role
      }
    });
  } catch (err: any) {
    console.error("Auth Register Error:", err);
    res.status(500).json({ error: err.message || "Failed to finalize registration." });
  }
});

// 2. Direct Password Login Endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail address and password credentials are required." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await dbBridge.getUserByEmail(trimmedEmail);

    if (!user) {
      return res.status(400).json({ error: "No profile matching this email address was found. Check your details or contact admin." });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "Incorrect password. Please try again or request a reset from your manager." });
    }

    const token = generateMockToken(user.uid, user.email);
    res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error("Auth Login Error:", err);
    res.status(500).json({ error: err.message || "Credential verification system failed." });
  }
});

export default router;
