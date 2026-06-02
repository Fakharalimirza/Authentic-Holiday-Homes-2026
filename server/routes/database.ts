import { Router } from "express";
import * as dbBridge from "../db";
import * as ftp from "basic-ftp";
import { emitToUser, emitToStaff, emitToAll } from "../socket";

const router = Router();

// --- PROPERTIES ---
router.get("/properties", async (req, res) => {
  try {
    const amenitiesQuery = req.query.amenities;
    let amenities: string[] | undefined = undefined;
    if (typeof amenitiesQuery === 'string' && amenitiesQuery.trim()) {
      amenities = amenitiesQuery.split(',').map(s => s.trim()).filter(Boolean);
    }
    const list = await dbBridge.getAllProperties({ amenities });
    res.json({ success: true, properties: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/properties/:id", async (req, res) => {
  try {
    const item = await dbBridge.getProperty(req.params.id);
    if (!item) return res.status(404).json({ error: "Property not found" });
    res.json({ success: true, property: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/properties", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Property ID is required" });
    await dbBridge.saveProperty(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/properties/:id", async (req, res) => {
  try {
    await dbBridge.deleteProperty(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEWS ---
router.get("/properties/:id/reviews", async (req, res) => {
  try {
    const list = await dbBridge.getPropertyReviews(req.params.id);
    res.json({ success: true, reviews: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/properties/:id/reviews", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const reviewId = id || Math.random().toString(36).substring(2, 15);
    await dbBridge.saveReview(reviewId, req.params.id, data);
    res.json({ success: true, id: reviewId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOOKINGS ---
router.get("/bookings", async (req, res) => {
  try {
    const list = await dbBridge.getAllBookings();
    res.json({ success: true, bookings: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Booking ID is required" });
    await dbBridge.saveBooking(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await dbBridge.updateBookingStatus(req.params.id, status);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TURNOVERS ---
router.get("/turnovers", async (req, res) => {
  try {
    const list = await dbBridge.getAllTurnovers();
    res.json({ success: true, turnovers: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/turnovers", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Turnover ID is required" });
    await dbBridge.saveTurnover(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TICKETS ---
router.get("/tickets", async (req, res) => {
  try {
    const list = await dbBridge.getAllTickets();
    res.json({ success: true, tickets: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tickets", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Ticket ID is required" });
    await dbBridge.saveTicket(id, data);
    
    // Emit real-time Socket.io updates to staff and the specific guest user
    emitToStaff("ticket:updated", { id, ...data });
    if (data.userId) {
      emitToUser(data.userId, "ticket:updated", { id, ...data });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SECURED_DOCUMENTS ---
router.get("/secured_documents", async (req, res) => {
  try {
    const list = await dbBridge.getAllDocuments();
    res.json({ success: true, documents: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/secured_documents", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Document ID is required" });
    await dbBridge.saveDocument(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/secured_documents/:id", async (req, res) => {
  try {
    await dbBridge.deleteDocument(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- USERS ---
router.get("/users", async (req, res) => {
  try {
    const list = await dbBridge.getAllUsers();
    res.json({ success: true, users: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/:uid", async (req, res) => {
  try {
    const item = await dbBridge.getUser(req.params.uid);
    if (!item) return res.status(404).json({ error: "User profile not found in database bridge" });
    res.json({ success: true, user: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/users/:uid", async (req, res) => {
  try {
    await dbBridge.saveUser(req.params.uid, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ---
router.get("/settings/:id", async (req, res) => {
  try {
    const item = await dbBridge.getSettings(req.params.id);
    res.json({ success: true, settings: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/settings", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const targetId = id || "global";
    await dbBridge.saveSettings(targetId, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/settings/:id", async (req, res) => {
  try {
    await dbBridge.saveSettings(req.params.id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STAFF MESSAGES ---
router.get("/staff_messages", async (req, res) => {
  try {
    const list = await dbBridge.getAllStaffMessages();
    res.json({ success: true, messages: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/staff_messages", async (req, res) => {
  try {
    await dbBridge.saveStaffMessage(req.body);
    
    // Broadcast public chat notification to all active staff rooms
    emitToStaff("staff_message:created", req.body);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STAFF DMS ---
router.get("/staff_dms", async (req, res) => {
  try {
    const list = await dbBridge.getAllStaffDMs();
    res.json({ success: true, dms: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/staff_dms", async (req, res) => {
  try {
    await dbBridge.saveStaffDM(req.body);
    
    // Distribute Socket DM event directly to both participants in real-time
    const { senderId, recipientId } = req.body;
    if (recipientId) emitToUser(recipientId, "dm:created", req.body);
    if (senderId) emitToUser(senderId, "dm:created", req.body);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DEVICE TOKENS ROUTER (PREPARATION FOR MOBILE NOTIFICATIONS) ---
router.post("/device_tokens", async (req, res) => {
  try {
    const { userId, token, platform } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ error: "userId and token are required params" });
    }
    await dbBridge.saveDeviceToken(userId, token, platform || "web");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/device_tokens/:token", async (req, res) => {
  try {
    await dbBridge.deleteDeviceToken(req.params.token);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DIAGNOSTIC STATUS ---
async function getOutboundIp() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return "Dynamic Cloud IP (Resolution offline)";
    const data = await res.json() as any;
    return data.ip || "Dynamic Cloud IP";
  } catch (err) {
    return "Dynamic Cloud IP";
  }
}

async function testFtpConnection(): Promise<{ success: boolean; error: string | null }> {
  const host = process.env.VPS_FTP_HOST;
  if (!host) {
    return { success: false, error: "cPanel VPS FTP host (VPS_FTP_HOST) is not configured in the environment variables." };
  }
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    let hostToConnect = host;
    if (hostToConnect === "ftp.jad-etude.pro") {
      hostToConnect = "media.authenticholidayhomes.ae";
    }
    const secureOpt = process.env.VPS_FTP_SECURE === "true";
    await Promise.race([
      client.access({
        host: hostToConnect,
        user: process.env.VPS_FTP_USER,
        password: process.env.VPS_FTP_PASS,
        port: parseInt(process.env.VPS_FTP_PORT || "21"),
        secure: secureOpt,
        secureOptions: {
          rejectUnauthorized: false
        }
      }),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("FTP connection test timed out (2.5s)")), 2500))
    ]);
    await client.close();
    return { success: true, error: null };
  } catch (err: any) {
    try { client.close(); } catch (e) {}
    return { success: false, error: err.message || String(err) };
  }
}

// --- LANDLORDS (OWNERS) ---
router.get("/landlords", async (req, res) => {
  try {
    const list = await dbBridge.getAllLandlords();
    res.json({ success: true, landlords: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/landlords/:id", async (req, res) => {
  try {
    const item = await dbBridge.getLandlord(req.params.id);
    if (!item) return res.status(404).json({ error: "Landlord not found" });
    res.json({ success: true, landlord: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/landlords", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Landlord ID is required" });
    await dbBridge.saveLandlord(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/landlords/bulk", async (req, res) => {
  try {
    const { landlords } = req.body;
    if (!Array.isArray(landlords)) {
      return res.status(400).json({ error: "An array of landlords is required" });
    }
    let count = 0;
    for (const raw of landlords) {
      if (!raw.fullName || !raw.fullName.trim()) continue;
      const id = raw.id || `landlord_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const data = {
        fullName: raw.fullName.trim(),
        email: (raw.email || '').trim(),
        phone: (raw.phone || '').trim(),
        identityNumber: (raw.identityNumber || '').trim(),
        identityDocumentUrl: raw.identityDocumentUrl || null,
        nationality: (raw.nationality || '').trim(),
        bankName: (raw.bankName || '').trim(),
        bankAccountHolder: (raw.bankAccountHolder || '').trim(),
        bankAccountNumber: (raw.bankAccountNumber || '').trim(),
        swiftCode: (raw.swiftCode || '').trim(),
        iban: (raw.iban || '').trim(),
        bankBranch: (raw.bankBranch || '').trim()
      };
      await dbBridge.saveLandlord(id, data);
      count++;
    }
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/landlords/:id", async (req, res) => {
  try {
    await dbBridge.deleteLandlord(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BUILDINGS ---
router.get("/buildings", async (req, res) => {
  try {
    const list = await dbBridge.getAllBuildings();
    res.json({ success: true, buildings: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/buildings/:id", async (req, res) => {
  try {
    const item = await dbBridge.getBuilding(req.params.id);
    if (!item) return res.status(404).json({ error: "Building not found" });
    res.json({ success: true, building: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/buildings", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Building ID is required" });
    await dbBridge.saveBuilding(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/buildings/:id", async (req, res) => {
  try {
    await dbBridge.deleteBuilding(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- UNITS ---
router.get("/units", async (req, res) => {
  try {
    const list = await dbBridge.getAllUnits();
    res.json({ success: true, units: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/units/:id", async (req, res) => {
  try {
    const item = await dbBridge.getUnit(req.params.id);
    if (!item) return res.status(404).json({ error: "Unit not found" });
    res.json({ success: true, unit: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/units", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Unit ID is required" });
    await dbBridge.saveUnit(id, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/units/:id", async (req, res) => {
  try {
    await dbBridge.deleteUnit(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const active = await dbBridge.isMySqlActive();
    const ftpStatus = await testFtpConnection();
    const outboundIp = await getOutboundIp();
    res.json({
      success: true,
      active,
      dbError: active ? null : dbBridge.getLastMySqlError(),
      ftpActive: ftpStatus.success,
      ftpError: ftpStatus.error,
      outboundIp,
      config: {
        host: process.env.DB_HOST || "",
        database: process.env.DB_NAME || "",
        user: process.env.DB_USER || "",
        port: process.env.DB_PORT || "3306"
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
