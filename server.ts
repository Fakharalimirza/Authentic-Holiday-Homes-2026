import "./server-env";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { initSocketServer } from "./server/socket";

// Import modular API Sub-Routers
import databaseRouter from "./server/routes/database";
import migrationRouter from "./server/routes/migration";
import uploadRouter from "./server/routes/upload";
import invitationRouter from "./server/routes/invitation";
import servicesRouter from "./server/routes/services";
import auditRouter from "./server/routes/audit";
import authRouter from "./server/routes/auth";


async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parsing middleware
  app.use(express.json());

  // Mount API Routers
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mount custom credential authentication router
  app.use("/api/auth", authRouter);

  // Database Bridge Entity Endpoints (exposed under both /api/db and /api/admin for full frontend design compatibility)
  app.use("/api/db", databaseRouter);
  app.use("/api/admin", databaseRouter);
  
  // Database Migrate Endpoint
  app.use("/api/db", migrationRouter);

  // File and Document upload pipelines
  app.use("/api/admin", uploadRouter);

  // Onboarding, Authentication, and invitations
  app.use("/api", invitationRouter);

  // External services (SMTP Mailer, Stripe Payments, Gemini AI)
  app.use("/api", servicesRouter);

  // System audit activities
  app.use("/api", auditRouter);

  // Serve Single-Page React Application (Vite HMR/Static router)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Create HTTP Server around Express app
  const httpServer = createHttpServer(app);

  // Attach real-time event layer
  initSocketServer(httpServer);

  // Bind and listen on HTTP Server wrapper
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Authentic Holiday Homes] Portal platform is live on http://localhost:${PORT}`);
  });
}

startServer();

