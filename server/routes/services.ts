import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import { 
  getEmailTemplates, 
  getEmailTemplateById, 
  saveEmailTemplate, 
  sendTemplatedEmail,
  sendEmail
} from "../db/email_templates";
import { executeBirthdayCheck } from "../services/birthdayScheduler";

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

// --- ADMIN EMAIL TEMPLATES MODULE ---
router.get("/email-templates", async (req, res) => {
  try {
    const list = await getEmailTemplates();
    res.json({ success: true, templates: list });
  } catch (error: any) {
    console.error("Failed to get email templates:", error);
    res.status(500).json({ error: "Failed to load email templates" });
  }
});

router.get("/email-templates/:id", async (req, res) => {
  try {
    const item = await getEmailTemplateById(req.params.id);
    if (!item) return res.status(404).json({ error: "Template not found" });
    res.json({ success: true, template: item });
  } catch (error: any) {
    console.error("Failed to get email template:", error);
    res.status(500).json({ error: "Failed to load template" });
  }
});

router.put("/email-templates/:id", async (req, res) => {
  try {
    const { name, subject, body, variables } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields (name, subject, body)" });
    }
    await saveEmailTemplate(req.params.id, name, subject, body, variables || '');
    res.json({ success: true, message: "Template saved successfully" });
  } catch (error: any) {
    console.error("Failed to save email template:", error);
    res.status(500).json({ error: "Failed to save template" });
  }
});

router.post("/email-templates/:id/test-send", async (req, res) => {
  try {
    const { email, variables } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing recipient email" });
    }
    
    // Fallback variables if not fully specified
    const testVars = {
      displayName: "Simulated User",
      guestName: "John Doe",
      propertyName: "Luxury Burj Khalifa Suite",
      checkIn: "2026-06-15",
      checkOut: "2026-06-20",
      totalPrice: "12,500",
      ...variables
    };

    const outcome = await sendTemplatedEmail(email, req.params.id, testVars);
    if (outcome) {
      res.json({ success: true, message: "Test templated email triggered successfully. Check logs for trace outputs." });
    } else {
      res.status(500).json({ error: "Failed to send templated email. SMTP credentials might not be configured." });
    }
  } catch (error: any) {
    console.error("Failed to execute test send:", error);
    res.status(500).json({ error: error.message || "Failed to trigger templated email" });
  }
});

import { checkPermitCompliance, syncListingToPropertyFinder, getPropertyFinderListings, importPropertyFinderListing } from "../services/propertyFinderService";

router.post("/birthday-check", async (req, res) => {
  try {
    const results = await executeBirthdayCheck();
    res.json({
      success: true,
      message: "Birthday database check executed successfully.",
      processedMatchCount: results.processedCount,
      sentEmails: results.sentEmails
    });
  } catch (err: any) {
    console.error("Manual birthday check failed:", err);
    res.status(500).json({ error: err.message || "Birthday check process failed" });
  }
});

// --- PROPERTY FINDER ENTERPRISE API OPERATIONS ---
router.post("/propertyfinder/compliance-check", async (req, res) => {
  try {
    const { permitNumber, licenseNumber } = req.body;
    if (!permitNumber) {
      return res.status(400).json({ error: "Permit/Advertisement identifier is mandatory." });
    }
    const checkDetail = await checkPermitCompliance(permitNumber, licenseNumber);
    res.json({ success: true, compliance: checkDetail });
  } catch (error: any) {
    console.error("Property Finder compliance check error:", error);
    res.status(500).json({ error: error.message || "Compliance verification failed on the remote server" });
  }
});

router.post("/propertyfinder/sync-listing", async (req, res) => {
  try {
    const { listing, permitDetails } = req.body;
    if (!listing || !listing.title) {
      return res.status(400).json({ error: "Complete listing properties and titles are required." });
    }
    const syncStatus = await syncListingToPropertyFinder(listing, permitDetails);
    res.json(syncStatus);
  } catch (error: any) {
    console.error("Property Finder dynamic listing sync error:", error);
    res.status(500).json({ error: error.message || "Porting listing up to Property Finder failed" });
  }
});

router.get("/propertyfinder/listings", async (req, res) => {
  try {
    const listings = await getPropertyFinderListings();
    res.json({ success: true, listings });
  } catch (error: any) {
    console.error("Property Finder fetch listings error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve available listings from Property Finder portal" });
  }
});

router.post("/propertyfinder/import", async (req, res) => {
  try {
    const { listingId, hostId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: "listingId is required to invoke sync operations" });
    }
    const result = await importPropertyFinderListing(listingId, hostId);
    res.json(result);
  } catch (error: any) {
    console.error("Property Finder import listing error:", error);
    res.status(500).json({ error: error.message || "Property importing pipeline failed on remote files execution" });
  }
});

// --- DYNAMIC STAY CONTRACT EMAIL DELIVERY PIPELINE ---
router.post("/bookings/:id/send-contract", async (req, res) => {
  try {
    const { id } = req.params;
    const { guestEmail, guestName, propertyTitle, checkIn, checkOut, signUrl } = req.body;

    if (!guestEmail) {
      return res.status(400).json({ error: "Guest email address is required to dispatch contracts." });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="background-color: #fcfcfc; padding: 24px; border-bottom: 3px solid #b22234; text-align: center;">
          <h2 style="margin: 0; color: #b22234; text-transform: uppercase; font-size: 20px; letter-spacing: 1px; font-weight: 800;">Authentic Holiday Homes</h2>
          <span style="font-size: 9px; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px;">DUBAI DET REGISTERED OPERATOR | LICENSE: 1061365</span>
        </div>
        <div style="padding: 36px; background-color: #ffffff;">
          <p style="font-size: 14px; margin-top: 0; color: #334155;">Dear <strong>${guestName || 'Valued Guest'}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">We are delighted to prepare for your upcoming stay at <strong>${propertyTitle || 'our luxury apartment'}</strong> in Dubai!</p>
          <p style="font-size: 14px; color: #334155;">To finalize your reservation, we kindly request you to review and digitally sign the short-term Letting Tenancy Agreement. Please click the button below to view the secure contract and sign it directly on your mobile or desktop device:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${signUrl}" style="display: inline-block; background-color: #b22234; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(178,34,52,0.18);">Review & Sign Lease Agreement</a>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; font-size: 12px; margin-bottom: 24px; border-left: 4px solid #b22234; color: #475569;">
            <strong>Stay Details / تفاصيل حجز الإقامة:</strong><br/>
            • Reference ID: ${id.toUpperCase()}<br/>
            • Property: ${propertyTitle || 'Licensed Unit'}<br/>
            • Check-In (Arrival): ${checkIn}<br/>
            • Check-Out (Departure): ${checkOut}
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 11px; color: #64748b; line-height: 1.55;">
            <p style="margin: 0 0 8px 0; color: #475569;"><strong>Bilingual Notice (العربية):</strong> يرجى الضغط على الزر الأحمر أعلاه لمراجعة وتوقيع عقد إيجار السكن لتأكيد حجزك وتسهيل إجراءات دخول الشقة.</p>
            <p style="margin: 0;">If you have any questions or require assistance, please feel free to reply directly to this email or call our team at +971 4 286 6788.</p>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace;">
          &copy; 2026 AUTHENTIC HOLIDAY HOMES L.L.C. ALL RIGHTS RESERVED.
        </div>
      </div>
    `;

    const success = await sendEmail(
      guestEmail,
      `Action Required: Tenancy Agreement Pending Signature - Stay at ${propertyTitle || 'Authentic Holiday Homes'}`,
      htmlContent
    );

    if (success) {
      res.json({ success: true, message: "Contract dispatched successfully!" });
    } else {
      res.status(500).json({ error: "Failed to dispatch contract email transaction. SMTP issue." });
    }
  } catch (error: any) {
    console.error("Booking dynamic contract dispatch pipeline error:", error);
    res.status(500).json({ error: error.message || "Email pipeline error" });
  }
});

export default router;
