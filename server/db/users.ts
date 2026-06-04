import { query } from './connection';

// --- USERS SECTION ---
export async function saveUser(uid: string, data: any): Promise<void> {
  const existing = await getUser(uid);
  if (existing) {
    const merged = {
      ...existing,
      ...data
    };
    let finalRole = merged.role || 'guest';
    if (merged.email && merged.email.toLowerCase() === 'fakharalimirza@gmail.com') {
      finalRole = 'super_admin';
    }
    const wishlistJson = JSON.stringify(merged.wishlist || []);
    
    await query(`
      UPDATE users 
      SET email = ?,
          displayName = ?,
          password = ?,
          phone = ?,
          role = ?,
          wishlist = ?
      WHERE uid = ?
    `, [
      merged.email,
      merged.displayName || '',
      merged.password || '',
      merged.phone || '',
      finalRole,
      wishlistJson,
      uid
    ]);
  } else {
    let finalRole = data.role || 'guest';
    if (data.email && data.email.toLowerCase() === 'fakharalimirza@gmail.com') {
      finalRole = 'super_admin';
    }
    const wishlistJson = JSON.stringify(data.wishlist || []);
    const emailVal = data.email || '';
    const passVal = data.password || '';
    const displayVal = data.displayName || '';
    const phoneVal = data.phone || '';

    await query(`
      INSERT INTO users (uid, email, displayName, password, phone, role, wishlist)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uid, emailVal, displayVal, passVal, phoneVal, finalRole, wishlistJson]);
  }
}

function safeParseWishlist(wishlistStr: any): any[] {
  if (!wishlistStr) return [];
  try {
    const parsed = typeof wishlistStr === 'string' ? JSON.parse(wishlistStr) : wishlistStr;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function getUser(uid: string): Promise<any | null> {
  const rows = await query("SELECT * FROM users WHERE uid = ?", [uid]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  let finalRole = row.role || 'guest';
  if (row.email && row.email.toLowerCase() === 'fakharalimirza@gmail.com') {
    finalRole = 'super_admin';
  }
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.displayName || '',
    password: row.password || '',
    phone: row.phone || '',
    role: finalRole,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    wishlist: safeParseWishlist(row.wishlist)
  };
}

export async function getUserByEmail(email: string): Promise<any | null> {
  const rows = await query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  let finalRole = row.role || 'guest';
  if (row.email && row.email.toLowerCase() === 'fakharalimirza@gmail.com') {
    finalRole = 'super_admin';
  }
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.displayName || '',
    password: row.password || '',
    phone: row.phone || '',
    role: finalRole,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    wishlist: safeParseWishlist(row.wishlist)
  };
}

export async function getAllUsers(): Promise<any[]> {
  const rows = await query("SELECT * FROM users ORDER BY email ASC");
  return rows.map((row: any) => {
    let finalRole = row.role || 'guest';
    if (row.email && row.email.toLowerCase() === 'fakharalimirza@gmail.com') {
      finalRole = 'super_admin';
    }
    return {
      uid: row.uid,
      email: row.email,
      displayName: row.displayName || '',
      phone: row.phone || '',
      role: finalRole,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      wishlist: safeParseWishlist(row.wishlist)
    };
  });
}

// --- DEVICE TOKENS SECTION ---
export async function saveDeviceToken(userId: string, token: string, platform: string = 'web'): Promise<void> {
  await query(`
    INSERT INTO device_tokens (userId, token, platform)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE userId = VALUES(userId), platform = VALUES(platform)
  `, [userId, token, platform]);
}

export async function getDeviceTokensByUserId(userId: string): Promise<string[]> {
  const rows = await query("SELECT token FROM device_tokens WHERE userId = ?", [userId]);
  return rows.map((row: any) => row.token);
}

export async function deleteDeviceToken(token: string): Promise<void> {
  await query("DELETE FROM device_tokens WHERE token = ?", [token]);
}
