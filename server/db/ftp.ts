/**
 * HELPER FOR RENAME/MOVE DIRECTORIES VIA FTP (Used for soft delete dynamic storage isolation)
 */
export async function moveFtpFolder(oldSubDir: string, newSubDir: string): Promise<boolean> {
  const useVps = !!process.env.VPS_FTP_HOST;
  if (!useVps) return false;

  try {
    const ftp = await import("basic-ftp");
    const client = new ftp.Client();
    client.ftp.verbose = true;

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
        console.log(`[FTP Move] Connecting to ${hostToConnect}:${process.env.VPS_FTP_PORT || "21"}...`);
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
      } catch (err: any) {
        lastFtpError = err;
      }
    }

    if (!connected) {
      throw lastFtpError || new Error("Failed to connect to FTP in move helper");
    }

    const baseDir = process.env.VPS_FTP_REMOTE_DIR || "public_html/uploads";

    const parts = newSubDir.split("/");
    parts.pop(); // Remove final folder name to get parent path

    // Bulletproof segmented navigation starting from session root
    await client.cd("/");
    const baseParts = baseDir.split("/").filter(Boolean);
    for (const part of baseParts) {
      await client.ensureDir(part);
    }
    for (const part of parts) {
      if (part.trim()) {
        await client.ensureDir(part);
      }
    }

    const fullOldPath = `${baseDir}/${oldSubDir}`;
    const fullNewPath = `${baseDir}/${newSubDir}`;
    console.log(`[FTP Move] Renaming folder from ${fullOldPath} to ${fullNewPath}`);
    await client.rename(fullOldPath, fullNewPath);
    return true;
  } catch (err: any) {
    console.warn("[FTP Move] Failed to move FTP folder (expected if folder absent):", err.message || err);
    return false;
  }
}
