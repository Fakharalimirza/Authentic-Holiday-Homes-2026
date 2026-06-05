import { query } from './connection';
import { saveAuditLog } from './meta';
import nodemailer from 'nodemailer';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string;
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const rows = await query("SELECT * FROM email_templates ORDER BY name ASC");
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    subject: row.subject || '',
    body: row.body || '',
    variables: row.variables || ''
  }));
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  const rows = await query("SELECT * FROM email_templates WHERE id = ?", [id]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    subject: row.subject || '',
    body: row.body || '',
    variables: row.variables || ''
  };
}

export async function saveEmailTemplate(id: string, name: string, subject: string, body: string, variables: string): Promise<void> {
  const existing = await getEmailTemplateById(id);
  if (existing) {
    await query(
      "UPDATE email_templates SET name = ?, subject = ?, body = ?, variables = ? WHERE id = ?",
      [name, subject, body, variables, id]
    );
  } else {
    await query(
      "INSERT INTO email_templates (id, name, subject, body, variables) VALUES (?, ?, ?, ?, ?)",
      [id, name, subject, body, variables]
    );
  }
}

const getTransporter = () => {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST || "mail.authenticholidayhomes.ae";
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || "465");
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || "no-reply@authenticholidayhomes.ae";
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
  const isSecure = port === 465 || process.env.MAIL_ENCRYPTION === "ssl";

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
};

export async function sendEmail(toEmail: string, subject: string, htmlContent: string): Promise<boolean> {
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || "no-reply@authenticholidayhomes.ae";
  const fromAddress = process.env.MAIL_FROM_ADDRESS || user;

  const emailDetails = `To: ${toEmail}\nSubject: ${subject}\n\nContent:\n${htmlContent}`;

  try {
    await saveAuditLog({
      userId: 'system',
      userEmail: 'system@portal.com',
      userRole: 'system',
      action: pass ? 'Email Sent' : 'Simulated Email',
      details: emailDetails,
      ip: '127.0.0.1',
      userAgent: 'System Background Task'
    });
  } catch (err) {
    console.error("Failed to save email sent audit log:", err);
  }

  if (pass) {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Holiday Homes Portal" <${fromAddress}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent
      });
      console.log(`[SMTP] Real email sent to ${toEmail}`);
      return true;
    } catch (error) {
      console.error("[SMTP] Real email transmission failed:", error);
      return false;
    }
  } else {
    console.log(`[SIMULATOR] Simulated email to ${toEmail} logged to audit logs!`);
    return true;
  }
}

export async function sendTemplatedEmail(toEmail: string, templateId: string, variables: Record<string, string>): Promise<boolean> {
  const template = await getEmailTemplateById(templateId);
  if (!template) {
    console.error(`Email template with ID "${templateId}" not found.`);
    return false;
  }

  let finalSubject = template.subject;
  let finalBody = template.body;

  for (const [key, val] of Object.entries(variables)) {
    const rx = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    finalSubject = finalSubject.replace(rx, val || '');
    finalBody = finalBody.replace(rx, val || '');
  }

  const htmlBody = finalBody.replace(/\n/g, '<br/>');

  return sendEmail(toEmail, finalSubject, htmlBody);
}
