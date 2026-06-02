import { query } from './connection';

// --- UNITS (INVENTORY) SECTION ---
export async function saveUnit(id: string, unit: any): Promise<void> {
  await query(`
    INSERT INTO units (
      id, unitNumber, buildingId, landlordId, status, price, bedrooms, bathrooms, size, furnishing, notes,
      unitType, internetProvider, internetAccountNumber, dewaPremisesNumber, mgmtCommission, guestCapacity,
      description, titleDeedUrl, permitNumber, permitDocUrl, isDeleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON DUPLICATE KEY UPDATE
      unitNumber = VALUES(unitNumber),
      buildingId = VALUES(buildingId),
      landlordId = VALUES(landlordId),
      status = VALUES(status),
      price = VALUES(price),
      bedrooms = VALUES(bedrooms),
      bathrooms = VALUES(bathrooms),
      size = VALUES(size),
      furnishing = VALUES(furnishing),
      notes = VALUES(notes),
      unitType = VALUES(unitType),
      internetProvider = VALUES(internetProvider),
      internetAccountNumber = VALUES(internetAccountNumber),
      dewaPremisesNumber = VALUES(dewaPremisesNumber),
      mgmtCommission = VALUES(mgmtCommission),
      guestCapacity = VALUES(guestCapacity),
      description = VALUES(description),
      titleDeedUrl = VALUES(titleDeedUrl),
      permitNumber = VALUES(permitNumber),
      permitDocUrl = VALUES(permitDocUrl),
      isDeleted = 0
  `, [
    id,
    unit.unitNumber || '',
    unit.buildingId || '',
    unit.landlordId || null,
    unit.status || 'Vacant',
    unit.price !== undefined ? Number(unit.price) : 0,
    unit.bedrooms !== undefined ? Number(unit.bedrooms) : 0,
    unit.bathrooms !== undefined ? Number(unit.bathrooms) : 0,
    unit.size !== undefined ? Number(unit.size) : 0,
    unit.furnishing || 'Furnished',
    unit.notes || '',
    unit.unitType || 'Apartment',
    unit.internetProvider || '',
    unit.internetAccountNumber || '',
    unit.dewaPremisesNumber || '',
    unit.mgmtCommission !== undefined ? Number(unit.mgmtCommission) : 0,
    unit.guestCapacity !== undefined ? Number(unit.guestCapacity) : 1,
    unit.description || '',
    unit.titleDeedUrl || '',
    unit.permitNumber || '',
    unit.permitDocUrl || ''
  ]);
}

export async function getUnit(id: string): Promise<any | null> {
  const rows = await query("SELECT * FROM units WHERE id = ? AND (isDeleted = 0 OR isDeleted IS NULL)", [id]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function getAllUnits(): Promise<any[]> {
  const rows = await query("SELECT * FROM units WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY createdAt DESC");
  return rows;
}

export async function deleteUnit(id: string): Promise<void> {
  await query("UPDATE units SET isDeleted = 1 WHERE id = ?", [id]);
}
