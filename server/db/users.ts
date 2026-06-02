import { query } from './connection';

// --- USERS SECTION ---
export async function saveUser(uid: string, data: any): Promise<void> {
  let finalRole = data.role || 'guest';
  if (data.email && data.email.toLowerCase() === 'fakharalimirza@gmail.com') {
    finalRole = 'super_admin';
  }
  const wishlistJson = JSON.stringify(data.wishlist || []);
  const passVal = data.password || '';

  if (passVal) {
    await query(`
      INSERT INTO users (uid, email, displayName, password, phone, role, wishlist)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        displayName = VALUES(displayName),
        password = VALUES(password),
        phone = VALUES(phone),
        role = VALUES(role),
        wishlist = VALUES(wishlist)
    `, [uid, data.email, data.displayName || '', passVal, data.phone || '', finalRole, wishlistJson]);
  } else {
    await query(`
      INSERT INTO users (uid, email, displayName, phone, role, wishlist)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        displayName = VALUES(displayName),
        phone = VALUES(phone),
        role = VALUES(role),
        wishlist = VALUES(wishlist)
    `, [uid, data.email, data.displayName || '', data.phone || '', finalRole, wishlistJson]);
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
    wishlist: row.wishlist ? JSON.parse(row.wishlist) : []
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
    wishlist: row.wishlist ? JSON.parse(row.wishlist) : []
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
      wishlist: row.wishlist ? JSON.parse(row.wishlist) : []
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
