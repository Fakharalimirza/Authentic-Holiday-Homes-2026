import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin lazily to prevent startup crashes
let bucket: any = null;

function getFirebaseBucket() {
  if (bucket) return bucket;
  
  if (!admin.apps.length) {
    try {
      const cleanVar = (val: string | undefined) => {
        if (!val) return val;
        let c = val.trim();
        while ((c.startsWith("'") && c.endsWith("'")) || (c.startsWith('"') && c.endsWith('"'))) {
          c = c.slice(1, -1);
        }
        return c;
      };

      let storageBucket = cleanVar(process.env.FIREBASE_STORAGE_BUCKET);
      
      const firebaseConfigPath = path.resolve(process.cwd(), "firebase-applet-config.json");
      if (!storageBucket && fs.existsSync(firebaseConfigPath)) {
        const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
        storageBucket = firebaseConfig.storageBucket;
      }

      let serviceAccount = cleanVar(process.env.FIREBASE_SERVICE_ACCOUNT);
      let projectId = "";
      
      if (serviceAccount) {
        try {
          let parsedAccount;
          try {
            parsedAccount = JSON.parse(serviceAccount);
          } catch (e) {
            const repaired = serviceAccount.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
            parsedAccount = JSON.parse(repaired);
          }

          if (parsedAccount.private_key) {
             parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
          }
          projectId = parsedAccount.project_id;

          admin.initializeApp({
            credential: admin.credential.cert(parsedAccount),
            storageBucket: storageBucket
          });
          console.log("Firebase Admin initialized with Service Account for project:", projectId);
        } catch (err) {
          console.error("Failed to parse Service Account:", err.message);
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            storageBucket: storageBucket
          });
        }
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket: storageBucket
        });
      }

      console.log("Firebase Admin initialized successfully. Primary Bucket:", storageBucket);
    } catch (error) {
      console.error("Firebase Admin Initialization Error:", error);
      return null;
    }
  }

  // Try to get the bucket, with a fallback if the primary one fails
  try {
    bucket = admin.storage().bucket();
    // Test the bucket access lightly if possible, or just catch it later
    return bucket;
  } catch (err) {
    console.error("Default bucket access failed:", err.message);
    return null;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Image Upload & Processing Endpoint
  app.post("/api/admin/upload-property-images", upload.array("images"), async (req, res) => {
    console.log("Starting image upload process...");
    try {
      const { unitNumber, buildingName } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        console.warn("No files in request");
        return res.status(400).json({ error: "No images provided" });
      }

      if (!unitNumber || !buildingName) {
        console.warn("Missing unit or building info");
        return res.status(400).json({ error: "Missing unitNumber or buildingName" });
      }

      const bucket = getFirebaseBucket();
      if (!bucket) {
        console.error("Bucket not initialized");
        return res.status(500).json({ error: "Firebase Storage not configured" });
      }

      const folderName = `${unitNumber} - ${buildingName}`;
      const results = [];

      // Process files sequentially to avoid OOM in small containers
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileIndex = i + 1;
        console.log(`Processing image ${fileIndex}/${files.length}`);
        
        try {
          // Process only WebP for now to ensure reliability and speed within resource limits
          const webpBuffer = await sharp(file.buffer).webp({ quality: 75 }).toBuffer();
          // Minimal PNG as fallback
          const pngBuffer = await sharp(file.buffer).png({ compressionLevel: 9 }).toBuffer();

          const formats = [
            { buffer: webpBuffer, ext: "webp", contentType: "image/webp" },
            { buffer: pngBuffer, ext: "png", contentType: "image/png" }
          ];

          const imageSet = await Promise.all(formats.map(async (format) => {
            const fileName = `${folderName}/${fileIndex}.${format.ext}`;
            console.log(`Uploading ${fileName}...`);
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream({
              metadata: { contentType: format.contentType },
              resumable: false
            });

            return new Promise((resolve, reject) => {
              blobStream.on("error", (err) => {
                console.error(`Error uploading ${fileName}:`, err);
                reject(err);
              });
              blobStream.on("finish", async () => {
                try {
                  console.log(`Uploaded ${fileName}, making public...`);
                  await blob.makePublic();
                  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                  resolve({ format: format.ext, url: publicUrl });
                } catch (pubErr) {
                  console.error(`Error making ${fileName} public:`, pubErr);
                  resolve({ format: format.ext, url: `https://storage.googleapis.com/${bucket.name}/${fileName}` });
                }
              });
              blobStream.end(format.buffer);
            });
          }));
          results.push(imageSet);
        } catch (sharpError) {
          console.error(`Sharp processing error for image ${fileIndex}:`, sharpError);
          throw sharpError;
        }
      }

      console.log("Upload complete!");
      res.json({ success: true, folder: folderName, images: results });

    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process and upload images" });
    }
  });

  // SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.authenticholidayhomes.ae",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "website@authenticholidayhomes.ae",
      pass: process.env.SMTP_PASS,
    },
  });

  // Contact Form Submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, message } = req.body;
      
      if (!firstName || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.SMTP_PASS) {
        console.warn("SMTP_PASS not set. Email not sent.");
        return res.status(500).json({ error: "Mail server not configured" });
      }

      const mailOptions = {
        from: `"Website Contact Form" <${process.env.SMTP_USER || "website@authenticholidayhomes.ae"}>`,
        to: process.env.CONTACT_RECIPIENT || "it@authenticholidayhomes.ae",
        subject: `New Contact Inquiry from ${firstName} ${lastName}`,
        text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
        replyTo: email
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Nodemailer Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // AI Property Description Enhancer
  app.post("/api/ai/enhance-description", async (req, res) => {
    try {
      const { title, amenities, location } = req.body;
      const prompt = `Write a premium, attractive holiday home description for a property named "${title}" located in ${location}. Amenities include: ${amenities.join(", ")}. Keep it under 150 words and focus on a luxurious, relaxing experience.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      res.json({ description: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate description" });
    }
  });

  // Stripe Payment Intent
  app.post("/api/payments/create-intent", async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    try {
      const { amount, currency = 'usd', metadata } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // amount in cents
        currency,
        metadata
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Payment failed" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
