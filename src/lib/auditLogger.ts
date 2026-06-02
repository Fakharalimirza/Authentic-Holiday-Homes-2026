// Secure client-side proxy interface to the Audit Activity Logging systems
import { auth } from './firebase';

export interface AuditParams {
  action: string;
  details: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Dispatches an audit log record securely. It pulls the client parameters (IP, browser metadata) 
 * on the server side to ensure complete integrity of the logs.
 */
export async function logActivity(
  action: string, 
  details: string, 
  userProfile?: { uid?: string; email?: string; role?: string } | null
) {
  try {
    const currentUser = auth.currentUser;
    const resolvedUid = userProfile?.uid || currentUser?.uid || "anonymous";
    const resolvedEmail = userProfile?.email || currentUser?.email || "anonymous";
    const resolvedRole = userProfile?.role || "guest";

    const payload: AuditParams = {
      action,
      details,
      userId: resolvedUid,
      userEmail: resolvedEmail,
      userRole: resolvedRole
    };

    console.log(`[Audit Logger] Querying dispatch for ${action}...`);
    const res = await fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('[Audit Logger] Log entry request flagged as unsuccessful status');
    }
  } catch (err) {
    console.error('[Audit Logger] Failed to securely push activity entry:', err);
  }
}
