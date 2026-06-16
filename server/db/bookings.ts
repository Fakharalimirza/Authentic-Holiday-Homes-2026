import { query } from './connection';

// --- BOOKINGS SECTION ---
export async function saveBooking(id: string, booking: any): Promise<void> {
  await query(`
    INSERT INTO bookings (
      id, propertyId, propertyName, guestId, guestName, guestEmail, guestPhone, 
      checkIn, checkOut, totalPrice, status, 
      contractSent, contractSigned, contractSignature, contractSignedAt, 
      contractSignedIp, contractSignedUserAgent, contractSignedName, advanceBookingFee
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      propertyId = VALUES(propertyId),
      propertyName = VALUES(propertyName),
      guestId = VALUES(guestId),
      guestName = VALUES(guestName),
      guestEmail = VALUES(guestEmail),
      guestPhone = VALUES(guestPhone),
      checkIn = VALUES(checkIn),
      checkOut = VALUES(checkOut),
      totalPrice = VALUES(totalPrice),
      status = VALUES(status),
      contractSent = VALUES(contractSent),
      contractSigned = VALUES(contractSigned),
      contractSignature = VALUES(contractSignature),
      contractSignedAt = VALUES(contractSignedAt),
      contractSignedIp = VALUES(contractSignedIp),
      contractSignedUserAgent = VALUES(contractSignedUserAgent),
      contractSignedName = VALUES(contractSignedName),
      advanceBookingFee = VALUES(advanceBookingFee)
  `, [
    id,
    booking.propertyId,
    booking.propertyName || '',
    booking.guestId || booking.userId || '',
    booking.guestName || '',
    booking.guestEmail || '',
    booking.guestPhone || '',
    booking.checkIn,
    booking.checkOut,
    booking.totalPrice || 0,
    booking.status || 'pending',
    booking.contractSent ? 1 : 0,
    booking.contractSigned ? 1 : 0,
    booking.contractSignature || null,
    booking.contractSignedAt || null,
    booking.contractSignedIp || null,
    booking.contractSignedUserAgent || null,
    booking.contractSignedName || null,
    booking.advanceBookingFee || 0.00
  ]);
}

function safeDateString(val: any): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch (err) {
    return "";
  }
}

export async function getAllBookings(): Promise<any[]> {
  const rows = await query("SELECT * FROM bookings ORDER BY createdAt DESC");
  return rows.map((row: any) => ({
    id: row.id,
    propertyId: row.propertyId,
    propertyName: row.propertyName,
    guestId: row.guestId,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    checkIn: safeDateString(row.checkIn),
    checkOut: safeDateString(row.checkOut),
    totalPrice: Number(row.totalPrice),
    status: row.status,
    contractSent: Boolean(row.contractSent),
    contractSigned: Boolean(row.contractSigned),
    contractSignature: row.contractSignature,
    contractSignedAt: row.contractSignedAt,
    contractSignedIp: row.contractSignedIp,
    contractSignedUserAgent: row.contractSignedUserAgent,
    contractSignedName: row.contractSignedName,
    advanceBookingFee: Number(row.advanceBookingFee || 0),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }));
}

export async function getBooking(id: string): Promise<any | null> {
  let rows = await query("SELECT * FROM bookings WHERE id = ?", [id]);
  if ((!rows || rows.length === 0) && id && id.length > 20) {
    // Fallback search using 20-character truncated ID block
    const trunId = id.substring(0, 20);
    rows = await query("SELECT * FROM bookings WHERE id = ?", [trunId]);
  }
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    propertyId: row.propertyId,
    propertyName: row.propertyName,
    guestId: row.guestId,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    checkIn: safeDateString(row.checkIn),
    checkOut: safeDateString(row.checkOut),
    totalPrice: Number(row.totalPrice),
    status: row.status,
    contractSent: Boolean(row.contractSent),
    contractSigned: Boolean(row.contractSigned),
    contractSignature: row.contractSignature,
    contractSignedAt: row.contractSignedAt,
    contractSignedIp: row.contractSignedIp,
    contractSignedUserAgent: row.contractSignedUserAgent,
    contractSignedName: row.contractSignedName,
    advanceBookingFee: Number(row.advanceBookingFee || 0),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  };
}

export async function updateBookingStatus(id: string, status: string): Promise<void> {
  await query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
}

// --- TURNOVERS (CLEANING TASK) SECTION ---
export async function saveTurnover(id: string, t: any): Promise<void> {
  await query(`
    INSERT INTO turnovers (id, bookingId, propertyTitle, scheduledDate, cleanerName, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      cleanerName = VALUES(cleanerName),
      status = VALUES(status),
      notes = VALUES(notes)
  `, [id, t.bookingId, t.propertyTitle || '', t.scheduledDate, t.cleanerName || 'Unassigned', t.status || 'pending', t.notes || '']);
}

export async function getAllTurnovers(): Promise<any[]> {
  const rows = await query("SELECT * FROM turnovers ORDER BY scheduledDate DESC");
  return rows.map((row: any) => ({
    id: row.id,
    bookingId: row.bookingId,
    propertyTitle: row.propertyTitle,
    scheduledDate: row.scheduledDate ? new Date(row.scheduledDate).toISOString().split('T')[0] : '',
    cleanerName: row.cleanerName,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }));
}
