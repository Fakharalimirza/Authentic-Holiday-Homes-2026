import { getAllUsers } from '../db/users';
import { sendTemplatedEmail } from '../db/email_templates';

// Simple in-memory tracker to prevent duplicate sends on the same day during container restarts
const sentBirthdaysCache = new Set<string>(); // elements styled as "email:YYYY-MM-DD"

export function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isBirthdayToday(dobStr: string | null | undefined): boolean {
  if (!dobStr) return false;
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate(); // 1-31

    let parsedMonth = -1;
    let parsedDay = -1;

    // Supports YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
      const parts = dobStr.split('-');
      parsedMonth = parseInt(parts[1], 10);
      parsedDay = parseInt(parts[2], 10);
    } 
    // Supports MM-DD
    else if (/^\d{2}-\d{2}$/.test(dobStr)) {
      const parts = dobStr.split('-');
      parsedMonth = parseInt(parts[0], 10);
      parsedDay = parseInt(parts[1], 10);
    } 
    // General Date parser
    else {
      const d = new Date(dobStr);
      if (!isNaN(d.getTime())) {
        parsedMonth = d.getMonth() + 1;
        parsedDay = d.getDate();
      }
    }

    return parsedMonth === todayMonth && parsedDay === todayDay;
  } catch (err) {
    console.error(`[Birthday Scheduler] Error checking DOB: "${dobStr}"`, err);
    return false;
  }
}

/**
 * Searches users, filters those having birthdays today, and triggers templated email delivers.
 * Returns information audit log string of processed runs.
 */
export async function executeBirthdayCheck(): Promise<{ processedCount: number; sentEmails: string[] }> {
  console.log("[Birthday Scheduler] Starting active database check...");
  const todayKey = getTodayKey();
  
  try {
    const users = await getAllUsers();
    const birthdayUsers = users.filter(user => user.dob && isBirthdayToday(user.dob));
    
    const sentEmails: string[] = [];
    let processedCount = 0;

    for (const user of birthdayUsers) {
      processedCount++;
      const cacheKey = `${user.email}:${todayKey}`;
      
      // Safety guard: skip if already sent today
      if (sentBirthdaysCache.has(cacheKey)) {
        console.log(`[Birthday Scheduler] Skipping ${user.email} - already sent today.`);
        continue;
      }

      console.log(`[Birthday Scheduler] Found matches! User ${user.displayName || user.email} has birthday today. DOB: ${user.dob}`);
      
      try {
        const success = await sendTemplatedEmail(user.email, 'birthday', {
          displayName: user.displayName || 'Valued Member'
        });
        if (success) {
          sentBirthdaysCache.add(cacheKey);
          sentEmails.push(user.email);
        }
      } catch (err) {
        console.error(`[Birthday Scheduler] Failed to send email to ${user.email}:`, err);
      }
    }

    console.log(`[Birthday Scheduler] Active check ended. Total processed today: ${processedCount}. Emails dispatched: ${sentEmails.length}`);
    return { processedCount, sentEmails };
  } catch (error) {
    console.error("[Birthday Scheduler] Database check crashed:", error);
    return { processedCount: 0, sentEmails: [] };
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startBirthdayScheduler() {
  console.log("[Birthday Scheduler] Module loaded and starting up background cycles...");
  
  // Run initial check on server boot after 10 seconds (giving database tables time to load & synchronize)
  setTimeout(async () => {
    try {
      await executeBirthdayCheck();
    } catch (e) {
      console.error("[Birthday Scheduler] Error during startup task execution:", e);
    }
  }, 10000);

  // Set periodic polling check every 12 hours
  if (!schedulerInterval) {
    schedulerInterval = setInterval(async () => {
      try {
        await executeBirthdayCheck();
      } catch (err) {
        console.error("[Birthday Scheduler] Periodic error during check execution:", err);
      }
    }, 12 * 60 * 60 * 1000); // 12 hours in milliseconds
  }
}
