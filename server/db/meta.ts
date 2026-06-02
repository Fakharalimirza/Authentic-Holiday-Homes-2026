import { query } from './connection';

// --- INVITATIONS SECTION ---
export async function saveInvitation(token: string, invite: any): Promise<void> {
  const acceptedAtVal = invite.acceptedAt ? new Date(invite.acceptedAt) : null;
  await query(`
    INSERT INTO invitations (token, email, role, note, status, invitedBy, invitedByEmail, acceptedBy, acceptedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      acceptedBy = VALUES(acceptedBy),
      acceptedAt = VALUES(acceptedAt)
  `, [token, invite.email, invite.role, invite.note || '', invite.status || 'pending', invite.invitedBy || '', invite.invitedByEmail || '', invite.acceptedBy || null, acceptedAtVal]);
}

export async function getInvitation(token: string): Promise<any | null> {
  const rows = await query("SELECT * FROM invitations WHERE token = ?", [token]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    token: row.token,
    email: row.email,
    role: row.role,
    note: row.note,
    status: row.status,
    invitedBy: row.invitedBy,
    invitedByEmail: row.invitedByEmail,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    acceptedBy: row.acceptedBy,
    acceptedAt: row.acceptedAt ? new Date(row.acceptedAt).toISOString() : null
  };
}

export async function getAllInvitations(): Promise<any[]> {
  const rows = await query("SELECT * FROM invitations ORDER BY createdAt DESC");
  return rows.map((row: any) => ({
    token: row.token,
    email: row.email,
    role: row.role,
    note: row.note,
    status: row.status,
    invitedBy: row.invitedBy,
    invitedByEmail: row.invitedByEmail,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    acceptedBy: row.acceptedBy,
    acceptedAt: row.acceptedAt ? new Date(row.acceptedAt).toISOString() : null
  }));
}

export async function deleteInvitation(token: string): Promise<void> {
  await query("DELETE FROM invitations WHERE token = ?", [token]);
}

// --- AUDIT LOGS SECTION ---
export async function saveAuditLog(log: any): Promise<void> {
  await query(`
    INSERT INTO audit_logs (userId, userEmail, userRole, action, details, ip, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [log.userId || 'anonymous', log.userEmail || 'anonymous', log.userRole || 'guest', log.action, log.details || '', log.ip || '127.0.0.1', log.userAgent || '']);
}

export async function getAllAuditLogs(): Promise<any[]> {
  const rows = await query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200");
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    userRole: row.userRole,
    action: row.action,
    details: row.details,
    ip: row.ip,
    userAgent: row.userAgent,
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : null
  }));
}

// --- GLOBAL SETTINGS SECTION ---
export async function saveSettings(id: string, data: any): Promise<void> {
  const rawData = JSON.stringify(data);
  await query(`
    INSERT INTO settings (id, data)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE data = VALUES(data)
  `, [id, rawData]);
}

export async function getSettings(id: string): Promise<any | null> {
  const rows = await query("SELECT * FROM settings WHERE id = ?", [id]);
  if (!rows || rows.length === 0) return null;
  try {
    return JSON.parse(rows[0].data);
  } catch(e) {
    return null;
  }
}
