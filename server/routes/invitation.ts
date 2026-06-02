import { Router } from "express";
import * as dbBridge from "../db";
import { verifyAdminRole } from "../firebase-admin";

const router = Router();

// 3. Verify Invitation Token
router.get("/invite/verify", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Secure registration token is required" });
    }

    const invite = await dbBridge.getInvitation(token as string);

    if (!invite) {
      return res.status(444).json({ error: "We could not find that registration token. Please check that the URL matches your invitation link." });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: `Invite registered token already matches status: ${invite.status}.` });
    }

    res.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        note: invite.note
      }
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Accept Invitation Secure Signup Process
router.post("/invite/accept", async (req, res) => {
  console.log("Processing guest setup invitation accepting workflow...");
  try {
    const { token, password, displayName, phone } = req.body;

    if (!token || !password || !displayName) {
      return res.status(400).json({ error: "Missing required setup values: token, password, displayName" });
    }

    const invite = await dbBridge.getInvitation(token);

    if (!invite) {
      return res.status(444).json({ error: "Invalid invitation credentials" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: `This invitation link is no longer valid. Status: ${invite.status}` });
    }

    const email = invite.email;
    const role = invite.role;

    // Generate standard unique identifier
    const uid = "user_" + Math.random().toString(36).substring(2, 15);

    // Register user profile directly in cPanel SQL instead of GCS Firebase Auth
    console.log(`Finalizing User Registration directly in SQL database for email: ${email}`);
    await dbBridge.saveUser(uid, {
      uid,
      email,
      password, // Password field stored directly in db
      displayName,
      phone: phone || "",
      role,
      wishlist: []
    });

    // Update state of invitation record
    await dbBridge.saveInvitation(token, {
      ...invite,
      status: "accepted",
      acceptedBy: uid,
      acceptedAt: new Date().toISOString()
    });

    // Log successful enrollment in Audit trace
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "HTTP Auth Client";
    await dbBridge.saveAuditLog({
      userId: uid,
      userEmail: email,
      userRole: role,
      action: "INVITE_ACCEPTED",
      details: `Profile fully onboarded in database with role: ${role}`,
      ip: ip.replace("::ffff:", ""),
      userAgent
    });

    res.json({
      success: true,
      message: "Your portal profile is successfully established! You can now log in securely with your credentials.",
      email
    });
  } catch (err: any) {
    console.error("Acceptance processing failed: ", err);
    res.status(500).json({ error: err.message || "Failed to finalize the registration onboarding." });
  }
});

// 5. Create restricted user Invitation Token - Restricted to verified administrators
router.post("/invite/create", async (req, res) => {
  console.log("Request to issue restricted staff invitation...");
  try {
    const adminUser = await verifyAdminRole(req);

    const { email, role, note } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "E-mail address and specific role are mandatory details." });
    }

    // Check for duplicate account in our SQL database first (completely replacing Firebase check!)
    const duplicate = await dbBridge.getUserByEmail(email);
    if (duplicate) {
      return res.status(400).json({ error: `A registered user with email '${email}' is already enrolled on the site.` });
    }

    // Check if existing pending code is logged in invitations
    const allInvites = await dbBridge.getAllInvitations();
    const existingPending = allInvites.find(
      (inv) => inv.email === email.toLowerCase().trim() && inv.status === "pending"
    );

    if (existingPending) {
      return res.status(400).json({ error: `An invitation for '${email}' is already pending. Code is: ${existingPending.token}` });
    }

    // Generate secure 32-character hexadecimal token for invitation
    const crypto = await import("crypto");
    const secureToken = crypto.randomBytes(16).toString("hex");

    const inviteData = {
      email: email.toLowerCase().trim(),
      role,
      note: note || "",
      status: "pending",
      invitedBy: adminUser.uid,
      invitedByEmail: adminUser.email,
      createdAt: new Date().toISOString()
    };

    await dbBridge.saveInvitation(secureToken, inviteData);

    // Log invitation in Audit Logs
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Admin Web Device";
    await dbBridge.saveAuditLog({
      userId: adminUser.uid,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: "SEND_INVITE",
      details: `Generated secure invitation token for new role [${role}] and email: ${email}`,
      ip: ip.replace("::ffff:", ""),
      userAgent
    });

    res.json({
      success: true,
      token: secureToken,
      inviteUrl: `/accept-invite?token=${secureToken}`,
      invite: inviteData
    });
  } catch (err: any) {
    console.error("Creation of token failed: ", err);
    res.status(500).json({ error: err.message || "Could not publish registration credentials." });
  }
});

// 6. List Invitation Trails (Restricted to verified administrators)
router.get("/admin/invitations", async (req, res) => {
  try {
    await verifyAdminRole(req);

    const invites = await dbBridge.getAllInvitations();
    res.json({ success: true, invites });
  } catch (err: any) {
    console.error("List invites failure: ", err);
    res.status(403).json({ error: err.message || "Unauthorized to access invitations roster." });
  }
});

// 7. Revoke/Delete Invitation Token
router.delete("/admin/invitations/:token", async (req, res) => {
  try {
    const adminUser = await verifyAdminRole(req);

    const { token } = req.params;
    const invite = await dbBridge.getInvitation(token);
    if (!invite) {
      return res.status(404).json({ error: "Specified invitation was not found" });
    }

    await dbBridge.deleteInvitation(token);

    // Log revoking detail
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Admin Web Device";
    await dbBridge.saveAuditLog({
      userId: adminUser.uid,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: "REVOKE_INVITE",
      details: `Revoked a pending invite token for email: ${invite.email}`,
      ip: ip.replace("::ffff:", ""),
      userAgent
    });

    res.json({ success: true, message: "Invitation successfully revoked." });
  } catch (err: any) {
    console.error("Revoking failed :", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
