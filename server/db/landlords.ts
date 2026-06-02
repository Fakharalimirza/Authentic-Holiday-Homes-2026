import { query } from './connection';

// --- LANDLORDS (OWNERS) SECTION ---
export async function saveLandlord(id: string, landlord: any): Promise<void> {
  await query(`
    INSERT INTO landlords (
      id, fullName, email, phone, identityNumber, identityDocumentUrl, nationality,
      bankName, bankAccountHolder, bankAccountNumber, swiftCode, iban, bankBranch, isDeleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON DUPLICATE KEY UPDATE
      fullName = VALUES(fullName),
      email = VALUES(email),
      phone = VALUES(phone),
      identityNumber = VALUES(identityNumber),
      identityDocumentUrl = VALUES(identityDocumentUrl),
      nationality = VALUES(nationality),
      bankName = VALUES(bankName),
      bankAccountHolder = VALUES(bankAccountHolder),
      bankAccountNumber = VALUES(bankAccountNumber),
      swiftCode = VALUES(swiftCode),
      iban = VALUES(iban),
      bankBranch = VALUES(bankBranch),
      isDeleted = 0
  `, [
    id,
    landlord.fullName || '',
    landlord.email || '',
    landlord.phone || '',
    landlord.identityNumber || '',
    landlord.identityDocumentUrl || null,
    landlord.nationality || '',
    landlord.bankName || '',
    landlord.bankAccountHolder || '',
    landlord.bankAccountNumber || '',
    landlord.swiftCode || '',
    landlord.iban || '',
    landlord.bankBranch || ''
  ]);
}

export async function getLandlord(id: string): Promise<any | null> {
  const rows = await query("SELECT * FROM landlords WHERE id = ? AND (isDeleted = 0 OR isDeleted IS NULL)", [id]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function getAllLandlords(): Promise<any[]> {
  const rows = await query("SELECT * FROM landlords WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY createdAt DESC");
  return rows;
}

export async function deleteLandlord(id: string): Promise<void> {
  await query("UPDATE landlords SET isDeleted = 1 WHERE id = ?", [id]);
}

// --- BUILDINGS SECTION ---
export async function saveBuilding(id: string, building: any): Promise<void> {
  await query(`
    INSERT INTO buildings (
      id, name, managementCompany, managementEmail, address, googleMapUrl, floors, city,
      makaniNumber, country, securityCompanyName, securityCompanyContact, gasCompanyName, gasCompanyContact,
      coolingCompanyName, coolingCompanyContact, internetProviderName, internetProviderContact, isDeleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      managementCompany = VALUES(managementCompany),
      managementEmail = VALUES(managementEmail),
      address = VALUES(address),
      googleMapUrl = VALUES(googleMapUrl),
      floors = VALUES(floors),
      city = VALUES(city),
      makaniNumber = VALUES(makaniNumber),
      country = VALUES(country),
      securityCompanyName = VALUES(securityCompanyName),
      securityCompanyContact = VALUES(securityCompanyContact),
      gasCompanyName = VALUES(gasCompanyName),
      gasCompanyContact = VALUES(gasCompanyContact),
      coolingCompanyName = VALUES(coolingCompanyName),
      coolingCompanyContact = VALUES(coolingCompanyContact),
      internetProviderName = VALUES(internetProviderName),
      internetProviderContact = VALUES(internetProviderContact),
      isDeleted = 0
  `, [
    id,
    building.name || '',
    building.managementCompany || '',
    building.managementEmail || '',
    building.address || '',
    building.googleMapUrl || '',
    building.floors !== undefined ? Number(building.floors) : 1,
    building.city || '',
    building.makaniNumber || '',
    building.country || '',
    building.securityCompanyName || '',
    building.securityCompanyContact || '',
    building.gasCompanyName || '',
    building.gasCompanyContact || '',
    building.coolingCompanyName || '',
    building.coolingCompanyContact || '',
    building.internetProviderName || '',
    building.internetProviderContact || ''
  ]);
}

export async function getBuilding(id: string): Promise<any | null> {
  const rows = await query("SELECT * FROM buildings WHERE id = ? AND (isDeleted = 0 OR isDeleted IS NULL)", [id]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function getAllBuildings(): Promise<any[]> {
  const rows = await query("SELECT * FROM buildings WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY createdAt DESC");
  return rows;
}

export async function deleteBuilding(id: string): Promise<void> {
  await query("UPDATE buildings SET isDeleted = 1 WHERE id = ?", [id]);
}
