import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

async function run() {
  console.log("Locating and patching property image URLs in MySQL database...");

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log("Connected to MySQL database.");
    const [rows]: [any[], any] = await connection.query("SELECT id, title, images FROM properties");
    console.log(`Found ${rows.length} total properties.`);

    let patchedCount = 0;

    for (const row of rows) {
      if (!row.images) continue;

      let imagesObj: any = null;
      try {
        imagesObj = typeof row.images === "string" ? JSON.parse(row.images) : row.images;
      } catch (e) {
        console.warn(`Could not parse images JSON for property ID ${row.id}`);
        continue;
      }

      if (!imagesObj) continue;

      let changed = false;

      // Helper function to update URLs
      const patchUrlList = (urls: string[] | undefined) => {
        if (!urls || !Array.isArray(urls)) return;
        for (let i = 0; i < urls.length; i++) {
          const oldUrl = urls[i];
          if (oldUrl && (oldUrl.includes("authenticholidayhomes.ae/uploads/") && !oldUrl.includes("media.authenticholidayhomes.ae/public_html/uploads/"))) {
            // Replace both https://authenticholidayhomes.ae/uploads/ and http:// versions
            const newUrl = oldUrl
              .replace("https://authenticholidayhomes.ae/uploads/", "https://media.authenticholidayhomes.ae/public_html/uploads/")
              .replace("http://authenticholidayhomes.ae/uploads/", "https://media.authenticholidayhomes.ae/public_html/uploads/")
              .replace("https://media.authenticholidayhomes.ae/uploads/", "https://media.authenticholidayhomes.ae/public_html/uploads/")
              .replace("http://media.authenticholidayhomes.ae/uploads/", "https://media.authenticholidayhomes.ae/public_html/uploads/");
            urls[i] = newUrl;
            changed = true;
          }
        }
      };

      patchUrlList(imagesObj.webp);
      patchUrlList(imagesObj.png);
      patchUrlList(imagesObj.avif);

      if (changed) {
        const imagesJson = JSON.stringify(imagesObj);
        await connection.query("UPDATE properties SET images = ? WHERE id = ?", [imagesJson, row.id]);
        console.log(`Successfully patched images URL for: "${row.title}" (ID: ${row.id})`);
        patchedCount++;
      }
    }

    console.log(`Patched ${patchedCount} properties' images URLs successfully.`);
    await connection.end();
  } catch (err: any) {
    console.error("Patching error:", err.message || err);
  }
}

run();
