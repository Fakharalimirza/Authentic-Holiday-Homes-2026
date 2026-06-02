import { query } from './connection';

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
  await query(`
    INSERT INTO staff_messages (userId, userEmail, text)
    VALUES (?, ?, ?)
  `, [msg.userId, msg.userEmail, msg.text]);
}

export async function getAllStaffMessages(): Promise<any[]> {
  const rows = await query("SELECT * FROM staff_messages ORDER BY createdAt DESC LIMIT 100");
  // Sort ascending for chat UI
  rows.reverse();
  return rows.map((row: any) => ({
    id: String(row.id),
    userId: row.userId,
    userEmail: row.userEmail,
    text: row.text,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }));
}

// --- STAFF DMs ---
export async function saveStaffDM(dm: any): Promise<void> {
  await query(`
    INSERT INTO staff_dms (senderId, senderEmail, recipientId, recipientEmail, text)
    VALUES (?, ?, ?, ?, ?)
  `, [dm.senderId, dm.senderEmail, dm.recipientId, dm.recipientEmail, dm.text]);
}

export async function getAllStaffDMs(): Promise<any[]> {
  const rows = await query("SELECT * FROM staff_dms ORDER BY createdAt DESC LIMIT 200");
  rows.reverse();
  return rows.map((row: any) => ({
    id: String(row.id),
    senderId: row.senderId,
    senderEmail: row.senderEmail,
    recipientId: row.recipientId,
    recipientEmail: row.recipientEmail,
    text: row.text,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }));
}
