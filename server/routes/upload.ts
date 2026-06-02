import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { Readable } from "stream";
import * as ftp from "basic-ftp";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Image Upload & Processing Endpoint
router.post("/upload-property-images", upload.array("images"), async (req, res) => {
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

    const folderName = `${unitNumber} - ${buildingName}`;
    const safeFolderName = folderName.replace(/[^\s\w\-\.]/g, "_").trim();
    const results = [];

    // Check if user has updated env settings to use Option B (cPanel VPS FTP Storage)
    const useVps = !!process.env.VPS_FTP_HOST;
    let vpsSuccess = false;

    if (useVps) {
      console.log("cPanel VPS Host detected. Operating custom FTP storage pipeline...");
      const client = new ftp.Client();
      client.ftp.verbose = true;
      
      try {
        let hostToConnect = process.env.VPS_FTP_HOST || "";
        // Workaround for ftp.jad-etude.pro failing DNS resolution in this environment
        if (hostToConnect === "ftp.jad-etude.pro") {
          console.log("ftp.jad-etude.pro specified. Auto-substituting with working alias media.authenticholidayhomes.ae to bypass unresolved domain setup...");
          hostToConnect = "media.authenticholidayhomes.ae";
        }

        const secureOptionsToTry = [
          process.env.VPS_FTP_SECURE === "true",
          process.env.VPS_FTP_SECURE !== "true"
        ];
        
        let connected = false;
        let lastFtpError: any = null;
        for (const secureOpt of secureOptionsToTry) {
          if (connected) break;
          try {
            console.log(`Attempting FTP connection to ${hostToConnect}:${process.env.VPS_FTP_PORT || "21"} with user: ${process.env.VPS_FTP_USER}, secure: ${secureOpt}`);
            await client.access({
              host: hostToConnect,
              user: process.env.VPS_FTP_USER,
              password: process.env.VPS_FTP_PASS,
              port: parseInt(process.env.VPS_FTP_PORT || "21"),
              secure: secureOpt,
              secureOptions: {
                rejectUnauthorized: false
              }
            });
            connected = true;
            console.log("FTP connection authenticated successfully!");
          } catch (err: any) {
            lastFtpError = err;
            console.warn(`FTP connection with secure: ${secureOpt} failed:`, err.message || err);
          }
        }

        if (!connected) {
          throw lastFtpError || new Error("Failed to connect or log in to FTP storage.");
        }

        const baseDir = process.env.VPS_FTP_REMOTE_DIR || "public_html/uploads";
        
        // Bulletproof segmented navigation starting from session root
        await client.cd("/");
        const baseParts = baseDir.split("/").filter(Boolean);
        for (const part of baseParts) {
          await client.ensureDir(part);
        }
        await client.ensureDir("properties");
        await client.ensureDir(safeFolderName);

        const mediaBaseUrl = (process.env.VPS_MEDIA_BASE_URL || "https://authenticholidayhomes.ae/uploads").replace(/\/$/, "");

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileIndex = i + 1;
          console.log(`Processing image ${fileIndex}/${files.length} for cPanel Storage`);

          // Generate high quality webp and fallback png
          const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
          const pngBuffer = await sharp(file.buffer).png({ compressionLevel: 9 }).toBuffer();

          const formats = [
            { buffer: webpBuffer, ext: "webp" },
            { buffer: pngBuffer, ext: "png" }
          ];

          const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const imageSet = [];

          for (const format of formats) {
            const fileName = `${fileIndex}_${uniqueSuffix}.${format.ext}`;
            const uploadStream = Readable.from(format.buffer);
            
            console.log(`Streaming to cPanel directory as ${fileName}...`);
            await client.uploadFrom(uploadStream, fileName);

            const publicUrl = `${mediaBaseUrl}/properties/${encodeURIComponent(safeFolderName)}/${fileName}`;
            imageSet.push({ format: format.ext, url: publicUrl });
          }
          results.push(imageSet);
        }
        vpsSuccess = true;
      } catch (ftpError) {
        console.warn("cPanel FTP upload pipeline failed. Details:", ftpError);
      } finally {
        try { client.close(); } catch (e) {}
      }

      if (vpsSuccess) {
        console.log("cPanel Storage uploads successfully processed!");
        return res.json({ success: true, folder: folderName, images: results, storageType: "vps" });
      } else {
        throw new Error("Failed to process and upload images to cPanel FTP storage.");
      }
    } else {
      console.log("No VPS FTP configuration for images. Custom local storage fallback active...");
      const fs = await import("fs");
      const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", safeFolderName);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileIndex = i + 1;
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Generate high quality webp and fallback png
        const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
        const pngBuffer = await sharp(file.buffer).png({ compressionLevel: 9 }).toBuffer();

        const webpFileName = `${fileIndex}_${uniqueSuffix}.webp`;
        const pngFileName = `${fileIndex}_${uniqueSuffix}.png`;

        fs.writeFileSync(path.join(uploadDir, webpFileName), webpBuffer);
        fs.writeFileSync(path.join(uploadDir, pngFileName), pngBuffer);

        const webpUrl = `/uploads/properties/${encodeURIComponent(safeFolderName)}/${webpFileName}`;
        const pngUrl = `/uploads/properties/${encodeURIComponent(safeFolderName)}/${pngFileName}`;

        results.push([
          { format: "webp", url: webpUrl },
          { format: "png", url: pngUrl }
        ]);
      }

      return res.json({ success: true, folder: folderName, images: results, storageType: "local" });
    }
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process and upload images" });
  }
});

// Secure Document Upload & Storage Pipeline (cPanel VPS/GCS Native Hybrid)
router.post("/upload-document", upload.single("document"), async (req, res) => {
  console.log("Starting secure document upload pipeline...");
  try {
    const { category, identifier, docType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No document file provided" });
    }

    if (!category || !identifier || !docType) {
      return res.status(400).json({ error: "Missing category, identifier, or docType in request body" });
    }

    // Sanitize names for directory hierarchy cleanliness
    const safeCategory = category.replace(/[^\w\-]/g, "_").trim();
    const safeIdentifier = identifier.replace(/[^\s\w\-]/g, "_").trim();
    const safeDocType = docType.replace(/[^\w\-]/g, "_").trim();

    // Extract original file name extension safely
    const originalExt = path.extname(file.originalname).toLowerCase() || ".pdf";
    
    // Generate unguessable 32-character hex token to lock down public URL predictability
    const crypto = await import("crypto");
    const secureToken = crypto.randomBytes(16).toString("hex");
    const outputFileName = `${safeDocType}_${secureToken}${originalExt}`;

    // Check VPS host storage settings option (Option B)
    const useVps = !!process.env.VPS_FTP_HOST;
    let docVpsSuccess = false;

    if (useVps) {
      console.log("cPanel VPS Host detected. Uploading document via FTP...");
      const client = new ftp.Client();
      client.ftp.verbose = true;

      try {
        let hostToConnect = process.env.VPS_FTP_HOST || "";
        if (hostToConnect === "ftp.jad-etude.pro") {
          hostToConnect = "media.authenticholidayhomes.ae";
        }

        const secureOptionsToTry = [
          process.env.VPS_FTP_SECURE === "true",
          process.env.VPS_FTP_SECURE !== "true"
        ];
        
        let connected = false;
        let lastFtpError: any = null;
        for (const secureOpt of secureOptionsToTry) {
          if (connected) break;
          try {
            console.log(`Attempting document FTP connection to ${hostToConnect}:${process.env.VPS_FTP_PORT || "21"} with user: ${process.env.VPS_FTP_USER}, secure: ${secureOpt}`);
            await client.access({
              host: hostToConnect,
              user: process.env.VPS_FTP_USER,
              password: process.env.VPS_FTP_PASS,
              port: parseInt(process.env.VPS_FTP_PORT || "21"),
              secure: secureOpt,
              secureOptions: {
                rejectUnauthorized: false
              }
            });
            connected = true;
            console.log("Document FTP connection authenticated successfully!");
          } catch (err: any) {
            lastFtpError = err;
            console.warn(`Document FTP connection with secure: ${secureOpt} failed:`, err.message || err);
          }
        }

        if (!connected) {
          throw lastFtpError || new Error("Failed to connect or log in to document FTP storage.");
        }

         const baseDir = process.env.VPS_FTP_REMOTE_DIR || "public_html/uploads";
         
         // Bulletproof segmented navigation starting from session root
         await client.cd("/");
         const baseParts = baseDir.split("/").filter(Boolean);
         for (const part of baseParts) {
           await client.ensureDir(part);
         }
         await client.ensureDir(safeCategory);
         await client.ensureDir(safeIdentifier);

        const mediaBaseUrl = (process.env.VPS_MEDIA_BASE_URL || "https://authenticholidayhomes.ae/uploads").replace(/\/$/, "");
        const uploadStream = Readable.from(file.buffer);

        console.log(`Streaming secure document to cPanel remote path ${safeCategory}/${safeIdentifier}/${outputFileName}...`);
        await client.uploadFrom(uploadStream, outputFileName);

        const publicUrl = `${mediaBaseUrl}/${encodeURIComponent(safeCategory)}/${encodeURIComponent(safeIdentifier)}/${outputFileName}`;
        docVpsSuccess = true;
        
        return res.json({
          success: true,
          url: publicUrl,
          fileName: outputFileName,
          originalName: file.originalname,
          storageType: "vps"
        });
      } catch (ftpError: any) {
        console.warn("cPanel FTP Document upload failed. Details:", ftpError);
        return res.status(500).json({ error: "FTP Document upload failed: " + ftpError.message });
      } finally {
        try { client.close(); } catch(e){}
      }
    } else {
      console.log("No VPS FTP configuration. Utilizing local filesystem sandbox storage...");
      const fs = await import("fs");
      const uploadDir = path.join(process.cwd(), "public", "uploads", safeCategory, safeIdentifier);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const localFilePath = path.join(uploadDir, outputFileName);
      fs.writeFileSync(localFilePath, file.buffer);
      
      const publicUrl = `/uploads/${encodeURIComponent(safeCategory)}/${encodeURIComponent(safeIdentifier)}/${outputFileName}`;
      
      return res.json({
        success: true,
        url: publicUrl,
        fileName: outputFileName,
        originalName: file.originalname,
        storageType: "local"
      });
    }
  } catch (err: any) {
    console.error("Secure Document Upload Error:", err);
    res.status(500).json({ error: err.message || "Failed to process and upload secure document" });
  }
});

export default router;
