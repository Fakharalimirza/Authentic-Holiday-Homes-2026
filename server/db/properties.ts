import { query } from './connection';
import { moveFtpFolder } from './ftp';

// --- PROPERTIES SECTION ---
export async function saveProperty(id: string, prop: any): Promise<void> {
  const imagesJson = JSON.stringify(prop.images || {});
  const amenitiesJson = JSON.stringify(prop.amenities || {});
  
  let locationVal = prop.location;
  if (locationVal && typeof locationVal === 'object') {
    locationVal = JSON.stringify(locationVal);
  } else if (!locationVal) {
    locationVal = '';
  }

  await query(`
    INSERT INTO properties (
      id, title, description, location, price, priceMonthly, images, amenities, hostId, isAvailable, rating, reviewCount,
      category, unitNumber, buildingName, referenceNo, purpose, furnishing, size, bedrooms, bathrooms, maxGuests, minimumNights,
      landlordId, buildingId
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      description = VALUES(description),
      location = VALUES(location),
      price = VALUES(price),
      priceMonthly = VALUES(priceMonthly),
      images = VALUES(images),
      amenities = VALUES(amenities),
      hostId = VALUES(hostId),
      isAvailable = VALUES(isAvailable),
      rating = VALUES(rating),
      reviewCount = VALUES(reviewCount),
      category = VALUES(category),
      unitNumber = VALUES(unitNumber),
      buildingName = VALUES(buildingName),
      referenceNo = VALUES(referenceNo),
      purpose = VALUES(purpose),
      furnishing = VALUES(furnishing),
      size = VALUES(size),
      bedrooms = VALUES(bedrooms),
      bathrooms = VALUES(bathrooms),
      maxGuests = VALUES(maxGuests),
      minimumNights = VALUES(minimumNights),
      landlordId = VALUES(landlordId),
      buildingId = VALUES(buildingId)
  `, [
    id,
    prop.title,
    prop.description || '',
    locationVal,
    prop.price || 0,
    prop.priceMonthly || null,
    imagesJson,
    amenitiesJson,
    prop.hostId,
    prop.isAvailable ? 1 : 0,
    prop.rating !== undefined ? prop.rating : 5.0,
    prop.reviewCount !== undefined ? prop.reviewCount : 0,
    prop.category || 'Apartment',
    prop.unitNumber || '',
    prop.buildingName || '',
    prop.referenceNo || '',
    prop.purpose || 'For Rent',
    prop.furnishing || 'Furnished',
    prop.size || 0,
    prop.bedrooms || 0,
    prop.bathrooms || 0,
    prop.maxGuests || 1,
    prop.minimumNights || 30,
    prop.landlordId || null,
    prop.buildingId || null
  ]);

  // Sync amenities to property_amenities relational table
  try {
    await query("DELETE FROM property_amenities WHERE propertyId = ?", [id]);
    if (prop.amenities && typeof prop.amenities === 'object') {
      for (const [category, itemKeys] of Object.entries(prop.amenities)) {
        if (Array.isArray(itemKeys)) {
          for (const itemKey of itemKeys) {
            if (itemKey && typeof itemKey === 'string') {
              await query(
                "INSERT IGNORE INTO property_amenities (propertyId, amenityKey, category) VALUES (?, ?, ?)",
                [id, itemKey, category]
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`[MySQL] Failed to update property_amenities for property ${id}:`, err);
  }
}

export async function getAllProperties(options?: { amenities?: string[] }): Promise<any[]> {
  let rows;
  if (options?.amenities && options.amenities.length > 0) {
    // Relational optimization: Fetch only properties that map to ALL selected amenities in our junction table
    const placeholders = options.amenities.map(() => '?').join(',');
    const sql = `
      SELECT p.* 
      FROM properties p
      INNER JOIN (
        SELECT propertyId 
        FROM property_amenities 
        WHERE amenityKey IN (${placeholders})
        GROUP BY propertyId
        HAVING COUNT(DISTINCT amenityKey) = ?
      ) pa ON p.id = pa.propertyId
      WHERE p.isDeleted = 0 OR p.isDeleted IS NULL
      ORDER BY p.createdAt DESC
    `;
    const params = [...options.amenities, options.amenities.length];
    rows = await query(sql, params);
  } else {
    rows = await query("SELECT * FROM properties WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY createdAt DESC");
  }
  return rows.map((row: any) => {
    let locationObj = row.location;
    if (typeof locationObj === 'string' && locationObj.trim().startsWith('{')) {
      try {
        locationObj = JSON.parse(locationObj);
      } catch(e) {
        locationObj = { address: row.location || '', lat: 25.2048, lng: 55.2708 };
      }
    } else {
      locationObj = { address: row.location || '', lat: 25.2048, lng: 55.2708 };
    }

    let imagesObj = row.images;
    if (typeof imagesObj === 'string' && (imagesObj.trim().startsWith('{') || imagesObj.trim().startsWith('['))) {
      try {
        imagesObj = JSON.parse(imagesObj);
      } catch(e) {
        imagesObj = { avif: [], webp: [], png: [] };
      }
    } else {
      imagesObj = { avif: [], webp: [], png: [] };
    }

    let amenitiesObj = row.amenities;
    if (typeof amenitiesObj === 'string' && (amenitiesObj.trim().startsWith('{') || amenitiesObj.trim().startsWith('['))) {
      try {
        amenitiesObj = JSON.parse(amenitiesObj);
      } catch(e) {
        amenitiesObj = {};
      }
    } else {
      amenitiesObj = {};
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      location: locationObj,
      price: Number(row.price),
      priceMonthly: row.priceMonthly ? Number(row.priceMonthly) : null,
      images: imagesObj,
      amenities: amenitiesObj,
      hostId: row.hostId,
      isAvailable: Boolean(row.isAvailable),
      rating: row.rating !== undefined ? Number(row.rating) : 5.0,
      reviewCount: row.reviewCount !== undefined ? Number(row.reviewCount) : 0,
      category: row.category || 'Apartment',
      unitNumber: row.unitNumber || '',
      buildingName: row.buildingName || '',
      referenceNo: row.referenceNo || '',
      purpose: row.purpose || 'For Rent',
      furnishing: row.furnishing || 'Furnished',
      size: row.size ? Number(row.size) : 0,
      bedrooms: row.bedrooms ? Number(row.bedrooms) : 0,
      bathrooms: row.bathrooms ? Number(row.bathrooms) : 0,
      maxGuests: row.maxGuests ? Number(row.maxGuests) : 1,
      minimumNights: row.minimumNights ? Number(row.minimumNights) : 30,
      landlordId: row.landlordId || null,
      buildingId: row.buildingId || null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
    };
  });
}

export async function getProperty(id: string): Promise<any | null> {
  const rows = await query("SELECT * FROM properties WHERE id = ?", [id]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];

  let locationObj = row.location;
  if (typeof locationObj === 'string' && locationObj.trim().startsWith('{')) {
    try {
      locationObj = JSON.parse(locationObj);
    } catch(e) {
      locationObj = { address: row.location || '', lat: 25.2048, lng: 55.2708 };
    }
  } else {
    locationObj = { address: row.location || '', lat: 25.2048, lng: 55.2708 };
  }

  let imagesObj = row.images;
  if (typeof imagesObj === 'string' && (imagesObj.trim().startsWith('{') || imagesObj.trim().startsWith('['))) {
    try {
      imagesObj = JSON.parse(imagesObj);
    } catch(e) {
      imagesObj = { avif: [], webp: [], png: [] };
    }
  } else {
    imagesObj = { avif: [], webp: [], png: [] };
  }

  let amenitiesObj = row.amenities;
  if (typeof amenitiesObj === 'string' && (amenitiesObj.trim().startsWith('{') || amenitiesObj.trim().startsWith('['))) {
    try {
      amenitiesObj = JSON.parse(amenitiesObj);
    } catch(e) {
      amenitiesObj = {};
    }
  } else {
    amenitiesObj = {};
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: locationObj,
    price: Number(row.price),
    priceMonthly: row.priceMonthly ? Number(row.priceMonthly) : null,
    images: imagesObj,
    amenities: amenitiesObj,
    hostId: row.hostId,
    isAvailable: Boolean(row.isAvailable),
    rating: row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewCount: row.reviewCount !== undefined ? Number(row.reviewCount) : 0,
    category: row.category || 'Apartment',
    unitNumber: row.unitNumber || '',
    buildingName: row.buildingName || '',
    referenceNo: row.referenceNo || '',
    purpose: row.purpose || 'For Rent',
    furnishing: row.furnishing || 'Furnished',
    size: row.size ? Number(row.size) : 0,
    bedrooms: row.bedrooms ? Number(row.bedrooms) : 0,
    bathrooms: row.bathrooms ? Number(row.bathrooms) : 0,
    maxGuests: row.maxGuests ? Number(row.maxGuests) : 1,
    minimumNights: row.minimumNights ? Number(row.minimumNights) : 30,
    landlordId: row.landlordId || null,
    buildingId: row.buildingId || null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  };
}

export async function deleteProperty(id: string): Promise<void> {
  // 1. Move storage foldering first via FTP
  try {
    const prop = await getProperty(id);
    if (prop) {
      const unitNumber = prop.unitNumber || "";
      const buildingName = prop.buildingName || "";
      const folderName = (unitNumber || buildingName) ? `${unitNumber} - ${buildingName}` : id;
      const safeFolderName = folderName.replace(/[^\s\w\-\.]/g, "_").trim();

      const oldSubDir = `properties/${safeFolderName}`;
      const newSubDir = `delete/properties/${safeFolderName}`;

      await moveFtpFolder(oldSubDir, newSubDir).catch(e => console.warn(e));
    }
  } catch (err) {
    console.warn("[deleteProperty] Error renaming storage folder (proceeding with DB soft-delete):", err);
  }

  // 2. Perform DB soft delete
  await query("UPDATE properties SET isDeleted = 1 WHERE id = ?", [id]);
}

// --- PROPERTY REVIEWS SECTION ---
export async function saveReview(reviewId: string, propertyId: string, review: any): Promise<void> {
  await query(`
    INSERT INTO property_reviews (id, propertyId, userId, userName, userPhoto, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      userName = VALUES(userName),
      userPhoto = VALUES(userPhoto),
      rating = VALUES(rating),
      comment = VALUES(comment)
  `, [
    reviewId,
    propertyId,
    review.userId,
    review.userName || 'Guest User',
    review.userPhoto || '',
    review.rating || 5,
    review.comment || ''
  ]);
}

export async function getPropertyReviews(propertyId: string): Promise<any[]> {
  const rows = await query("SELECT * FROM property_reviews WHERE propertyId = ? ORDER BY createdAt DESC", [propertyId]);
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userPhoto: row.userPhoto || '',
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }));
}
