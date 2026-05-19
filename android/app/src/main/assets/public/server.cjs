var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_stripe = __toESM(require("stripe"), 1);
import_dotenv.default.config();
var stripe = process.env.STRIPE_SECRET_KEY ? new import_stripe.default(process.env.STRIPE_SECRET_KEY) : null;
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/ai/enhance-description", async (req, res) => {
    try {
      const { title, amenities, location } = req.body;
      const prompt = `Write a premium, attractive holiday home description for a property named "${title}" located in ${location}. Amenities include: ${amenities.join(", ")}. Keep it under 150 words and focus on a luxurious, relaxing experience.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      res.json({ description: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate description" });
    }
  });
  app.post("/api/payments/create-intent", async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    try {
      const { amount, currency = "usd", metadata } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        // amount in cents
        currency,
        metadata
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Payment failed" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
