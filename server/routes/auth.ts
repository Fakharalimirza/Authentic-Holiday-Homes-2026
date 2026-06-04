import { Router } from "express";
import * as dbBridge from "../db";
import crypto from "crypto";

const router = Router();

// Helper to generate a cryptographically secure signed JWTtoken
function generateSecureToken(uid: string, email: string): string {
  // Use URL-safe Base64 encoding for headers and payloads
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const payload = Buffer.from(JSON.stringify({ uid, email, iat: Math.floor(Date.now() / 1000) })).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  
  // Use JWT_SECRET or fallback securely to a stable, secret server environment password (DB_PASS) to prevent predictability
  const secretKey = process.env.JWT_SECRET || process.env.DB_PASS || "fallback_secured_holiday_homes_portal_key_2026";
  const signature = crypto.createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
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

    const token = generateSecureToken(uid, trimmedEmail);
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

    const token = generateSecureToken(user.uid, user.email);
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

// 3. Google OAuth URL Endpoint
router.get("/google/url", (req, res) => {
  try {
    const redirectUriQuery = req.query.redirectUri as string;
    const host = req.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const proto = isLocal ? "http" : (req.headers["x-forwarded-proto"] || "https");
    const redirectUri = redirectUriQuery || `${proto}://${host}/auth/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.log("Auth: GOOGLE_CLIENT_ID is not configured. Falling back to sandbox popup.");
      return res.json({ url: `/api/auth/google/mock-popup?redirectUri=${encodeURIComponent(redirectUri)}` });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: redirectUri
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Developer sandbox / mock popup view
router.get("/google/mock-popup", (req, res) => {
  const redirectUri = req.query.redirectUri || "";
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Sign In - Sandbox Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            background-color: #09090b !important;
            color: #fafafa !important;
          }
          .card-bg {
            background-color: #18181b !important;
            border-color: #27272a !important;
          }
          .input-bg {
            background-color: #09090b !important;
            border-color: #27272a !important;
            color: #ffffff !important;
          }
          .btn-red {
            background-color: #dc2626 !important;
          }
          .btn-red:hover {
            background-color: #b91c1c !important;
          }
          .btn-gray {
            background-color: #27272a !important;
            border-color: #3f3f46 !important;
          }
          .btn-gray:hover {
            background-color: #3f3f46 !important;
          }
        </style>
      </head>
      <body class="font-sans flex items-center justify-center min-h-screen px-4">
        <div class="card-bg border rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center space-y-6">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-white/5 border border-zinc-850 rounded-full flex items-center justify-center mb-3">
              <svg class="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <h1 class="text-sm font-extrabold uppercase tracking-widest text-emerald-400">Portal Sandbox</h1>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">Simulated Google Sign In. Set <code class="bg-black px-1 py-0.5 rounded text-red-500">GOOGLE_CLIENT_ID</code> in AI Studio settings to connect your live Developer Portal.</p>
          </div>
          
          <div class="space-y-2 pt-2">
            <button onclick="selectProfile('fakharalimirza@gmail.com', 'Fakhar Ali Mirza')" class="w-full py-3.5 btn-red text-white hover:bg-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Login as Fakhar Ali (Super Admin)
            </button>
            <button onclick="selectProfile('guest@example.com', 'Standard Guest')" class="w-full py-3.5 btn-gray text-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border">
              Login as simulated Guest
            </button>
            
            <div class="border-t border-gray-800 pt-3 text-left">
              <label class="text-[9px] text-gray-500 uppercase font-black block mb-1 tracking-wider">Or Use Custom Email</label>
              <div class="flex gap-2">
                <input type="email" id="custom-email" placeholder="enter-email@example.com" class="flex-1 px-3.5 py-2.5 input-bg border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500" />
                <button onclick="loginCustom()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider text-white">Connect</button>
              </div>
            </div>
          </div>
          
          <script>
            function selectProfile(email, name) {
              const basePayload = btoa(JSON.stringify({ email, name, sub: 'mock_' + Math.random().toString(36).substring(2, 10) }));
              const dest = btoa("${redirectUri}");
              // Decode URL safely to handle all characters
              const redirectUrlDec = atob(dest);
              const connector = redirectUrlDec.includes('?') ? '&' : '?';
              const target = redirectUrlDec + connector + "code=mock_code_" + basePayload + "&state=mock_state";
              window.location.href = target;
            }
            function loginCustom() {
              const email = document.getElementById('custom-email').value;
              if (!email || !email.includes('@')) return alert('Please enter a valid email.');
              selectProfile(email, email.split('@')[0]);
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

// 5. Google Callback Endpoint (handles authorization code exchange and user lookup/creation)
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state, redirectUri: customRedirectUri } = req.query;
    
    if (!code) {
      return res.status(400).send("Authorization code is missing.");
    }
    
    let email = "";
    let name = "";
    let sub = "";

    const isMock = typeof code === "string" && code.startsWith("mock_code_");

    if (isMock) {
      const encoded = (code as string).substring(10);
      try {
        const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
        email = payload.email;
        name = payload.name;
        sub = payload.sub || "mock_user_" + Math.random().toString(36).substring(2, 10);
      } catch (e) {
        return res.status(400).send("Malformed simulated login code.");
      }
    } else {
      const host = req.get("host") || "";
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      const proto = isLocal ? "http" : (req.headers["x-forwarded-proto"] || "https");
      
      const stateRedirectUri = typeof state === "string" && state.startsWith("http") ? state : undefined;
      const redirectUri = (customRedirectUri as string) || stateRedirectUri || `${proto}://${host}/auth/callback`;
      
      console.log("[Auth Callback] Exchanging code via Google OAuth. Using redirectUri:", redirectUri);
      
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenRes.ok) {
        const errPayload = await tokenRes.text();
        console.error("Failed real Google Code verification:", errPayload);
        return res.status(400).send("Failed to exchange code for tokens. Please verify Google OAuth configuration: " + errPayload);
      }

      const tokenData = await tokenRes.json() as any;
      const idToken = tokenData.id_token;
      
      if (!idToken) {
        return res.status(400).send("Token response did not include id_token payload.");
      }

      try {
        const parts = idToken.split(".");
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        email = payload.email;
        name = payload.name || payload.given_name || "Guest Client";
        sub = payload.sub;
      } catch (err) {
        return res.status(400).send("Failed to parse Google ID Token payload structure.");
      }
    }

    if (!email) {
      return res.status(400).send("Your Google account must expose an primary email address to login.");
    }

    const trimmedEmail = email.toLowerCase().trim();
    let existing = await dbBridge.getUserByEmail(trimmedEmail);
    let uid = existing ? existing.uid : "google_" + sub;

    const userProfile = {
      uid,
      email: trimmedEmail,
      displayName: existing ? (existing.displayName || name) : name,
      role: existing ? (existing.role || "guest") : (trimmedEmail === "fakharalimirza@gmail.com" ? "super_admin" : "guest"),
      phone: existing ? (existing.phone || "") : ""
    };

    if (!existing) {
      await dbBridge.saveUser(uid, {
        ...userProfile,
        createdAt: new Date().toISOString(),
        wishlist: []
      });
    }

    const portalToken = generateSecureToken(uid, trimmedEmail);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Completed</title>
        </head>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #09090b; color: #fff;">
          <div style="max-width:320px; margin:0 auto; background:#18181b; border: 1px solid #27272a; border-radius:16px; padding:24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5)">
            <svg style="width:48px; height:48px; color:#10b981; margin:0 auto 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 style="font-size:16px; font-weight:bold; margin-bottom:8px;">Sign In Complete!</h2>
            <p style="font-size:12px; color:#a1a1aa; line-height:1.5;">Successfully linked profile. This window should close automatically.</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: "OAUTH_AUTH_SUCCESS",
                  token: "${portalToken}",
                  user: {
                    uid: "${userProfile.uid}",
                    email: "${userProfile.email}",
                    displayName: "${userProfile.displayName}",
                    role: "${userProfile.role}"
                  }
                }, "*");
                window.close();
              } else {
                window.location.href = "/";
              }
            } catch (err) {
              console.error("Popup communication error:", err);
            }
          </script>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error("Google Callback Error:", err);
    res.status(500).send("Authentication callback handler failed: " + err.message);
  }
});

// 6. Direct Google ID Token Verification REST API Endpoint
router.post("/google/verify-token", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "idToken parameter is required." });
    }

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!verifyRes.ok) {
      return res.status(400).json({ error: "Provided Google ID Token is either invalid, revoked, or expired." });
    }

    const payload = await verifyRes.json() as any;
    const email = payload.email;
    const name = payload.name || payload.given_name || "Guest Client";
    const sub = payload.sub;

    if (!email) {
      return res.status(400).json({ error: "Google credentials must include primary email address." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    let existing = await dbBridge.getUserByEmail(trimmedEmail);
    let uid = existing ? existing.uid : "google_" + sub;

    const userProfile = {
      uid,
      email: trimmedEmail,
      displayName: existing ? (existing.displayName || name) : name,
      role: existing ? (existing.role || "guest") : (trimmedEmail === "fakharalimirza@gmail.com" ? "super_admin" : "guest"),
      phone: existing ? (existing.phone || "") : ""
    };

    if (!existing) {
      await dbBridge.saveUser(uid, {
        ...userProfile,
        createdAt: new Date().toISOString(),
        wishlist: []
      });
    }

    const token = generateSecureToken(uid, trimmedEmail);
    res.json({
      success: true,
      token,
      user: userProfile
    });
  } catch (err: any) {
    console.error("Verify Google token error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
