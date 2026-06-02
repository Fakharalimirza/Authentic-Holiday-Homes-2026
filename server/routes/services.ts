import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import Stripe from "stripe";

const router = Router();

// Lazy Stripe initialization
const getStripe = () => {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
};

// Lazy initialization of Gemini client
const getAiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
};

// Nodemailer SMTP Transporter
const getTransporter = () => {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST || "mail.authenticholidayhomes.ae";
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || "465");
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || "no-reply@authenticholidayhomes.ae";
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
  const isSecure = port === 465 || process.env.MAIL_ENCRYPTION === "ssl";

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
};

// Contact Form Submission
router.post("/contact", async (req, res) => {
  try {
    const { firstName, lastName, name, email, phone, message } = req.body;
    
    const displayName = name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!displayName || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
    if (!pass) {
      console.warn("SMTP mail password not set. Email not sent.");
      return res.status(500).json({ error: "Mail server not configured" });
    }

    const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || "no-reply@authenticholidayhomes.ae";
    const fromAddress = process.env.MAIL_FROM_ADDRESS || user;
    const toAddress = process.env.MAIL_TO || process.env.CONTACT_RECIPIENT || "it@authenticholidayhomes.ae";

    const transporter = getTransporter();
    const mailOptions = {
      from: `"Website Contact Form" <${fromAddress}>`,
      to: toAddress,
      subject: `New Contact Inquiry from ${displayName}`,
      text: `Name: ${displayName}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
      replyTo: email
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Nodemailer Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send email" });
  }
});

// AI Property Description Enhancer
router.post("/ai/enhance-description", async (req, res) => {
  try {
    const { title, amenities, location } = req.body;
    const prompt = `Write a premium, attractive holiday home description for a property named "${title}" located in ${location}. Amenities include: ${amenities.join(", ")}. Keep it under 150 words and focus on a luxurious, relaxing experience.`;
    
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    res.json({ description: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// Stripe Payment Intent
router.post("/payments/create-intent", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured or missing STRIPE_SECRET_KEY" });
  }
  try {
    const { amount, currency = 'usd', metadata } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // amount in cents
      currency,
      metadata
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Payment failed" });
  }
});

export default router;
