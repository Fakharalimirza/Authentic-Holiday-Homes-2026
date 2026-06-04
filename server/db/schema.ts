import mysql from 'mysql2/promise';

let initialized = false;
let isInitializing = false;

export function isDbInitialized(): boolean {
  return initialized;
}

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
      uid VARCHAR(128) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      displayName VARCHAR(255) DEFAULT '',
      password VARCHAR(255) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      role VARCHAR(50) DEFAULT 'guest',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      wishlist TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS properties (
      id VARCHAR(128) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255) DEFAULT '',
      price DECIMAL(10, 2) DEFAULT 0.00,
      images TEXT,
      amenities TEXT,
      hostId VARCHAR(128) NOT NULL,
      isAvailable TINYINT(1) DEFAULT 1,
      rating DECIMAL(3, 2) DEFAULT 5.00,
      reviewCount INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS property_reviews (
      id VARCHAR(128) PRIMARY KEY,
      propertyId VARCHAR(128) NOT NULL,
      userId VARCHAR(128) NOT NULL,
      userName VARCHAR(255) DEFAULT '',
      userPhoto TEXT,
      rating INT DEFAULT 5,
      comment TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(128) PRIMARY KEY,
      propertyId VARCHAR(128) NOT NULL,
      propertyName VARCHAR(255) DEFAULT '',
      guestId VARCHAR(128) NOT NULL,
      guestName VARCHAR(255) DEFAULT '',
      guestEmail VARCHAR(191) DEFAULT '',
      guestPhone VARCHAR(50) DEFAULT '',
      checkIn DATE NOT NULL,
      checkOut DATE NOT NULL,
      totalPrice DECIMAL(10, 2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS secured_documents (
      id VARCHAR(128) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      fileName VARCHAR(255) DEFAULT '',
      url TEXT NOT NULL,
      uploadedBy VARCHAR(128) DEFAULT '',
      uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS turnovers (
      id VARCHAR(128) PRIMARY KEY,
      bookingId VARCHAR(128) NOT NULL,
      propertyTitle VARCHAR(255) DEFAULT '',
      scheduledDate DATE NOT NULL,
      cleanerName VARCHAR(255) DEFAULT 'Unassigned',
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tickets (
      id VARCHAR(128) PRIMARY KEY,
      userId VARCHAR(128) DEFAULT '',
      userEmail VARCHAR(191) DEFAULT '',
      subject VARCHAR(255) DEFAULT '',
      description TEXT,
      category VARCHAR(100) DEFAULT 'maintenance',
      status VARCHAR(50) DEFAULT 'open',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      messages TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS staff_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(128) NOT NULL,
      userEmail VARCHAR(191) NOT NULL,
      text TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS staff_dms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      senderId VARCHAR(128) NOT NULL,
      senderEmail VARCHAR(191) NOT NULL,
      recipientId VARCHAR(128) NOT NULL,
      recipientEmail VARCHAR(191) NOT NULL,
      text TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS invitations (
      token VARCHAR(128) PRIMARY KEY,
      email VARCHAR(191) NOT NULL,
      role VARCHAR(50) NOT NULL,
      note TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      invitedBy VARCHAR(128) DEFAULT '',
      invitedByEmail VARCHAR(191) DEFAULT '',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      acceptedBy VARCHAR(128) DEFAULT NULL,
      acceptedAt TIMESTAMP NULL DEFAULT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(128) DEFAULT 'anonymous',
      userEmail VARCHAR(191) DEFAULT 'anonymous',
      userRole VARCHAR(50) DEFAULT 'guest',
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip VARCHAR(100) DEFAULT '127.0.0.1',
      userAgent VARCHAR(255) DEFAULT '',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(128) PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS device_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(128) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      platform VARCHAR(50) DEFAULT 'web',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS property_amenities (
      propertyId VARCHAR(128) NOT NULL,
      amenityKey VARCHAR(128) NOT NULL,
      category VARCHAR(128) NOT NULL,
      PRIMARY KEY (propertyId, amenityKey),
      INDEX idx_amenity_key (amenityKey)
  )`,
  `CREATE TABLE IF NOT EXISTS landlords (
      id VARCHAR(128) PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(100) DEFAULT '',
      identityNumber VARCHAR(100) DEFAULT '',
      identityDocumentUrl TEXT DEFAULT NULL,
      nationality VARCHAR(100) DEFAULT '',
      bankName VARCHAR(255) DEFAULT '',
      bankAccountHolder VARCHAR(255) DEFAULT '',
      bankAccountNumber VARCHAR(100) DEFAULT '',
      swiftCode VARCHAR(100) DEFAULT '',
      iban VARCHAR(100) DEFAULT '',
      bankBranch VARCHAR(255) DEFAULT '',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isDeleted TINYINT(1) DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS buildings (
      id VARCHAR(128) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      managementCompany VARCHAR(255) DEFAULT '',
      managementEmail VARCHAR(191) DEFAULT '',
      address TEXT DEFAULT NULL,
      googleMapUrl TEXT DEFAULT NULL,
      floors INT DEFAULT 1,
      city VARCHAR(100) DEFAULT '',
      makaniNumber VARCHAR(100) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      securityCompanyName VARCHAR(255) DEFAULT '',
      securityCompanyContact VARCHAR(100) DEFAULT '',
      gasCompanyName VARCHAR(255) DEFAULT '',
      gasCompanyContact VARCHAR(100) DEFAULT '',
      coolingCompanyName VARCHAR(255) DEFAULT '',
      coolingCompanyContact VARCHAR(100) DEFAULT '',
      internetProviderName VARCHAR(255) DEFAULT '',
      internetProviderContact VARCHAR(100) DEFAULT '',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isDeleted TINYINT(1) DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS units (
      id VARCHAR(128) PRIMARY KEY,
      unitNumber VARCHAR(100) NOT NULL,
      buildingId VARCHAR(128) NOT NULL,
      landlordId VARCHAR(128) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Vacant',
      price DECIMAL(10, 2) DEFAULT 0.00,
      bedrooms INT DEFAULT 0,
      bathrooms INT DEFAULT 0,
      size INT DEFAULT 0,
      furnishing VARCHAR(100) DEFAULT 'Furnished',
      notes TEXT,
      unitType VARCHAR(100) DEFAULT 'Apartment',
      internetProvider VARCHAR(100) DEFAULT '',
      internetAccountNumber VARCHAR(100) DEFAULT '',
      dewaPremisesNumber VARCHAR(100) DEFAULT '',
      mgmtCommission DECIMAL(5, 2) DEFAULT 0.00,
      guestCapacity INT DEFAULT 1,
      description TEXT DEFAULT NULL,
      titleDeedUrl TEXT DEFAULT NULL,
      permitNumber VARCHAR(100) DEFAULT '',
      permitDocUrl TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      isDeleted TINYINT(1) DEFAULT 0
  )`
];

export async function initDbTables(p: mysql.Pool): Promise<void> {
  if (initialized || isInitializing) return;
  isInitializing = true;
  console.log("[MySQL Auto-Init] Initializing schemas verification...");
  try {
    for (const stmt of SCHEMA_STATEMENTS) {
      try {
        await p.query(stmt);
      } catch (e: any) {
        console.warn("[MySQL Auto-Init] Table verification warning:", e.message);
        if (e.message && (e.message.includes("ETIMEDOUT") || e.message.includes("connect") || e.message.includes("ECONNREFUSED"))) {
          throw e;
        }
      }
    }
    // Alter schema safety to ensure all modern properties table columns exist in cPanel MySQL
    const colsToAdd = [
      { name: "rating", type: "DECIMAL(3,2) DEFAULT 5.00" },
      { name: "reviewCount", type: "INT DEFAULT 0" },
      { name: "category", type: "VARCHAR(100) DEFAULT 'Apartment'" },
      { name: "unitNumber", type: "VARCHAR(100) DEFAULT ''" },
      { name: "buildingName", type: "VARCHAR(255) DEFAULT ''" },
      { name: "referenceNo", type: "VARCHAR(100) DEFAULT ''" },
      { name: "purpose", type: "VARCHAR(50) DEFAULT 'For Rent'" },
      { name: "furnishing", type: "VARCHAR(100) DEFAULT 'Furnished'" },
      { name: "size", type: "INT DEFAULT 0" },
      { name: "bedrooms", type: "INT DEFAULT 0" },
      { name: "bathrooms", type: "INT DEFAULT 0" },
      { name: "maxGuests", type: "INT DEFAULT 1" },
      { name: "minimumNights", type: "INT DEFAULT 30" },
      { name: "updatedAt", type: "TIMESTAMP NULL DEFAULT NULL" },
      { name: "isDeleted", type: "TINYINT(1) DEFAULT 0" },
      { name: "landlordId", type: "VARCHAR(128) DEFAULT NULL" },
      { name: "buildingId", type: "VARCHAR(128) DEFAULT NULL" }
    ];
    for (const col of colsToAdd) {
      try {
        await p.query(`ALTER TABLE properties ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }
    // Alter schema safety for secured_documents modern columns & isDeleted soft delete column
    const docColsToAdd = [
      { name: "category", type: "VARCHAR(100) DEFAULT ''" },
      { name: "identifier", type: "VARCHAR(255) DEFAULT ''" },
      { name: "docType", type: "VARCHAR(100) DEFAULT ''" },
      { name: "isDeleted", type: "TINYINT(1) DEFAULT 0" }
    ];
    for (const col of docColsToAdd) {
      try {
        await p.query(`ALTER TABLE secured_documents ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }
    try {
      await p.query("ALTER TABLE properties MODIFY COLUMN location TEXT");
    } catch(e){}

    // Alter schema safety for buildings modern columns
    const bldColsToAdd = [
      { name: "coolingCompanyName", type: "VARCHAR(255) DEFAULT ''" },
      { name: "coolingCompanyContact", type: "VARCHAR(100) DEFAULT ''" },
      { name: "internetProviderName", type: "VARCHAR(255) DEFAULT ''" },
      { name: "internetProviderContact", type: "VARCHAR(100) DEFAULT ''" }
    ];
    for (const col of bldColsToAdd) {
      try {
        await p.query(`ALTER TABLE buildings ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }

    // Ensure password column exists in users table for database authentication
    try {
      await p.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT ''");
    } catch (e) {}

    // Ensure modern columns exist in units table (inventory management)
    const unitColsToAdd = [
      { name: "unitType", type: "VARCHAR(100) DEFAULT 'Apartment'" },
      { name: "internetProvider", type: "VARCHAR(100) DEFAULT ''" },
      { name: "internetAccountNumber", type: "VARCHAR(100) DEFAULT ''" },
      { name: "dewaPremisesNumber", type: "VARCHAR(100) DEFAULT ''" },
      { name: "mgmtCommission", type: "DECIMAL(5, 2) DEFAULT 0.00" },
      { name: "guestCapacity", type: "INT DEFAULT 1" },
      { name: "description", type: "TEXT DEFAULT NULL" },
      { name: "titleDeedUrl", type: "TEXT DEFAULT NULL" },
      { name: "permitNumber", type: "VARCHAR(100) DEFAULT ''" },
      { name: "permitDocUrl", type: "TEXT DEFAULT NULL" }
    ];
    for (const col of unitColsToAdd) {
      try {
        await p.query(`ALTER TABLE units ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }

    // One-time dynamic migration for property_amenities table
    try {
      const [existingRows] = await p.query("SELECT COUNT(*) as count FROM property_amenities");
      const count = (existingRows as any)?.[0]?.count || 0;
      if (count === 0) {
        console.log("[MySQL Auto-Init] Migrating existing property amenities into normalized property_amenities table...");
        const [propRows] = await p.query("SELECT id, amenities FROM properties");
        if (Array.isArray(propRows)) {
          for (const row of propRows as any[]) {
            if (row.amenities) {
              try {
                const amenitiesObj = typeof row.amenities === 'string' ? JSON.parse(row.amenities) : row.amenities;
                if (amenitiesObj && typeof amenitiesObj === 'object') {
                  for (const [category, itemKeys] of Object.entries(amenitiesObj)) {
                    if (Array.isArray(itemKeys)) {
                      for (const itemKey of itemKeys) {
                        if (itemKey && typeof itemKey === 'string') {
                           await p.query(
                            "INSERT IGNORE INTO property_amenities (propertyId, amenityKey, category) VALUES (?, ?, ?)",
                            [row.id, itemKey, category]
                          );
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                console.warn(`[MySQL Auto-Init] Failed to parse existing amenities for property ${row.id}:`, e);
              }
            }
          }
        }
        console.log("[MySQL Auto-Init] Property amenities migration completed successfully.");
      }
    } catch (e) {
      console.warn("[MySQL Auto-Init] Could not run property_amenities migration check:", e);
    }

    initialized = true;
    console.log("[MySQL Auto-Init] All tables verified & synchronized.");
  } catch (err) {
    console.error("[MySQL Auto-Init] Critical schema auto-verify error:", err);
  } finally {
    isInitializing = false;
  }
}
