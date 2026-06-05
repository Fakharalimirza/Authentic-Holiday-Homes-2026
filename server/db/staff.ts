import { query } from './connection';
import { getUser } from './users';

// --- TICKETS (MAINTENANCE/SUPPORT) SECTION ---
export async function saveTicket(id: string, ticket: any): Promise<void> {
  const messagesJson = JSON.stringify(ticket.messages || []);
  await query(`
    INSERT INTO tickets (id, userId, userEmail, subject, description, category, status, messages)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      messages = VALUES(messages)
  `, [id, ticket.userId, ticket.userEmail, ticket.subject, ticket.description, ticket.category || 'maintenance', ticket.status || 'open', messagesJson]);
}

export async function getAllTickets(): Promise<any[]> {
  const rows = await query("SELECT * FROM tickets ORDER BY createdAt DESC");
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    subject: row.subject,
    description: row.description,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    messages: row.messages ? JSON.parse(row.messages) : []
  }));
}

// --- STAFF MESSAGES (CHANNEL CHAT) ---
export async function saveStaffMessage(msg: any): Promise<void> {
  const uid = msg.userId || msg.senderId || 'anonymous';
  let email = msg.userEmail || msg.senderEmail;
  if (!email && uid !== 'anonymous') {
    const user = await getUser(uid);
    email = user?.email;
  }
  if (!email) {
    email = `${uid}@ahh-management.com`;
  }

  await query(`
    INSERT INTO staff_messages (userId, userEmail, text)
    VALUES (?, ?, ?)
  `, [uid, email, msg.text]);
}

export async function getAllStaffMessages(): Promise<any[]> {
  const rows = await query(`
    SELECT sm.*, u.displayName as senderName, u.role as senderRole 
    FROM staff_messages sm 
    LEFT JOIN users u ON sm.userId = u.uid 
    ORDER BY sm.createdAt DESC LIMIT 100
  `);
  // Sort ascending for chat UI
  rows.reverse();

  const mapped = [];
  for (const row of rows) {
    let sName = row.senderName;
    let sRole = row.senderRole;
    if (!sName || !sRole) {
      const user = await getUser(row.userId);
      if (user) {
        sName = user.displayName;
        sRole = user.role;
      }
    }
    mapped.push({
      id: String(row.id),
      userId: row.userId,
      senderId: row.userId,
      userEmail: row.userEmail,
      senderName: sName || row.userEmail?.split('@')[0] || 'Staff Member',
      senderRole: sRole || 'agent',
      text: row.text,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
    });
  }
  return mapped;
}

// --- STAFF DMs ---
export async function saveStaffDM(dm: any): Promise<void> {
  const sId = dm.senderId || 'anonymous';
  let sEmail = dm.senderEmail;
  if (!sEmail && sId !== 'anonymous') {
    const user = await getUser(sId);
    sEmail = user?.email;
  }
  if (!sEmail) {
    sEmail = `${sId}@ahh-management.com`;
  }

  const rId = dm.recipientId || 'anonymous';
  let rEmail = dm.recipientEmail;
  if (!rEmail && rId !== 'anonymous') {
    const user = await getUser(rId);
    rEmail = user?.email;
  }
  if (!rEmail) {
    rEmail = `${rId}@ahh-management.com`;
  }

  await query(`
    INSERT INTO staff_dms (senderId, senderEmail, recipientId, recipientEmail, text)
    VALUES (?, ?, ?, ?, ?)
  `, [sId, sEmail, rId, rEmail, dm.text]);
}

export async function getAllStaffDMs(): Promise<any[]> {
  const rows = await query("SELECT * FROM staff_dms ORDER BY createdAt DESC LIMIT 200");
  rows.reverse();

  const mapped = [];
  for (const row of rows) {
    let sName = row.senderName;
    let sRole = row.senderRole;
    if (!sName || !sRole) {
      const user = await getUser(row.senderId);
      if (user) {
        sName = user.displayName;
        sRole = user.role;
      }
    }
    mapped.push({
      id: String(row.id),
      senderId: row.senderId,
      senderEmail: row.senderEmail,
      recipientId: row.recipientId,
      recipientEmail: row.recipientEmail,
      text: row.text,
      channelId: [row.senderId, row.recipientId].sort().join('_'),
      senderName: sName || row.senderEmail?.split('@')[0] || 'Staff Member',
      senderRole: sRole || 'agent',
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
    });
  }
  return mapped;
}
