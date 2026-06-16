import { query } from './connection';

export interface PortalLeadRecord {
  id: string; // lead_id
  source: 'bayut' | 'dubizzle' | 'propertyfinder';
  type: 'whatsapp' | 'sms' | 'phone' | 'email' | 'call_log' | 'story';
  date_time: string | null;
  listing_id?: string;
  listing_reference?: string;
  inquirer_name?: string;
  inquirer_cell?: string;
  inquirer_email?: string;
  inquirer_message?: string;
  views_count?: number;
  is_view_only?: number;
}

export async function savePortalLead(lead: PortalLeadRecord): Promise<void> {
  const dt = lead.date_time ? new Date(lead.date_time) : null;
  await query(`
    INSERT INTO portal_leads (
      id, source, type, date_time, listing_id, listing_reference, 
      inquirer_name, inquirer_cell, inquirer_email, inquirer_message, 
      views_count, is_view_only
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      date_time = VALUES(date_time),
      views_count = VALUES(views_count),
      inquirer_message = VALUES(inquirer_message)
  `, [
    lead.id, lead.source, lead.type, dt, lead.listing_id || '', lead.listing_reference || '',
    lead.inquirer_name || '', lead.inquirer_cell || '', lead.inquirer_email || '', lead.inquirer_message || '',
    lead.views_count || 0, lead.is_view_only || 0
  ]);
}

export async function getAllPortalLeads(): Promise<any[]> {
  const rows = await query("SELECT * FROM portal_leads ORDER BY date_time DESC, createdAt DESC LIMIT 500");
  return rows.map((row: any) => ({
    id: row.id,
    source: row.source,
    type: row.type,
    date_time: row.date_time ? new Date(row.date_time).toISOString() : null,
    listing_id: row.listing_id,
    listing_reference: row.listing_reference,
    inquirer_name: row.inquirer_name,
    inquirer_cell: row.inquirer_cell,
    inquirer_email: row.inquirer_email,
    inquirer_message: row.inquirer_message,
    views_count: row.views_count,
    is_view_only: !!row.is_view_only,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }));
}

export async function getPortalLeadsSummary(): Promise<any> {
  const [totalLeadsRows]: any = await query("SELECT COUNT(*) as count FROM portal_leads WHERE is_view_only = 0");
  const [totalViewsRows]: any = await query("SELECT SUM(views_count) as total FROM portal_leads");
  
  const sourcesBreakdown = await query(`
    SELECT source, COUNT(*) as count, SUM(views_count) as total_views
    FROM portal_leads
    GROUP BY source
  `);
  
  const typesBreakdown = await query(`
    SELECT type, COUNT(*) as count
    FROM portal_leads
    WHERE is_view_only = 0
    GROUP BY type
  `);

  return {
    totalLeads: (totalLeadsRows as any)?.[0]?.count || 0,
    totalViews: (totalViewsRows as any)?.[0]?.total || 0,
    sources: sourcesBreakdown,
    types: typesBreakdown
  };
}
