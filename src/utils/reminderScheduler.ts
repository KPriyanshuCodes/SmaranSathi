import { Reminder } from '../types';

/**
 * Parses time string like "08:30 AM", "8:30 am", "14:15", "1:00 PM", "8:30" into hours (0-23) and minutes (0-59)
 */
export function parseReminderTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();

  // Pattern: HH:MM with optional AM/PM anywhere in string
  const match = cleaned.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

/**
 * Converts hours and minutes into "hh:mm A" format
 */
export function formatTimeAmPm(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const paddedHours = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
  return `${paddedHours}:${displayMinutes} ${ampm}`;
}

/**
 * Checks if a reminder is due at the specified time or was due within recent minutes (window of 15 mins)
 */
export function isReminderDue(reminder: Reminder, now: Date): boolean {
  if (reminder.completed) return false;

  const parsed = parseReminderTime(reminder.time);
  if (!parsed) return false;

  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const reminderTotal = parsed.hours * 60 + parsed.minutes;

  // Trigger if due right now or within the last 15 minutes and not completed
  const diff = currentTotal - reminderTotal;
  return diff >= 0 && diff <= 15;
}

/**
 * Generates a unique key for a triggered reminder on a given date and time:
 * e.g. "rem-123_2026-09-07_08:30 AM" so it triggers once per scheduled slot (and re-triggers if snoozed to a new time)
 */
export function getTriggerKey(reminderId: string, reminderTimeOrDate: string | Date, optionalNow?: Date): string {
  let timeStr = '';
  let nowObj: Date;

  if (reminderTimeOrDate instanceof Date) {
    nowObj = reminderTimeOrDate;
    timeStr = '';
  } else {
    timeStr = (reminderTimeOrDate || '').trim().toUpperCase();
    nowObj = optionalNow || new Date();
  }

  const dateStr = nowObj.toISOString().split('T')[0];
  return `${reminderId}_${dateStr}${timeStr ? '_' + timeStr : ''}`;
}

/**
 * Returns a new time string snoozeMinutes from now
 */
export function calculateSnoozeTime(snoozeMinutes = 5): string {
  const future = new Date(Date.now() + snoozeMinutes * 60 * 1000);
  return formatTimeAmPm(future.getHours(), future.getMinutes());
}
