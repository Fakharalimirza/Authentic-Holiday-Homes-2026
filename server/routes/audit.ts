import { Router } from "express";
import * as dbBridge from "../db";
import { verifyAdminRole, ensureAdminInitialized } from "../firebase-admin";

const router = Router();

// 1. Audit Logging Registry - Secure Activity Logger Pipeline
router.post("/audit/log", async (req, res) => {
  console.log("Receiving audit registration requests...");
  try {
    ensureAdminInitialized();
    const { userId, userEmail, userRole, action, details } = req.body;

    if (!action) {
      return res.status(400).json({ error: "No action value provided for audit registry" });
    }

    // Automatically trace client and agent parameters
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Generic HTTP System";

    const logEntry = {
      userId: userId || "anonymous",
      userEmail: userEmail || "anonymous",
      userRole: userRole || "guest",
      action,
      details: details || "",
      ip: ip.replace("::ffff:", ""),
      userAgent
    };

    console.log(`Writing audit logged event (${action}) to database...`);
    await dbBridge.saveAuditLog(logEntry);
    
    res.json({ success: true, logged: true });
  } catch (err: any) {
    console.error("Secure activity logger pipeline failed: ", err);
    res.status(500).json({ error: "Failed to record audit activity log: " + err.message });
  }
});

// 2. Fetch Audit Logs Registry - Limited to Portal Administrators
router.get("/admin/audit-logs", async (req, res) => {
  console.log("Fetching administration audit records trail...");
  try {
    ensureAdminInitialized();
    await verifyAdminRole(req);

    const logs = await dbBridge.getAllAuditLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    console.error("Fetch audit logs failure:", err);
    res.status(403).json({ error: err.message || "Unauthorized to access the logs" });
  }
});

export default router;
